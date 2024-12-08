const catchAsync = require("../utils/catchAsync");

exports.getNewReleases = catchAsync(async (req, res) => {
  const resp = await fetch(
    "https://api.spotify.com/v1/browse/new-releases?limit=10&market=US",
    {
      headers: {
        Authorization: `Bearer ${req.token}`,
      },
    }
  );
  const data = await resp.json();

  const filteredItems = data.albums.items.filter(
    (item) => !item.name.includes("Spotify") && !item.name.includes("spotify")
  );

  const dataObj = {};

  await Promise.all(
    filteredItems.map(async (item, index) => {
      const artistResp = await fetch(
        "https://api.spotify.com/v1/artists/" + item.artists[0].id,
        {
          headers: {
            Authorization: `Bearer ${req.token}`,
          },
        }
      );
      const artistData = await artistResp.json();

      dataObj[index] = {
        id: item.id,
        name: item.name,
        image: item.images[2].url,
        artist: item.artists[0].name,
        artistID: item.artists[0].id,
        artistImage: artistData.images[0].url,
        releaseDate: item.release_date,
      };
    })
  );

  return res.status(200).json({
    status: "success",
    data: dataObj,
  });
});

exports.getTopTracks = catchAsync(async (req, res) => {
  const resp = await fetch(
    "https://api.spotify.com/v1/playlists/" + process.env.TOP_TRACK_PLAYLIST,
    {
      headers: {
        Authorization: `Bearer ${req.token}`,
      },
    }
  );
  const data = await resp.json();

  const dataObj = {};

  data.tracks.items.forEach((item, index) => {
    dataObj[index] = {
      trackID: item.track.id,
      trackName: item.track.name,
      albumID: item.track.album.id,
      albumName: item.track.album.name,
      image: item.track.album.images[0].url,
      artists:
        item.track.artists.length > 1
          ? item.track.artists.map((artist) => ({
              name: artist.name,
              id: artist.id,
            }))
          : {
              name: item.track.artists[0].name,
              id: item.track.artists[0].id,
            },
      duration: item.track.duration_ms,
    };
  });

  return res.status(200).json({
    status: "success",
    data: dataObj,
  });
});



const getSimiliarTracks = async (track,artist) => {
  const resp = await fetch(
  `https://ws.audioscrobbler.com/2.0/?method=track.getsimilar&track=${track}&artist=${artist}&api_key=be2eb0afd347641494581a799604982c&format=json`);
  const data = await resp.json();
  const filteredItems = data?.similartracks?.track?.map((track) => {
    return {
      name: track.name,
      artist: track.artist.name,
    };
  });

  return filteredItems?.sort(() => Math.random() - 0.5).slice(0, 10);
}

const shuffleObject = (obj) => {
  const entries = Object.entries(obj);
  const shuffledEntries = entries.sort(() => Math.random() - 0.5);
  return Object.fromEntries(shuffledEntries);
};


exports.getRecommendations = catchAsync(async (req, res) => {
  const { track, artist } = req.body;
  const tracks = track.split(";");
  const artists = artist.split(";");

  const dataObj = {};

  await Promise.all(
    tracks.map(async (track, index) => {
      const data = await getSimiliarTracks(track, artists[index]);
      if (!data) return;
      await Promise.all(
        data.map(async (item, i) => {
          const data = await getSpotifyTrackId(item.name, item.artist, req.token);
          dataObj[`${track}${i}`] = {
            trackID: data.tracks.items[0].id,
            trackName: data.tracks.items[0].name,
            albumID: data.tracks.items[0].album.id,
            albumName: data.tracks.items[0].album.name,
            image: data.tracks.items[0].album.images[0].url,
            artists:
              data.tracks.items[0].artists.length > 1
                ? data.tracks.items[0].artists.map((artist) => ({
                    name: artist.name,
                    id: artist.id,
                  }))
                : {
                    name: data.tracks.items[0].artists[0].name,
                    id: data.tracks.items[0].artists[0].id,
                  },
            duration: data.tracks.items[0].duration_ms,
          };
        })
      );
    })
  );

  return res.status(200).json({
    status: "success",
    data: shuffleObject(dataObj),
  });
});

