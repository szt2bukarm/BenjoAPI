const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const recentlyPlayed = require("../models/recentlyPlayedModel");
const User = require("../models/userModel");
const getSpotifyToken = require("../utils/getSpotifyToken");

exports.getRecentlyPlayed = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("No user found", 404));
  }

  // Fetch recently played tracks and albums for the user
  const recentlyPlayedTracks = await recentlyPlayed.findOne({
    userId: user._id,
  });

  if (!recentlyPlayedTracks) {
    return res.status(200).json({
      status: "success",
      data: {
        tracks: [],
        albums: [],
      },
    });
  }

  // Prepare and fetch tracks from Spotify
  let trackUrl = "https://api.spotify.com/v1/tracks?ids=";
  recentlyPlayedTracks.tracks.forEach((track) => (trackUrl += track + ","));
  const trackResp = await fetch(trackUrl.slice(0, -1), {
    headers: {
      Authorization: `Bearer ${req.token}`,
    },
  });
  const trackData = await trackResp.json();

  const tracks = new Object();
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

  // Prepare and fetch albums from Spotify
  let albumUrl = "https://api.spotify.com/v1/albums?ids=";
  recentlyPlayedTracks.albums.forEach((album) => (albumUrl += album + ","));
  const albumResp = await fetch(albumUrl.slice(0, -1), {
    headers: {
      Authorization: `Bearer ${req.token}`,
    },
  });
  const albumData = await albumResp.json();

  const albums = new Object();
  albumData.albums.forEach((item, index) => {
    albums[index] = {
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

  // Return the combined response with both tracks and albums
  return res.status(200).json({
    status: "success",
    data: {
      tracks: tracks,
      albums: albums,
    },
  });
});

exports.addRecentlyPlayed = catchAsync(async (req, res, next) => {
  const { trackID, albumID } = req.body;
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("No user found", 404));
  }

  const recentlyPlayedEntry = await recentlyPlayed.findOne({
    userId: user._id,
  });

  const updateData = {};

  // Handle tracks
  if (trackID) {
    if (recentlyPlayedEntry) {
      const trackArray = recentlyPlayedEntry.tracks || [];
      const trackIndex = trackArray.indexOf(trackID);

      if (trackIndex !== -1) {
        trackArray.splice(trackIndex, 1);
      }

      trackArray.unshift(trackID);

      if (trackArray.length > 15) {
        trackArray.pop();
      }

      updateData.tracks = trackArray;
    } else {
      updateData.tracks = [trackID];
    }
  }

  // Handle albums
  if (albumID) {
    if (recentlyPlayedEntry) {
      const albumArray = recentlyPlayedEntry.albums || [];
      const albumIndex = albumArray.indexOf(albumID);

      if (albumIndex !== -1) {
        albumArray.splice(albumIndex, 1);
      }

      albumArray.unshift(albumID);

      if (albumArray.length > 15) {
        albumArray.pop();
      }

      updateData.albums = albumArray;
    } else {
      updateData.albums = [albumID];
    }
  }

  // If an entry exists, update it, otherwise create a new entry
  if (recentlyPlayedEntry) {
    await recentlyPlayed.findOneAndUpdate(
      { userId: user._id },
      { $set: updateData }
    );

    return res.status(200).json({
      status: "success",
      data: {
        tracks: updateData.tracks || recentlyPlayedEntry.tracks,
        albums: updateData.albums || recentlyPlayedEntry.albums,
      },
    });
  } else {
    const newEntry = await recentlyPlayed.create({
      userId: user._id,
      ...updateData,
    });

    return res.status(200).json({
      status: "success",
      data: {
        tracks: newEntry.tracks || [],
        albums: newEntry.albums || [],
      },
    });
  }
});

// exports.addRecentlyPlayedTracks = catchAsync(async (req, res, next) => {
//   const { track } = req.body;
//   const user = await User.findById(req.user.id);
//   if (!user) {
//     return next(new AppError("No user found", 404));
//   }

//   const recentlyPlayedTracks = await recentlyPlayed.findOne({
//     userId: user._id,
//   });
//   if (recentlyPlayedTracks) {
//     const trackArray = recentlyPlayedTracks.tracks;
//     const trackIndex = trackArray.indexOf(track);

//     if (trackIndex !== -1) {
//       trackArray.splice(trackIndex, 1);
//     }

//     trackArray.unshift(track);

//     if (trackArray.length > 15) {
//       trackArray.pop();
//     }

//     await recentlyPlayed.findOneAndUpdate(
//       { userId: user._id },
//       { tracks: trackArray }
//     );

//     res.status(200).json({
//       status: "success",
//       data: recentlyPlayedTracks.tracks,
//     });
//   } else {
//     const newEntry = await recentlyPlayed.create({
//       userId: user._id,
//       tracks: [track],
//     });

//     res.status(200).json({
//       status: "success",
//       data: newEntry.tracks,
//     });
//   }
// });

// exports.addRecentlyPlayedAlbums = catchAsync(async (req, res, next) => {
//   const { album } = req.body;
//   const user = await User.findById(req.user.id);
//   if (!user) {
//     return next(new AppError("No user found", 404));
//   }

//   const recentlyPlayedAlbums = await recentlyPlayed.findOne({
//     userId: user._id,
//   });
//   if (recentlyPlayedAlbums) {
//     const albumArray = recentlyPlayedAlbums.albums;
//     const albumIndex = albumArray.indexOf(album);

//     if (albumIndex !== -1) {
//       albumArray.splice(albumIndex, 1);
//     }

//     albumArray.unshift(album);

//     if (albumArray.length > 15) {
//       albumArray.pop();
//     }

//     await recentlyPlayed.findOneAndUpdate(
//       { userId: user._id },
//       { albums: albumArray }
//     );

//     res.status(200).json({
//       status: "success",
//       data: recentlyPlayedAlbums.albums,
//     });
//   } else {
//     const newEntry = await recentlyPlayed.create({
//       userId: user._id,
//       albums: [album],
//     });

//     res.status(200).json({
//       status: "success",
//       data: newEntry.albums,
//     });
//   }
// });
