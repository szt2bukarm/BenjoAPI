const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Favorites = require("../models/favoritesModel");
const User = require("../models/userModel");

exports.getFavoriteIDs = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("No user found", 404));
  }

  const favoriteID = await Favorites.findOne({ userId: user._id });

  if (!favoriteID) {
    return res.status(200).json({
      status: "success",
      data: {
        tracks: [],
        albums: [],
      },
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      tracks: favoriteID.tracks,
      albums: favoriteID.albums,
    },
  });
});

exports.getFavoriteTracks = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("No user found", 404));
  }

  const favoritedTracks = await Favorites.findOne({ userId: user._id });

  if (!favoritedTracks || favoritedTracks.tracks.length === 0) {
    return res.status(200).json({
      status: "success",
      data: [],
    });
  }

  // Split the track IDs into chunks of 50
  const chunkSize = 50;
  const trackChunks = [];
  for (let i = 0; i < favoritedTracks.tracks.length; i += chunkSize) {
    trackChunks.push(favoritedTracks.tracks.slice(i, i + chunkSize));
  }

  const tracks = {};

  // Make separate requests for each chunk
  for (const chunk of trackChunks) {
    let trackUrl = `https://api.spotify.com/v1/tracks?ids=${chunk.join(",")}`;
    const trackResp = await fetch(trackUrl, {
      headers: {
        Authorization: `Bearer ${req.token}`,
      },
    });
    const trackData = await trackResp.json();

    // Map the track data into the result object
    trackData.tracks.forEach((item, index) => {
      tracks[index] = {
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
        trackName: item.name,
        trackID: item.id,
        albumName: item.album.name,
        albumID: item.album.id,
        image: item.album.images[0].url,
        duration: item.duration_ms,
      };
    });
  }

  return res.status(200).json({
    status: "success",
    data: tracks,
  });
});


const fetchAlbums = async (ids, token) => {
  const albumUrl = `https://api.spotify.com/v1/albums?ids=${ids}`;
  const albumResp = await fetch(albumUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return albumResp.json();
};

exports.getFavoriteAlbums = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("No user found", 404));
  }

  const favoritedAlbums = await Favorites.findOne({ userId: user._id });

  if (!favoritedAlbums || favoritedAlbums.albums.length === 0) {
    return res.status(200).json({
      status: "success",
      data: [],
    });
  }

  const albumIds = favoritedAlbums.albums;
  const chunkSize = 20;
  const albumChunks = [];

  for (let i = 0; i < albumIds.length; i += chunkSize) {
    albumChunks.push(albumIds.slice(i, i + chunkSize));
  }

  // Fetch all chunks in parallel
  const albumDataChunks = await Promise.all(
    albumChunks.map((chunk) => fetchAlbums(chunk.join(","), req.token))
  );

  const albums = {};
  let index = 0;

  // Combine all results
  albumDataChunks.forEach((albumData) => {
    albumData.albums.forEach((item) => {
      albums[index++] = {
        artists: {
          name: item.artists[0].name,
          id: item.artists[0].id,
        },
        albumName: item.name,
        albumID: item.id,
        image: item.images[0].url,
        trackNo: item.total_tracks,
        type: item.album_type,
      };
    });
  });

  return res.status(200).json({
    status: "success",
    data: albums,
  });
});

exports.addFavoriteTrack = catchAsync(async (req, res, next) => {
  const { track } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError("No user found", 404));
  }

  const favoritedTracks = await Favorites.findOne({
    userId: user._id,
  });
  if (favoritedTracks) {
    const trackArray = favoritedTracks.tracks;
    const trackIndex = trackArray.indexOf(track);

    if (trackIndex !== -1) {
      trackArray.splice(trackIndex, 1);
    } else {
      trackArray.unshift(track);
    }

    await Favorites.findOneAndUpdate(
      { userId: user._id },
      { tracks: trackArray }
    );

    res.status(200).json({
      status: "success",
      data: favoritedTracks.tracks,
    });
  } else {
    const newEntry = await Favorites.create({
      userId: user._id,
      tracks: [track],
    });

    res.status(200).json({
      status: "success",
      data: newEntry.tracks,
    });
  }
});

exports.addFavoriteAlbum = catchAsync(async (req, res, next) => {
  const { album } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError("No user found", 404));
  }

  const favoritedAlbums = await Favorites.findOne({
    userId: user._id,
  });
  if (favoritedAlbums) {
    const albumArray = favoritedAlbums.albums;
    const albumIndex = albumArray.indexOf(album);

    if (albumIndex !== -1) {
      albumArray.splice(albumIndex, 1);
    } else {
      albumArray.unshift(album);
    }

    await Favorites.findOneAndUpdate(
      { userId: user._id },
      { albums: albumArray }
    );

    res.status(200).json({
      status: "success",
      data: favoritedAlbums.albums,
    });
  } else {
    const newEntry = await Favorites.create({
      userId: user._id,
      albums: [album],
    });

    res.status(200).json({
      status: "success",
      data: newEntry.albums,
    });
  }
});
