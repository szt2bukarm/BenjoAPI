const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const AppError = require("./utils/appError");
const errorHandler = require("./controllers/errorController");
const musicRoutes = require("./routes/musicRoutes");
const lyricsRoutes = require("./routes/lyricsRoutes");
const userRoutes = require("./routes/userRoutes");
const recentlyPlayedRoutes = require("./routes/recentlyPlayedRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
app.use("/music", musicRoutes);
app.use("/lyrics", lyricsRoutes);
app.use("/user", userRoutes);
app.use("/recentlyPlayed",recentlyPlayedRoutes);
app.use("/recommendation",recommendationRoutes);

app.use(errorHandler);
module.exports = app;
