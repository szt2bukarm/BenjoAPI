const mongoose = require('mongoose');

const favoritesSchema = new mongoose.Schema({
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


const favorites = mongoose.model('Favorites', favoritesSchema);
module.exports = favorites