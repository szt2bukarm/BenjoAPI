const express = require("express");
const cors = require("cors");
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const musicRoutes = require("./routes/musicRoutes");
const lyricsRoutes = require("./routes/lyricsRoutes");
app.use("/music", musicRoutes);
app.use("/lyrics", lyricsRoutes);


module.exports = app
