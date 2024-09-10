const express = require("express")
const playlistController = require("../controllers/playlistController")
const authController = require("../controllers/authController")
const router = express.Router()

router.post("/", authController.protect, playlistController.createPlaylist)
router.get("/", authController.protect, playlistController.getPlaylists)
router.delete("/", authController.protect, playlistController.deletePlaylist)

router.post("/add", authController.protect, playlistController.addTrackToPlaylist)
router.post("/getplaylist", authController.protect, playlistController.getPlaylist)
router.post("/update", authController.protect, playlistController.updatePlaylist)
router.get("/public", playlistController.getPublicPlaylists)
router.post("/updateVisibility", authController.protect, playlistController.updateVisibility)

module.exports = router