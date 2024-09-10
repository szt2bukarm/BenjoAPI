const express = require('express')
const authController = require("../controllers/authController")
const router = express.Router()

router.post("/signup", authController.signUp)
router.post("/login", authController.login)
router.post('/signout', (req, res) => {
    res.clearCookie('jwt'); // Replace 'jwt' with the actual name of your JWT cookie
    res.status(200).json({ status: 'success', message: 'Signed out successfully' });
  });
router.post("/updateAccess",authController.protect, authController.updateSpotifyAccess)

module.exports = router