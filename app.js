const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
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
