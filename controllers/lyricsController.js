const token_url =
  "https://apic-desktop.musixmatch.com/ws/1.1/token.get?app_id=web-desktop-app-v1.0";

let currentToken = null;
let tokenTimestamp = null;
async function fetchNewToken(req, res) {
  try {
    const data = await fetch(token_url, {
      method: "GET",
      headers: {
        authority: "apic-desktop.musixmatch.com",
        cookie: "AWSELBCORS=0; AWSELB=0;",
      },
    });
    const token = await data.json();
    if (token.message.header.status_code === 200) {
      currentToken = token.message.body.user_token;
      tokenTimestamp = Date.now();
      return currentToken;
    } else {
      return null;
    }
  } catch (error) {
    return res.status(200).json({
      status: "success",
      synced: false,
      data: {
        text: "",
        time: 0,
      },
    });
  }
}

function parseLyrics(lyrics) {
  const lines = lyrics.split("\n");
  const result = [];

  lines.forEach((line) => {
    const match = line.match(/\[(\d{2}):(\d{2}\.\d{2})\] (.+)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      const text = match[3];
      const time = minutes * 60 + seconds;
      result.push({ text, time });
    }
  });

  return result;
}

async function getToken() {
  const now = Date.now();
  if (!currentToken || now - tokenTimestamp >= 600000) {
    return await fetchNewToken();
  } else {
    return currentToken;
  }
}

exports.getLyrics = async (req, res) => {
  try {
    const { album, artist, title, duration } = req.body;

    // LRCLIB
    const LRCLIB_resp = await fetch(
      `https://lrclib.net/api/get?artist_name=${artist.replaceAll(
        " ",
        "+"
      )}&album_name=${album.replaceAll(" ", "+")}&track_name=${title.replaceAll(
        " ",
        "+"
      )}&duration=${Math.trunc(duration / 1000)}`
    );
    const LRCLIB_data = await LRCLIB_resp.json();

    if (LRCLIB_data.syncedLyrics !== null && LRCLIB_data.statusCode !== 404) {
      const lyrics = parseLyrics(LRCLIB_data.syncedLyrics);
      return res.status(200).json({
        status: "success",
        synced: true,
        data: lyrics,
      });
    }

    // Musixmatch
    const token = await getToken();
    const musixmatch_resp = await fetch(
      `https://apic-desktop.musixmatch.com/ws/1.1/macro.subtitles.get?format=json&namespace=lyrics_richsynched&subtitle_format=mxm&app_id=web-desktop-app-v1.0&usertoken=${token}&q_album=${album.replaceAll(
        " ",
        "+"
      )}&q_artist=${artist.replaceAll(" ", "+")}&q_track=${title.replaceAll(
        " ",
        "+"
      )}&q_duration=${duration}`,
      {
        method: "GET",
        headers: {
          authority: "apic-desktop.musixmatch.com",
          cookie: "AWSELBCORS=0; AWSELB=0;",
        },
      }
    );
    const musixmatch_data = await musixmatch_resp.json();

    if (musixmatch_data.message.header.status_code === 200) {
      try {
        const lyricsData = JSON.parse(
          musixmatch_data.message.body.macro_calls["track.subtitles.get"]
            .message.body.subtitle_list[0].subtitle.subtitle_body
        ).map((item) => ({
          text: item.text,
          time: item.time.total,
        }));

        return res.status(200).json({
          status: "success",
          synced: true,
          data: lyricsData,
        });
      } catch (error) {
        // Handle JSON parse error
        return res.status(200).json({
          status: "success",
          synced: false,
          data: {
            text: "",
            time: 0,
          },
        });
      }
    }

    // Default response if no lyrics are found
    return res.status(200).json({
      status: "success",
      synced: false,
      data: {
        text: "",
        time: 0,
      },
    });
  } catch (error) {
    // Handle any other errors
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};
