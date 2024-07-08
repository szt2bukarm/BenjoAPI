module.exports = getSpotifyToken = async function() {
    const res = await 
    fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    body: new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': process.env.SPOTIFY_CLIENT_ID,
        'client_secret': process.env.SPOTIFY_CLIENT_SECRET
        })
    })
    const data = await res.json()
    return data.access_token
}