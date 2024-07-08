const getSpotifyToken = require("../utils/getSpotifyToken");
const catchAsync = require("../utils/catchAsync");
const recentlyPlayed = require("../models/recentlyPlayedModel");

exports.getBaseRecommendations = catchAsync(async (req, res) => {
    const user = req.user;
    const recentlyPlayedTracks = await recentlyPlayed.findOne({ userId: user._id});
    if (!recentlyPlayed) {
        return res.status(200).json({
            status: "success",
            data: []
        })
    }

    const tracks = recentlyPlayedTracks.tracks;
    const token = await getSpotifyToken();
    console.log(token);
    let trackIds = '';
    let url = `https://api.spotify.com/v1/recommendations?limit=100&seed_tracks=`;
    tracks.forEach(track => url += track + ",");
    const resp = await fetch(url + trackIds.slice(0, -1), {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await resp.json();

    const results = new Object();

    data.tracks.forEach((item, index) => {
        console.log(item);
        results[index] = {
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

    res.status(200).json({
        status: "success",
        data: results
    })

})