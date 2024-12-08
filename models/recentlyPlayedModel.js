const mongoose = require('mongoose');

const recentlyPlayedSchema = new mongoose.Schema({
    tracks: {
        type: Array,
    },
    albums: {
        type: Array,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
})


const recentlyPlayed = mongoose.model('RecentlyPlayed', recentlyPlayedSchema);
module.exports = recentlyPlayed