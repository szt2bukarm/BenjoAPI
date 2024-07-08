const express = require("express");
const recentlyPlayedController = require("../controllers/recentlyPlayedController");
const authController = require("../controllers/authController");
const router = express.Router();

router.route("/tracks")
    .get(authController.protect,recentlyPlayedController.getRecentlyPlayedTracks)
    .post(authController.protect,recentlyPlayedController.addRecentlyPlayedTracks)

router.route("/albums")
    .get(authController.protect,recentlyPlayedController.getRecentlyPlayedAlbums)
    .post(authController.protect,recentlyPlayedController.addRecentlyPlayedAlbums)

module.exports = router