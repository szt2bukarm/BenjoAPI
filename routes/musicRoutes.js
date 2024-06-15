const express = require("express")
const musicController = require("../controllers/musicController")
const router = express.Router()

router.post("/", musicController.getMusic)

module.exports = router