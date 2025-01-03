const YoutubeMusicApi = require("youtube-music-api");
const Levenshtein = require("levenshtein");
const TrackID = require("../models/trackIDModel");
const catchAsync = require("../utils/catchAsync");
const api = new YoutubeMusicApi();
const ytdl = require("@distube/ytdl-core");
// const { Client } = require("youtubei")
// const yt = new Client();
// const { youtubedl } = require("@bochilteam/scraper-youtube");
const ytext = require("youtube-ext")
// import { getInfo } from 'ytscr'

api
  .initalize()
  .then((info) => {
    console.log("YoutubeMusicApi initialized successfully");
  })
  .catch((error) => {
    console.error("Error initializing YoutubeMusicApi:", error);
  });

function getStringSimilarityScore(str1, str2) {
  const distance = new Levenshtein(str1, str2).distance;
  const maxLength = Math.max(str1.length, str2.length);
  return (maxLength - distance) / maxLength;
}

function getLengthSimilarityScore(length1, length2) {
  const maxLength = Math.max(length1, length2);
  const lengthDifference = Math.abs(length1 - length2);
  return (maxLength - lengthDifference) / maxLength;
}

function cleanTitle(str) {
  return str
    .toLowerCase()
    .replace(/ft\.|feat\.|feat|FEAT/g, "")
    .trim();
}

function removeArtistFromTitle(title, artist) {
  const artistWithDash = `${artist.toLowerCase().trim()} - `;
  return title.toLowerCase().includes(artistWithDash)
    ? title.slice(artistWithDash.length).trim()
    : title;
}

function createTitleVariants(title) {
  const variants = [cleanTitle(title)];
  if (title.includes(" - ")) {
    variants.push(cleanTitle(title.split(" - ")[1]));
  }
  if (title.includes("(")) {
    variants.push(cleanTitle(title.split("(")[0].trim()));
  }
  if (title.includes("[")) {
    variants.push(cleanTitle(title.split("[")[0].trim()));
  }
  return variants;
}

