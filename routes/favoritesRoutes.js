const express = require("express")
const favoritesController = require("../controllers/favoritesContoller")
const authConteoller = require("../controllers/authController")
const router = express.Router()

router.get("/tracks", authConteoller.protect, favoritesController.getFavoriteTracks)
router.get("/albums", authConteoller.protect, favoritesController.getFavoriteAlbums)
router.post("/album",authConteoller.protect, favoritesController.addFavoriteAlbum)
router.post("/track",authConteoller.protect, favoritesController.addFavoriteTrack)
router.get("/ids", authConteoller.protect, favoritesController.getFavoriteIDs)

module.exports = router