const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const recentlyPlayed = require("../models/recentlyPlayedModel");
const User = require("../models/userModel");
const getSpotifyToken = require("../utils/getSpotifyToken");


exports.getRecentlyPlayedTracks = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id)
    
    if (!user) {
        return next(new AppError('No user found', 404));
    }

    const recentlyPlayedTracks = await recentlyPlayed.findOne({userId: user._id})

    if (!recentlyPlayedTracks) {
        return res.status(200).json({
            status: "success",
            data: []
        })
    }

    let url = 'https://api.spotify.com/v1/tracks?ids='
    console.log(recentlyPlayedTracks);
    const token = await getSpotifyToken();
    console.log(token);
    recentlyPlayedTracks.tracks.forEach(track => url += track + ',');
    const resp = await fetch(url.slice(0, -1), {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await resp.json();

    const tracks = new Object();

    data.tracks.forEach((item, index) => {
        console.log(item);
        tracks[index] = {
            artists: item.artists.length > 1 ? item.artists.map(artist => ({
                name: artist.name,
                id: artist.id
            })) : {
                name: item.artists[0].name,
                id: item.artists[0].id
            },
            trackName: item.name,
            trackID: item.id,
            albumID: item.album.id,
            image: item.album.images[0].url,
            duration: item.duration_ms
        };
    });

    console.log(tracks);

    
    return res.status(200).json({
        status: "success",
        data: tracks
    })
})

exports.getRecentlyPlayedAlbums = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id)
    
    if (!user) {
        return next(new AppError('No user found', 404));
    }

    const recentlyPlayedAlbums = await recentlyPlayed.findOne({userId: user._id})

    if (!recentlyPlayedAlbums) {
        return res.status(200).json({
            status: "success",
            data: []
        })
    }

    let url = 'https://api.spotify.com/v1/albums?ids='
    const token = await getSpotifyToken();
    console.log(token);
    recentlyPlayedAlbums.albums.forEach(album => url += album + ',');
    const resp = await fetch(url.slice(0, -1), {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await resp.json();

    const albums = new Object();

    data.albums.forEach((item, index) => {
        console.log(item);
        albums[index] = {
            artist: {
                name: item.artists[0].name,
                id: item.artists[0].id
            },
            albumName: item.name,
            albumID: item.id,
            image: item.images[0].url,
            trackNo: item.total_tracks,
            type: item.album_type
        };
    });

    console.log(albums);

    
    return res.status(200).json({
        status: "success",
        data: albums
    })
})

exports.addRecentlyPlayedTracks = catchAsync(async (req, res, next) => {
    const { track } = req.body;
    const user = await User.findById(req.user.id)
    if (!user) {
        return next(new AppError('No user found', 404));
    }

    const recentlyPlayedTracks = await recentlyPlayed.findOne({userId: user._id})
    if (recentlyPlayedTracks) {

        const trackArray = recentlyPlayedTracks.tracks;
        const trackIndex = trackArray.indexOf(track);
        
        if (trackIndex !== -1) {
            trackArray.splice(trackIndex, 1);
        }
        
        trackArray.unshift(track);
        
        if (trackArray.length > 15) {
            trackArray.pop();
        }
        
        await recentlyPlayed.findOneAndUpdate(
            { userId: user._id },
            { tracks: trackArray }
        );

        res.status(200).json({
            status: "success",
            data: recentlyPlayedTracks.tracks
        })
    } else {
        const newEntry = await recentlyPlayed.create({
            userId: user._id,
            tracks: [track]
        })

        res.status(200).json({
            status: "success",
            data: newEntry.tracks
        })
    }
})

exports.addRecentlyPlayedAlbums = catchAsync(async (req, res, next) => {
    const { album } = req.body;
    const user = await User.findById(req.user.id)
    if (!user) {
        return next(new AppError('No user found', 404));
    }

    const recentlyPlayedAlbums = await recentlyPlayed.findOne({userId: user._id})
    if (recentlyPlayedAlbums) {

        const albumArray = recentlyPlayedAlbums.albums;
        const albumIndex = albumArray.indexOf(album);
        
        if (albumIndex !== -1) {
            albumArray.splice(albumIndex, 1);
        }
        
        albumArray.unshift(album);
        
        if (albumArray.length > 15) {
            albumArray.pop();
        }
        
        await recentlyPlayed.findOneAndUpdate(
            { userId: user._id },
            { albums: albumArray }
        );

        res.status(200).json({
            status: "success",
            data: recentlyPlayedAlbums.albums
        })
    } else {
        const newEntry = await recentlyPlayed.create({
            userId: user._id,
            albums: [album]
        })

        res.status(200).json({
            status: "success",
            data: newEntry.albums
        })
    }
})