function rankSearchResultsYTMusic(results, artist, title, duration) {
  return results
    .map((result) => {
      let artistScore = 0;
      if (result.artist.length !== 0) {
        artistScore = result.artist[0]
          ? getStringSimilarityScore(
              result.artist[0].name.toLowerCase(),
              artist.toLowerCase()
            )
          : getStringSimilarityScore(
              result.artist.name.toLowerCase(),
              artist.toLowerCase()
            );
      }
      const titleVariants = createTitleVariants(result.name);
      const originalVariants = createTitleVariants(title);
      let highestScore = 0;

      for (const videoVariant of titleVariants) {
        for (const originalVariant of originalVariants) {
          const titleScore = getStringSimilarityScore(
            videoVariant,
            originalVariant
          );
          if (titleScore > highestScore) {
            highestScore = titleScore;
          }
        }
      }

      const durationScore = getLengthSimilarityScore(result.duration, duration);
      const combinedScore = (artistScore + highestScore + durationScore) / 3;

      return {
        ...result,
        artistScore,
        titleScore: highestScore,
        durationScore,
        combinedScore,
      };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore);
}

function rankSearchResultsYTDL(results, artist, title, duration) {
  const artistScore = getStringSimilarityScore(
    results.channel.name.toLowerCase(),
    artist.toLowerCase()
  ); 
  const titleVariants = createTitleVariants(
    removeArtistFromTitle(results.title, results.channel.name)
  );
  const originalVariants = createTitleVariants(title);
  let highestScore = 0;
  let bestMatch;
  for (const videoVariant of titleVariants) {
    for (const originalVariant of originalVariants) {
      const titleScore = getStringSimilarityScore(
        videoVariant,
        originalVariant
      );
      if (titleScore > highestScore) {
        highestScore = titleScore;
        bestMatch = videoVariant;
      }
    }
  }

  const combinedScore = (artistScore + highestScore ) / 2;

  return {
    ...results,
    artistScore,
    titleScore: highestScore,
    combinedScore,
    bestMatch,
  };
}

const getMusic = async (req, res) => {
  try {
    const { album, artist, title, duration } = req.body;

    const track = await TrackID.findOne({ track: `${artist} ${title}` });
    if (track) {
      return res.status(200).json({
        title: track.track,
        id: track.id,
      });
    }
  
    let songResults = [];
    let videoResults = [];
  
    await api.search(`${album} ${artist} ${title}`, "song").then((result) => {
      songResults = rankSearchResultsYTMusic(
        result.content,
        artist,
        title,
        duration
      );
    });
  
    if (songResults[0].combinedScore < 0.8 || songResults[0].titleScore < 0.5) {
      await api.search(`${artist} ${title}`, "video").then((result) => {
        videoResults = result.content;
      });
  
      await TrackID.create({
        track: `${artist} ${title}`,
        id: videoResults[0].videoId,
      });
  
      return res.status(200).json({
        title: videoResults[0].name,
        id: videoResults[0].videoId,
        duration: videoResults[0].duration,
        isSaved: true,
        notExact: true,
      });
    }
  
    await TrackID.create({
      track: `${artist} ${title}`,
      id: songResults[0].videoId,
    });
  
    return res.status(200).json({
      title: songResults[0].name,
      artist: songResults[0].artist,
      id: songResults[0].videoId,
      duration: songResults[0].duration,
      artistScore: songResults[0].artistScore,
      titleScore: songResults[0].titleScore,
      durationScore: songResults[0].durationScore,
      combinedScore: songResults[0].combinedScore,
      isSaved: true,
      notExact: false,
    });
  
  } catch (error) {
    res.status(200).json({
      status: "success",
      id: null
    })
  }
};

exports.getMusic = getMusic;

exports.deleteMusic = async (req, res) => {
  await TrackID.findOneAndDelete({
    track: `${req.body.artist} ${req.body.title}`,
  });
  await getMusic(req, res);
};

exports.getVideoDetails = async (req, res) => {
  const { id, title, artist, duration } = req.body;

  const Track = await TrackID.findOne({ track: `${artist} ${title}` });
  if (Track && Track.id === id) {
    return res.status(200).json({
      updated: false,
      message: "The provided ID is the same as the one in the database.",
    });
  }
  try {
    const videoInfo = await ytext.videoInfo(id)


    const videoDetails = rankSearchResultsYTDL(
      videoInfo,
      artist,
      title
    );

    if (videoDetails.combinedScore > 0.85) {
      await TrackID.findOneAndUpdate(
        { track: `${artist} ${title}` },
        { id: videoInfo.id }
      );

      return res.status(200).json({
        updated: true,
        message:
          "Thank you for your contribution! This ID seems to match the currently playing song.",
      });
    } else {
      return res.status(200).json({
        updated: false,
        message: "This ID doesn't seems to match the currently playing song.",
      });
    }
  } catch (error) {
    return res.status(200).json({
      updated: false,
      message: "This ID doesn't seem to be correct.",
    });
  }
};

exports.getAlbum = catchAsync(async (req, res) => {
  const albumResponse = await fetch(
    `https://api.spotify.com/v1/albums/${req.body.id}`,
    {
      headers: {
        Authorization: `Bearer ${req.token}`,
      },
    }
  );
  const albumData = await albumResponse.json();

  const artistPromises = albumData.artists.map(async (artist) => {
    const artistResponse = await fetch(
      `https://api.spotify.com/v1/artists/${artist.id}`,
      {
        headers: {
          Authorization: `Bearer ${req.token}`,
        },
      }
    );
    const artistData = await artistResponse.json();
    return {
      name: artist.name,
      id: artist.id,
      image: artistData.images[0]?.url || null, 
    };
  });

  const enrichedArtists = await Promise.all(artistPromises);

  const fullAlbumData = {
    info: {
      id: albumData.id,
      name: albumData.name,
      artist: enrichedArtists,
      image: albumData.images[0]?.url,
      release: albumData.release_date,
    },
    tracks: albumData.tracks.items.map((item) => ({
      trackID: item.id,
      trackName: item.name,
      artists: item.artists.map((artist) => ({
        name: artist.name,
        id: artist.id,
      })),
      albumID: albumData.id,
      albumName: albumData.name,
      image: albumData.images[0]?.url,
      duration: item.duration_ms,
    })),
  };

  res.status(200).json({
    status: "success",
    data: fullAlbumData,
  });
});

exports.getArtist = catchAsync(async (req, res) => {
  const artistInfo = await fetch(
    `https://api.spotify.com/v1/artists/${req.body.id}`,
    {
      headers: {
        Authorization: `Bearer ${req.token}`,
      },
    }
  );
  const artistInfoData = await artistInfo.json();

  const topTracks = await fetch(
    `https://api.spotify.com/v1/artists/${req.body.id}/top-tracks?market=US&limit=5`,
    {
      headers: {
        Authorization: `Bearer ${req.token}`,
      },
    }
  );
  const topTracksData = await topTracks.json();

  const albums = await fetch(
    `https://api.spotify.com/v1/artists/${req.body.id}/albums?limit=50`,
    {
      headers: {
        Authorization: `Bearer ${req.token}`,
      },
    }
  );
  const albumsData = await albums.json();

  const artistData = {
    info: {
      id: artistInfoData.id,
      name: artistInfoData.name,
      genres: artistInfoData.genres,
      image: artistInfoData.images[0]?.url,
    },
    topTracks: topTracksData?.tracks?.map((item) => {
      return {
        artists:
          item.artists.length > 1
            ? item.artists.map((artist) => ({
                name: artist.name,
                id: artist.id,
              }))
            : {
                name: item.artists[0].name,
                id: item.artists[0].id,
              },
        trackID: item.id,
        trackName: item.name,
        albumID: item.album.id,
        albumName: item.album.name,
        image: item.album.images[0].url,
        duration: item.duration_ms,
      };
    }),
    albums: albumsData?.items?.map((item) => {
      return {
        albumID: item.id,
        artists:
          item.artists.length > 1
            ? item.artists.map((artist) => ({
                name: artist.name,
                id: artist.id,
              }))
            : {
                name: item.artists[0].name,
                id: item.artists[0].id,
              },
        type: item.album_type,
        albumName: item.name,
        image: item.images[0]?.url,
        release: item.release_date,
        totalTracks: item.total_tracks,
      };
    }),
  };

  res.status(200).json({
    status: "success",
    data: artistData,
  });
});
