const getSpotifyToken = require("../utils/getSpotifyToken");
const catchAsync = require("../utils/catchAsync");
const recentlyPlayed = require("../models/recentlyPlayedModel");

exports.getBaseRecommendations = catchAsync(async (req, res) => {
  const user = req.user;
  const recentlyPlayedTracks = await recentlyPlayed.findOne({
    userId: user._id,
  });
  if (!recentlyPlayed) {
    return res.status(200).json({
      status: "success",
      data: [],
    });
  }

  const tracks = recentlyPlayedTracks.tracks;
  let trackIds = [];
  let url = `https://api.spotify.com/v1/recommendations?limit=100&seed_tracks=`;

  do {
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
    if (!trackIds.includes(randomTrack)) {
      trackIds.push(randomTrack);
    }
  } while (trackIds.length < 5);

  trackIds.forEach((track) => (url += track + ","));

  // get recommendations
  const resp = await fetch(url.slice(0, -1), {
    headers: {
      Authorization: `Bearer ${req.token}`,
    },
  });
  const data = await resp.json();

  const results = new Object();

  data.tracks.forEach((item, index) => {
    results[index] = {
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
  });

  return res.status(200).json({
    status: "success",
    data: results,
  });
});

exports.getRecommendations = catchAsync(async (req, res) => {
  const { tracklist } = req.body;

  const tracks = tracklist.split(",");
  let selectedTracks = [];
  if (tracks.length > 5) {
    do {
      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
      if (!selectedTracks.includes(randomTrack)) {
        selectedTracks.push(randomTrack);
      }
    } while (selectedTracks.length < 5);
  } else {
    selectedTracks = tracks;
  }

  // get recommendations
  const resp = await fetch(
    `https://api.spotify.com/v1/recommendations?limit=20&seed_tracks=${selectedTracks.join(
      ","
    )}`,
    {
      headers: {
        Authorization: `Bearer ${req.token}`,
      },
    }
  );
  const data = await resp.json();

  let results = new Object();

  data.tracks.forEach((item, index) => {
    if (item.id == tracks[0] && tracks.length == 1) {
      singleTrackIncluded = true;
    }
    results[index] = {
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
  });

  // if (tracks.length == 1) {
  //   const resp = await fetch('https://api.spotify.com/v1/tracks/' + tracks[0], {
  //     headers: {
  //       Authorization: `Bearer ${req.token}`,
  //     },
  //   });
  //   const data = await resp.json();
  //   console.log(data);
  //   const resultsArray = Array.from(Object.values(results));

  //   resultsArray.unshift({
  //     artists: data.artists.length > 1 ? data.artists.map((artist) => ({
  //         name: artist.name,
  //         id: artist.id,
  //       }))
  //     : {
  //         name: data.artists[0].name,
  //         id: data.artists[0].id,
  //       },
  //     trackID: data.id,
  //     trackName: data.name,
  //     albumID: data.album.id,
  //     albumName: data.album.name,
  //     image: data.album.images[0].url,
  //     duration: data.duration_ms,
  //   })

  //   const newTracksObject = resultsArray.reduce((acc, track, index) => {
  //     acc[index] = track;
  //     return acc;
  //   }, {});

  //   results = newTracksObject;
  // }

  return res.status(200).json({
    status: "success",
    data: results,
  });
});

exports.getNewReleases = catchAsync(async (req, res) => {
  const resp = await fetch(
    "https://api.spotify.com/v1/browse/new-releases?limit=10&market=US",
    {
      headers: {
        Authorization: `Bearer ${req.token}`,
      },
    }
  );
  const data = await resp.json();

  const filteredItems = data.albums.items.filter(
    (item) => !item.name.includes("Spotify") && !item.name.includes("spotify")
  );

  const dataObj = {};

  await Promise.all(
    filteredItems.map(async (item, index) => {
      const artistResp = await fetch(
        "https://api.spotify.com/v1/artists/" + item.artists[0].id,
        {
          headers: {
            Authorization: `Bearer ${req.token}`,
          },
        }
      );
      const artistData = await artistResp.json();

      dataObj[index] = {
        id: item.id,
        name: item.name,
        image: item.images[2].url,
        artist: item.artists[0].name,
        artistID: item.artists[0].id,
        artistImage: artistData.images[0].url,
        releaseDate: item.release_date,
      };
    })
  );

  return res.status(200).json({
    status: "success",
    data: dataObj,
  });
});

exports.getTopTracks = catchAsync(async (req, res) => {
  const resp = await fetch(
    "https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF",
    {
      headers: {
        Authorization: `Bearer ${req.token}`,
      },
    }
  );
  const data = await resp.json();

  const dataObj = {};

  data.tracks.items.forEach((item, index) => {
    dataObj[index] = {
      trackID: item.track.id,
      trackName: item.track.name,
      albumID: item.track.album.id,
      albumName: item.track.album.name,
      image: item.track.album.images[0].url,
      artists:
        item.track.artists.length > 1
          ? item.track.artists.map((artist) => ({
              name: artist.name,
              id: artist.id,
            }))
          : {
              name: item.track.artists[0].name,
              id: item.track.artists[0].id,
            },
      duration: item.track.duration_ms,
    };
  });

  return res.status(200).json({
    status: "success",
    data: dataObj,
  });
});

exports.getGenres = catchAsync(async (req, res) => {
  const resp = await fetch(
    "https://api.spotify.com/v1/recommendations/available-genre-seeds",
    {
      headers: {
        Authorization: `Bearer ${req.token}`,
      },
    }
  );
  const data = await resp.json();
  return res.status(200).json({
    status: "success",
    data: data.genres,
  });
});

exports.getGenreRecommendations = catchAsync(async (req, res) => {
  const resp = await fetch(
    `https://api.spotify.com/v1/recommendations?limit=30&seed_genres=${req.body.genre}`,
    {
      headers: {
        Authorization: `Bearer ${req.token}`,
      },
    }
  );
  const data = await resp.json();

  const dataObj = {};

  data.tracks.forEach((item, index) => {
    dataObj[index] = {
      trackID: item.id,
      trackName: item.name,
      albumID: item.album.id,
      albumName: item.album.name,
      image: item.album.images[0].url,
      artists:
        item.artists?.length > 1
          ? item.artists.map((artist) => ({
              name: artist.name,
              id: artist.id,
            }))
          : {
              name: item.artists[0].name,
              id: item.artists[0].id,
            },
      duration: item.duration_ms,
    };
  });

  return res.status(200).json({
    status: "success",
    data: dataObj,
  });
});
