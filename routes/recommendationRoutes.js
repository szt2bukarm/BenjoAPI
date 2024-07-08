const express = require("express");
const recommendationController = require("../controllers/recommendationController");
const authController = require("../controllers/authController");
const router = express.Router();

router.get("/base", authController.protect,recommendationController.getBaseRecommendations);

module.exports = router