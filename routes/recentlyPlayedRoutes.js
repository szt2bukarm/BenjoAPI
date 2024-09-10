const express = require("express");
const recentlyPlayedController = require("../controllers/recentlyPlayedController");
const authController = require("../controllers/authController");
const router = express.Router();

// router.route("/tracks")
//     .post(authController.protect,recentlyPlayedController.addRecentlyPlayedTracks)

// router.route("/albums")
//     .post(authController.protect,recentlyPlayedController.addRecentlyPlayedAlbums)

router.get("/", authController.protect, recentlyPlayedController.getRecentlyPlayed);
router.post("/", authController.protect, recentlyPlayedController.addRecentlyPlayed);

module.exports = router