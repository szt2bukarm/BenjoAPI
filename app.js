const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const axios = require("axios");
const sharp = require('sharp');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

function rgbToHex(r, g, b) {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

app.post('/extractColor', express.json(), async (req, res) => {
  try {
      const imageUrl = req.body.imageUrl; 
      
      const response = await axios({
          method: 'get',
          url: imageUrl,
          responseType: 'arraybuffer',
      });

      const imageBuffer = Buffer.from(response.data);
      
      sharp(imageBuffer)
          .resize(10, 10) 
          .raw() 
          .toBuffer()
          .then((data) => {
              const pixels = data.length / 3;
              let r = 0, g = 0, b = 0;

              for (let i = 0; i < data.length; i += 3) {
                  r += data[i];
                  g += data[i + 1];
                  b += data[i + 2];
              }

              r = Math.round(r / pixels);
              g = Math.round(g / pixels);
              b = Math.round(b / pixels);

              const hexColor = rgbToHex(r, g, b);

              res.json({ dominantColor: hexColor });
          })
          .catch((err) => {
              console.error(err);
              res.status(500).send('Error processing the image');
          });
  } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching the image');
  }
});

const AppError = require("./utils/appError");
const errorHandler = require("./controllers/errorController");
const musicRoutes = require("./routes/musicRoutes");
const lyricsRoutes = require("./routes/lyricsRoutes");
const userRoutes = require("./routes/userRoutes");
const recentlyPlayedRoutes = require("./routes/recentlyPlayedRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const searchRoutes = require("./routes/searchRoutes");
const favoritesRoutes = require("./routes/favoritesRoutes");
const playlistRoutes = require("./routes/playlistsRoutes")
app.get("/status", async (req, res) => {
  return res.status(200).json({
    status: "success",
    message: "running",
  })
})
app.use("/music", musicRoutes);
app.use("/lyrics", lyricsRoutes);
app.use("/user", userRoutes);
app.use("/recentlyPlayed", recentlyPlayedRoutes);
app.use("/recommendation", recommendationRoutes);
app.use("/search", searchRoutes);
app.use("/favorites", favoritesRoutes);
app.use("/playlists", playlistRoutes)

app.use(errorHandler);
module.exports = app;
