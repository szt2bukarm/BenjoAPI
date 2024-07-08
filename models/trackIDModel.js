const mongoose = require("mongoose");

const trackIDSchema = new mongoose.Schema({
    track: String,
    id: String
});

const TrackID = mongoose.model("TrackID", trackIDSchema);
module.exports = TrackID