const express = require("express")
const musicController = require("../controllers/musicController")
const authConteoller = require("../controllers/authController")
const router = express.Router()

router.post("/", musicController.getMusic)
router.delete("/", musicController.deleteMusic)
router.post("/track", musicController.getVideoDetails)
router.post("/album",authConteoller.protect, musicController.getAlbum)
router.post("/artist",authConteoller.protect, musicController.getArtist)

module.exports = router