module.exports = getSpotifyToken = async function() {
    const clientIDs = process.env.SPOTIFY_CLIENT_ID.split(',');
    const clientSecrets = process.env.SPOTIFY_CLIENT_SECRET.split(',');
    const randomIndex = Math.floor(Math.random() * clientIDs.length);

    const clientID = clientIDs[randomIndex];
    const clientSecret = clientSecrets[randomIndex];

    const resp = await 
    fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    body: new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': clientID,
        'client_secret': clientSecret
        })
    })
    const data = await resp.json()
    return data.access_token
}