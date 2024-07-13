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
    let trackIds = [];
    let url = `https://api.spotify.com/v1/recommendations?limit=100&seed_tracks=`;

    do {
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        if (!trackIds.includes(randomTrack)) {
            trackIds.push(randomTrack);
        }
    } while (trackIds.length < 5);

    trackIds.forEach(track => url += track + ",");
    console.log(url);

    // get recommendations
    const resp = await fetch(url.slice(0, -1), {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await resp.json();

    const results = new Object();

    data.tracks.forEach((item, index) => {
        results[index] = {
            artists: item.artists.length > 1 ? item.artists.map(artist => ({
                name: artist.name,
                id: artist.id
            })) : {
                name: item.artists[0].name,
                id: item.artists[0].id
            },
            trackID: item.id,
            trackName: item.name,
            albumID: item.album.id,
            albumName: item.album.name,
            image: item.album.images[0].url,
            duration: item.duration_ms
        };
    });

    res.status(200).json({
        status: "success",
        data: results
    })

})