const getSpotifyTrackId = async (trackName, artistName, token) => {
  const query = encodeURIComponent(`${trackName} ${artistName}`);
  const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (data.tracks && data.tracks.items && data.tracks.items.length > 0) {
    return data;
  }
  return null; 
};


// const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// const getRecommendedTracks = async (artist, token) => {
//   const artistAlbumsResp = await fetch(
//     "https://api.spotify.com/v1/artists/" + artist + "/albums",
//     {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     }
//   );
//   const artistAlbumsData = await artistAlbumsResp.json();
//   console.log(artistAlbumsData.items.length);

//   const relatedArtists = artistAlbumsData.items.reduce((acc, item) => {
//     item.artists.forEach((artist) => {
//       if (acc.includes(artist.id) || artist.id == artist) return;
//       acc.push(artist.id);
//     });
//     return acc.sort(() => Math.random() - 0.5).slice(0, 3);
//   }, []);

//   // Use delay to slow down the fetch requests
//   const relatedArtistsAlbums = [];
//   for (const artist of relatedArtists) {
//     const resp = await fetch(
//       "https://api.spotify.com/v1/artists/" + artist + "/albums",
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );
//     const data = await resp.json();
//     relatedArtistsAlbums.push(data);
//     await delay(10); // Delay of 500ms between requests
//   }

//   const relatedArtistsAlbumsData = relatedArtistsAlbums.reduce((acc, item) => {
//     item.items.forEach((album) => {
//       acc.push({
//         id: album.id,
//         name: album.name,
//         image: album.images[0].url,
//         artist: album.artists[0].name,
//         artistID: album.artists[0].id,
//       });
//     });
//     return acc;
//   }, []);

//   // Delay between fetching track data
//   const getTrackFromArtist = [];
//   for (const album of relatedArtistsAlbumsData) {
//     const resp = await fetch(
//       "https://api.spotify.com/v1/albums/" + album.id,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );
//     const data = await resp.json();
//     getTrackFromArtist.push(data);
//     await delay(10); // Delay of 500ms between requests
//   }

//   const allTracks = getTrackFromArtist.reduce((acc, album) => {
//     if (album.tracks && album.tracks.items) {
//       album.tracks.items.forEach((track) => {
//         acc.push({
//           trackID: track.id,
//           trackName: track.name,
//           artist: track.artists.map((artist) => ({
//             name: artist.name,
//             id: artist.id,
//           })),
//           albumName: album.name,
//           albumID: album.id,
//           image: album.images?.[0]?.url,
//           duration: track.duration_ms,
//         });
//       });
//     }
//     return acc.sort(() => Math.random() - 0.5).slice(0, 3);
//   }, []);

//   return allTracks;
// }



// exports.getRecommendations = catchAsync(async (req, res) => {
//   const artists = req.body.artist.split(';');
//   console.log(req.body.artist);
//   const dataObj = {};
//   for (let a of artists) {
//     const data = await getRecommendedTracks(a,req.token);
//     data.forEach((item, index) => {
//       dataObj[`${a}${index}`] = {
//         trackID: item.trackID,
//         trackName: item.trackName,
//         albumID: item.albumID,
//         albumName: item.albumName,
//         image: item.image,
//         artists: item.artist.length > 1 ? item.artist.map((artist) => ({
//           name: artist.name,
//           id: artist.id,
//         })) : ({
//           name: item.artist[0].name,
//           id: item.artist[0].id,
//         }),
//         duration: item.duration,
//       };
//     });
//   }

//   // const tracks = await getRecommendedTracks(req.body.artist,req.token);
//   return res.status(200).json({
//     status: "success",
//     data: shuffleObject(dataObj),
//   });
// });


// SPOTIFY API ENDPOINT DEPRECATED

// exports.getGenres = catchAsync(async (req, res) => {
//   const resp = await fetch(
//     "https://api.spotify.com/v1/recommendations/available-genre-seeds",
//     {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     }
//   );
//   const data = await resp.json();
//   return res.status(200).json({
//     status: "success",
//     data: data.genres,
//   });
// });

