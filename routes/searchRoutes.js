const express = require("express");
const searchController = require("../controllers/searchController");
const authController = require("../controllers/authController");
const router = express.Router();

router.post("/", authController.protect, searchController.search);

module.exports = router