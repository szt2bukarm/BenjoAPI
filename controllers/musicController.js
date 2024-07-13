const YoutubeMusicApi = require('youtube-music-api');
const Levenshtein = require('levenshtein');
const TrackID = require('../models/trackIDModel');
const api = new YoutubeMusicApi();

api.initalize().then(info => {
    console.log('YoutubeMusicApi initialized successfully');
}).catch(error => {
    console.error('Error initializing YoutubeMusicApi:', error);
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

function rankSearchResults(results, artist,title, duration) {
    return results.map(result => {
        let artistScore = 0;
        if (result.artist.length !== 0) {
            artistScore = result.artist[0] ?
            getStringSimilarityScore(result.artist[0].name.toLowerCase(), artist.toLowerCase()) : 
            getStringSimilarityScore(result.artist.name.toLowerCase(),artist.toLowerCase());
        }
        if (result.artist.length != 0) console.log(result.artist);
        const titleScore = getStringSimilarityScore(result.name.toLowerCase(), title.toLowerCase());
        const durationScore = getLengthSimilarityScore(result.duration, duration);
        const combinedScore = (artistScore + titleScore + durationScore) / 3;
        return { ...result, artistScore, titleScore, durationScore, combinedScore };
    }).sort((a, b) => b.combinedScore - a.combinedScore); 
}


exports.getMusic = async (req, res) => {
    const { album,artist,title, duration } = req.body;

    const track = await TrackID.findOne({ track: `${artist} ${title}` });
    if (track) {
        return res.status(200).json({
            track
        })
    }

    let songResults = [];
    let videoResults = [];
    
    await api.search(`${album} ${artist} ${title}`,"song").then(result => {
        songResults = rankSearchResults(result.content,artist,title,duration)   
    })

    if (songResults[0].combinedScore < 0.80 || songResults[0].titleScore < 0.5) {
        await api.search(`${artist} ${title}`,"video").then(result => {
            videoResults = result.content
        })

        await TrackID.create({
            track: `${artist} ${title}`,
            id: videoResults[0].videoId
        })

        return res.status(200).json({
            title: videoResults[0].name,
            id: videoResults[0].videoId,
            duration: videoResults[0].duration,
            isSaved: true,
            notExact: true
        })
    }

    if (songResults[0].artistScore > 0.9 && songResults[0].titleScore > 0.9 && songResults[0].durationScore > 0.9 ||
        songResults[0].artistScore > 0.9 && songResults[0].titleScore > 0.5 && songResults[0].durationScore > 0.9 ||
        songResults[0].titleScore > 0.9 && songResults[0].durationScore > 0.98 ||
        songResults[0].combinedScore > 0.85 
    ) {
        await TrackID.create({
            track: `${artist} ${title}`,
            id: songResults[0].videoId
        })

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
            notExact: false
         })
    }



    res.status(200).json({
        title: songResults[0].name,
        artist: songResults[0].artist,
        id: songResults[0].videoId,
        duration: songResults[0].duration,
        artistScore: songResults[0].artistScore,
        titleScore: songResults[0].titleScore,
        durationScore: songResults[0].durationScore,
        combinedScore: songResults[0].combinedScore,
        isSaved: false,
        notExact: false
    });
};