// exports.getGenreRecommendations = catchAsync(async (req, res) => {
//   const resp = await fetch(
//     `https://api.spotify.com/v1/recommendations?limit=30&seed_genres=${req.body.genre}`,
//     {
//       headers: {
//         Authorization: `Bearer ${req.token}`,
//       },
//     }
//   );
//   const data = await resp.json();

//   const dataObj = {};

//   data.tracks.forEach((item, index) => {
//     dataObj[index] = {
//       trackID: item.id,
//       trackName: item.name,
//       albumID: item.album.id,
//       albumName: item.album.name,
//       image: item.album.images[0].url,
//       artists:
//         item.artists?.length > 1
//           ? item.artists.map((artist) => ({
//               name: artist.name,
//               id: artist.id,
//             }))
//           : {
//               name: item.artists[0].name,
//               id: item.artists[0].id,
//             },
//       duration: item.duration_ms,
//     };
//   });

//   return res.status(200).json({
//     status: "success",
//     data: dataObj,
//   });
// });


// exports.getBaseRecommendations = catchAsync(async (req, res) => {
//   const user = req.user;
//   const recentlyPlayedTracks = await recentlyPlayed.findOne({
//     userId: user._id,
//   });
//   if (!recentlyPlayed) {
//     return res.status(200).json({
//       status: "success",
//       data: [],
//     });
//   }

//   const tracks = recentlyPlayedTracks.tracks;
//   let trackIds = [];
//   let url = `https://api.spotify.com/v1/recommendations?limit=100&seed_tracks=`;

//   do {
//     const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
//     if (!trackIds.includes(randomTrack)) {
//       trackIds.push(randomTrack);
//     }
//   } while (trackIds.length < 5);

//   trackIds.forEach((track) => (url += track + ","));

//   // get recommendations
//   const resp = await fetch(url.slice(0, -1), {
//     headers: {
//       Authorization: `Bearer ${req.token}`,
//     },
//   });
//   const data = await resp.json();

//   const results = new Object();

//   data.tracks.forEach((item, index) => {
//     results[index] = {
//       artists:
//         item.artists.length > 1
//           ? item.artists.map((artist) => ({
//               name: artist.name,
//               id: artist.id,
//             }))
//           : {
//               name: item.artists[0].name,
//               id: item.artists[0].id,
//             },
//       trackID: item.id,
//       trackName: item.name,
//       albumID: item.album.id,
//       albumName: item.album.name,
//       image: item.album.images[0].url,
//       duration: item.duration_ms,
//     };
//   });

//   return res.status(200).json({
//     status: "success",
//     data: results,
//   });
// });

// exports.getRecommendations = catchAsync(async (req, res) => {
//   const { tracklist } = req.body;

//   const tracks = tracklist.split(",");
//   let selectedTracks = [];
//   if (tracks.length > 5) {
//     do {
//       const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
//       if (!selectedTracks.includes(randomTrack)) {
//         selectedTracks.push(randomTrack);
//       }
//     } while (selectedTracks.length < 5);
//   } else {
//     selectedTracks = tracks;
//   }

//   // get recommendations
//   const resp = await fetch(
//     `https://api.spotify.com/v1/recommendations?limit=20&seed_tracks=${selectedTracks.join(
//       ","
//     )}`,
//     {
//       headers: {
//         Authorization: `Bearer ${req.token}`,
//       },
//     }
//   );
//   const data = await resp.json();

//   let results = new Object();

//   data.tracks.forEach((item, index) => {
//     if (item.id == tracks[0] && tracks.length == 1) {
//       singleTrackIncluded = true;
//     }
//     results[index] = {
//       artists:
//         item.artists.length > 1
//           ? item.artists.map((artist) => ({
//               name: artist.name,
//               id: artist.id,
//             }))
//           : {
//               name: item.artists[0].name,
//               id: item.artists[0].id,
//             },
//       trackID: item.id,
//       trackName: item.name,
//       albumID: item.album.id,
//       albumName: item.album.name,
//       image: item.album.images[0].url,
//       duration: item.duration_ms,
//     };
//   });

 

//   return res.status(200).json({
//     status: "success",
//     data: results,
//   });
// });
