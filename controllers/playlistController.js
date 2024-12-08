const catchAsync = require("../utils/catchAsync");
const Playlist = require("../models/playlistModel")
const AppError = require("../utils/appError");

exports.createPlaylist = catchAsync(async (req, res, next) => {
    const { name } = req.body
    const { username, _id } = req.user

    const playlist = await Playlist.create({
        username,
        name,
        userID: _id
    })

    res.status(201).json({
        status: "success",
        data: {
            playlist
        }
    })
})

exports.getPlaylists = catchAsync(async (req, res, next) => {
    const playlists = await Playlist.find({ userID: req.user._id })

    res.status(200).json({
        status: "success",
        data: {
            playlists
        }
    })
})

exports.deletePlaylist = catchAsync(async (req, res, next) => {
    const { playlistID } = req.body
    await Playlist.findByIdAndDelete(playlistID)
    res.status(200).json({
        status: "success",
    })
})

exports.addTrackToPlaylist = catchAsync(async (req, res, next) => {
    const { id, track } = req.body

    const playlist = await Playlist.findById(id)

    if (!playlist) {
        return next(new AppError("Playlist not found", 404))
    }

    if (playlist.tracks.includes(track)) {
        return res.status(200).json({
            status: "fail",
            message: "Track already in playlist"
        })
    }

    await Playlist.findOneAndUpdate({ _id: id }, { tracks: [...playlist.tracks, track] })
    return res.status(200).json({
        status: "success",
        message: "Track added to playlist"
    })
})

exports.updatePlaylist = async (req, res, next) => {
    const { id, tracks } = req.body
    await Playlist.findOneAndUpdate({ _id: id }, { tracks })
    res.status(200).json({
        status: "success",
    })
}

exports.getPublicPlaylists = catchAsync(async (req, res, next) => {
    const playlists = await Playlist.find({ public: true })
    res.status(200).json({
        status: "success",
        data: {
            playlists
        }
    })
})

exports.updateVisibility = catchAsync(async (req,res,next) => {
    const playlist = await Playlist.findById(req.body.id)

    if (!playlist) {
        return next(new AppError("Playlist not found", 404))
    }

    await Playlist.findOneAndUpdate({ _id: req.body.id }, { public: !playlist.public })
    return res.status(200).json({
        status: "success",
    })
})

exports.getPlaylist = catchAsync(async (req, res, next) => {
    const { id } = req.body;

    const playlist = await Playlist.findById(id)
    if (!playlist) {
        return next(new AppError("Playlist not found", 404))
    }

    if (playlist.tracks.length === 0) {
        return res.status(200).json({
            status: "success",
            data: {
                info: {
                    name: playlist.name,
                    id: playlist._id,
                    username: playlist.username,
                    tracks: playlist.tracks.length,
                    public: playlist.public
                },
                tracks: []
            },        
        })
    }


  // Split the track IDs into chunks of 50
  const chunkSize = 50;
  const trackChunks = [];
  for (let i = 0; i < playlist.tracks.length; i += chunkSize) {
    trackChunks.push(playlist.tracks.slice(i, i + chunkSize));
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
    data: {
        info: {
            name: playlist.name,
            id: playlist._id,
            username: playlist.username,
            tracks: playlist.tracks.length,
            public: playlist.public
        },
        tracks: tracks
    },
  });
});