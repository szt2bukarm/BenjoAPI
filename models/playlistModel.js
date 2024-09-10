const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    userID : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    name: String,
    username: String,
    public: {type: Boolean, default: true},
    tracks: Array,  
})

const Playlist = mongoose.model('Playlist', playlistSchema);
module.exports = Playlist