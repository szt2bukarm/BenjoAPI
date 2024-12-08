const express = require("express");
const recommendationController = require("../controllers/recommendationController");
const authController = require("../controllers/authController");
const router = express.Router();

// router.get(
//   "/base",
//   authController.protect,
//   recommendationController.getBaseRecommendations
// );
router.post("/input",authController.protect, recommendationController.getRecommendations);
router.get("/newreleases",authController.protect, recommendationController.getNewReleases);
router.get("/toptracks",authController.protect, recommendationController.getTopTracks);
// router.get("/genres",authController.protect, recommendationController.getGenres);
// router.post("/genre",authController.protect, recommendationController.getGenreRecommendations)

module.exports = router;
