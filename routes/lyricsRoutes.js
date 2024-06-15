const express = require("express")
const lyricsController = require("../controllers/lyricsController")
const router = express.Router()

router.post("/", lyricsController.getLyrics)

module.exports = router