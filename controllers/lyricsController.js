const token_url = "https://apic-desktop.musixmatch.com/ws/1.1/token.get?app_id=web-desktop-app-v1.0"

let currentToken = null;
let tokenTimestamp = null;
async function fetchNewToken() {
    const data = await fetch(token_url, {
        method: "GET",
        headers: {
            'authority': 'apic-desktop.musixmatch.com',
            'cookie': 'AWSELBCORS=0; AWSELB=0;'
        }
    });
    const token = await data.json();
    if (token.message.header.status_code === 200) {
        currentToken = token.message.body.user_token;
        tokenTimestamp = Date.now();
        console.log(currentToken);
        return currentToken;
    } else {
        return res.status(400).json({
            status: "error",
            data: "lyrics unavailable"
        })
    }
}

async function getToken() {
    const now = Date.now();
    if (!currentToken || (now - tokenTimestamp) >= 600000) { 
        return await fetchNewToken();
    } else {
        return currentToken;
    }
}

exports.getLyrics = async (req,res) => {
    const { album,artist,title,duration } = req.body;
    const token = await getToken();
    const url = `https://apic-desktop.musixmatch.com/ws/1.1/macro.subtitles.get?format=json&namespace=lyrics_richsynched&subtitle_format=mxm&app_id=web-desktop-app-v1.0&usertoken=${token}&q_album=${album.replaceAll(" ", "+")}&q_artist=${artist.replaceAll(" ", "+")}&q_track=${title.replaceAll(" ", "+")}&q_duration=${duration}`

    const data = await fetch(url, {
        method: "GET",
        headers: {
            'authority': 'apic-desktop.musixmatch.com',
            'cookie': 'AWSELBCORS=0; AWSELB=0;'
        }
    });

    const lyrics = await data.json();
    // console.log(lyrics);
    if (lyrics.message.header.status_code !== 200) {
        return res.status(404).json({
            status: "error",
            data: "lyrics unavailable"
        })
    } else {
        try {
            res.status(200).json({
                status: "success",
                data: JSON.parse(lyrics.message.body.macro_calls["track.subtitles.get"].message.body.subtitle_list[0].subtitle.subtitle_body)
            })
        } catch (error) {
            const data = await fetch(`https://lyrist.vercel.app/api/${title.replaceAll("(","").replaceAll(")","")}/${artist}`);
            const lyrics = await data.json();
            console.log(lyrics);
            lyrics.length != 0 ? 
            res.status(200).json({
                status: "success",
                data: lyrics.lyrics
            }) :
            res.status(404).json({
                status: "error",
                data: "lyrics unavailable"
            })
        }
    }
}