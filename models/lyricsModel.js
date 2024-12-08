const mongoose = require('mongoose');

const lyricsSchema = new mongoose.Schema({
    track: String,
    lyrics: Object
})


const Lyrics = mongoose.model('lyrics', lyricsSchema);
module.exports = Lyrics