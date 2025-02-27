const getSpotifyToken = require("../utils/getSpotifyToken");

exports.search = async (req, res) => {
  const { query } = req.body;
  const resp = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=album%2Cartist%2Ctrack`,
    {
      headers: {
        Authorization: `Bearer ${req.token}`,
      },
    }
  );
  const data = await resp.json();

  const artistData = data.artists?.items.map((item) => {
    return {
      id: item?.id,
      name: item?.name,
      image: item?.images[0]?.url,
    };
  });

  const albumData = data.albums?.items.map((item) => {
    return {
      id: item?.id,
      name: item?.name,
      artists:
        item?.artists.length > 1
          ? item.artists.map((artist) => ({
              name: artist.name,
              id: artist.id,
            }))
          : {
              name: item?.artists[0].name,
              id: item?.artists[0].id,
            },
      image: item?.images[0]?.url,
      releaseDate: item?.release_date,
    };
  });

  const trackData = data.tracks?.items.map((item) => {
    return {
      trackID: item?.id,
      type: item?.album.album_type,
      albumName: item?.album.name,
      albumID: item?.album.id,
      artists:
        item?.artists.length > 1
          ? item?.artists.map((artist) => ({
              name: artist.name,
              id: artist.id,
            }))
          : {
              name: item?.artists[0].name,
              id: item?.artists[0].id,
            },
      image: item?.album?.images[0]?.url,
      trackName: item?.name,
      duration: item?.duration_ms,
    };
  });

  res.status(200).json({
    status: "success",
    track: trackData,
    album: albumData,
    artist: artistData,
  });
};
