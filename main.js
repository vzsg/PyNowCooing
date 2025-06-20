// ========== CONFIG ==========
var interval = 1; // query interval in seconds
var musicSource = "lastfm"; // "lastfm" or "spotify"

// ========== LAST.FM SETTINGS ==========
var username = 'kloporte1'; // your Last.FM username
var apiKey = ""; // your Last.FM api key

// ========== SPOTIFY SETTINGS ==========
/*
  --- SPOTIFY LOGIN FLOW ---
  1. Open:
     https://accounts.spotify.com/authorize?response_type=code&client_id=YOUR_CLIENT_ID&scope=user-read-currently-playing%20user-read-playback-position&redirect_uri=YOUR_REDIRECT_URI
  2. Login, allow access, copy the "code" from the redirected URL.
  3. Paste the code in 'spotifyCode' below.
  4. Open main.html and check browser console after login. The refresh token will be printed there. Paste it in 'spotifyRefreshToken'.
  5. Fill in your clientId, clientSecret, and redirectUri below.
*/
var spotifyCode = ""; // Step 3: Paste code here
var spotifyRefreshToken = ""; // Step 4: Paste refresh token here
var spotifyClientId = "";
var spotifyClientSecret = "";
var spotifyRedirectUri = "https://google.com"; // Must match your Spotify app settings

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

const MIN_WIDTH = 350;
const MAX_WIDTH = 540;
const MIN_CHAR = 30;
const MAX_CHAR = 50;
const PLACEHOLDER_URL = "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png";

// User-customizable color set
var userColorSet = [
    "#88bdbc", // Soft blue-green
    "#d2a6ac", // Dusky pink
    "#c4c1e0", // Pale lavender
    "#a9a9a9", // Muted grey
];

// Utility: shuffle array
function shuffle(arr) {
    let a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Utility: random int in [min, max] inclusive
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generates a random gradient CSS background from the color set
function generateRandomPresetBackground(colorSet) {
    const shuffled = shuffle(colorSet);
    const gradientTypes = [
        // Linear gradients with random angles
        () => `linear-gradient(${randInt(0, 359)}deg, ${shuffled.join(", ")})`,
        // Linear gradient, left to right
        () => `linear-gradient(to right, ${shuffled.join(", ")})`,
        // Linear gradient, top to bottom
        () => `linear-gradient(to bottom, ${shuffled.join(", ")})`,
        // Radial gradient, ellipse
        () => `radial-gradient(ellipse at ${randInt(10,90)}% ${randInt(10,90)}%, ${shuffled.join(", ")})`,
        // Radial gradient, circle
        () => `radial-gradient(circle at ${randInt(10,90)}% ${randInt(10,90)}%, ${shuffled.join(", ")})`,
        // Diagonal, custom stop order
        () => `linear-gradient(${randInt(30, 150)}deg, ${shuffled[0]} 0%, ${shuffled[1]} 40%, ${shuffled[2]} 70%, ${shuffled[3]} 100%)`
    ];
    const grad = gradientTypes[randInt(0, gradientTypes.length - 1)];
    return grad();
}

// Store last "no-cover" track ID to only regenerate on new no-cover songs
let lastNoCoverTrackId = null;
let lastNoCoverBg = null;

var root = document.getElementById('root');
var albumArt = document.getElementById('albumart');
var trackTitle = document.getElementById('trackTitle');
var artistName = document.getElementById('artistName');
var backgroundBlur = document.querySelector('.background-blur');

function getWidthFromCharCount(charCount) {
    if (charCount <= MIN_CHAR) return MIN_WIDTH;
    if (charCount >= MAX_CHAR) return MAX_WIDTH;
    // Linear interpolation
    return Math.round(
        MIN_WIDTH + ((charCount - MIN_CHAR) / (MAX_CHAR - MIN_CHAR)) * (MAX_WIDTH - MIN_WIDTH)
    );
}

function updateWidthAndScrolling(title, artist) {
    let titleLen = title.length;
    let artistLen = artist.length;
    let maxChars = Math.max(titleLen, artistLen);

    let desiredWidth = getWidthFromCharCount(maxChars);
    root.style.width = desiredWidth + "px";

    trackTitle.style.display = "block";
    trackTitle.style.width = "100%";
    trackTitle.style.textAlign = "center";
    artistName.style.display = "block";
    artistName.style.width = "100%";
    artistName.style.textAlign = "center";

    let textAreaWidth = desiredWidth - (60 + 15 + 20);
    updateScroll(trackTitle, title, textAreaWidth, '1.2em');
    updateScroll(artistName, artist, textAreaWidth, '1em');
}

function measureTextWidth(text, fontSize) {
    var measure = document.getElementById('measure');
    measure.style.fontSize = fontSize;
    measure.textContent = text;
    return measure.offsetWidth;
}

function updateScroll(element, text, areaWidth, fontSize) {
    const textWidth = measureTextWidth(text, fontSize);
    if (textWidth > areaWidth) {
        let scrollDistance = -(textWidth - areaWidth) + "px";
        element.style.setProperty("--scroll-distance", scrollDistance);
        element.classList.add('scroll-active');
    } else {
        element.classList.remove('scroll-active');
        element.style.removeProperty("--scroll-distance");
    }
}

// -- Optional: allow user to set new color set and generate new backgrounds for next no-cover song
function setUserColorSet(newColors) {
    if (Array.isArray(newColors) && newColors.length === 4) {
        userColorSet = newColors;
    }
}

// ========== LAST.FM FETCH ==========
function getRecentTracksLastFM(callback) {
    var request = new XMLHttpRequest();
    request.open(
        'GET',
        'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&nowplaying="true"&user='
        + username + '&api_key=' + apiKey + '&format=json',
        true
    );
    request.onload = function () {
        var data = JSON.parse(this.response);
        if (!data.recenttracks || !data.recenttracks.track || !data.recenttracks.track[0]) return;
        var track = data.recenttracks.track[0];
        var albumArtUrl = track.image && track.image.length ? track.image.slice(-1)[0]['#text'] : "";
        var trackId = (track.name || "") + "|" + (track.artist && track.artist["#text"] ? track.artist["#text"] : "") + "|" + (track.album && track.album["#text"] ? track.album["#text"] : "");
        displayTrack(track.name || "", track.artist['#text'] || "", albumArtUrl, trackId);
        if (callback) callback();
    };
    request.send();
}

// ========== SPOTIFY SUPPORT ==========
var spotifyTokenInfo = { access_token: null, expires_at: 0, refresh_token: spotifyRefreshToken };

function refreshSpotifyAccessToken(callback) {
    if (!spotifyRefreshToken && !spotifyTokenInfo.refresh_token) {
        if (!spotifyCode) return;
        // Exchange code for token
        var params = new URLSearchParams({
            grant_type: 'authorization_code',
            code: spotifyCode,
            redirect_uri: spotifyRedirectUri
        });
    } else {
        // Refresh with refresh_token
        var params = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: spotifyRefreshToken || spotifyTokenInfo.refresh_token,
            redirect_uri: spotifyRedirectUri
        });
    }
    var xhr = new XMLHttpRequest();
    xhr.open('POST', SPOTIFY_TOKEN_URL, true);
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(spotifyClientId + ':' + spotifyClientSecret));
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function () {
        if (this.status >= 400) {
            console.error("Spotify token error");
            return;
        }
        var token = JSON.parse(this.response);
        spotifyTokenInfo.access_token = token.access_token;
        spotifyTokenInfo.expires_at = Date.now() + (token.expires_in * 1000);
        if (token.refresh_token) {
            spotifyTokenInfo.refresh_token = token.refresh_token;
        }
        if (!spotifyRefreshToken && token.refresh_token) {
            // Print refresh token for user setup
            console.log(
                'Your Spotify refresh token is: ' + token.refresh_token +
                '.\nPlease copy it into the \'spotifyRefreshToken\' variable in main.js.'
            );
        }
        if (callback) callback();
    };
    xhr.send(params.toString());
}

function getRecentTracksSpotify(callback) {
    // If token expired or missing, refresh
    if (!spotifyTokenInfo.access_token || Date.now() > spotifyTokenInfo.expires_at - 60000) {
        refreshSpotifyAccessToken(function () { getRecentTracksSpotify(callback); });
        return;
    }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.spotify.com/v1/me/player/currently-playing', true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + spotifyTokenInfo.access_token);
    xhr.onload = function () {
        try {
            var data = JSON.parse(this.response);
            if (!data || !data.item) return;
            var item = data.item;
            var albumArtUrl = item.album && item.album.images && item.album.images.length ? item.album.images[0].url : "";
            var artistNames = item.artists.map(a => a.name).join(", ");
            var trackId = (item.name || "") + "|" + artistNames + "|" + (item.album && item.album.name ? item.album.name : "");
            displayTrack(item.name || "", artistNames, albumArtUrl, trackId);
            if (callback) callback();
        } catch (err) { /* ignore */ }
    };
    xhr.send();
}

// ========== DISPLAY LOGIC ==========
function displayTrack(title, artist, albumArtUrl, trackId) {
    if (albumArtUrl && albumArtUrl !== PLACEHOLDER_URL) {
        albumArt.src = albumArtUrl;
        albumArt.style.visibility = "visible";
        backgroundBlur.style.background = ""; // Clear any gradient
        backgroundBlur.style.backgroundImage = `url(${albumArtUrl})`; // Show blurred cover
        document.querySelector(".album-container").style.display = "";
        lastNoCoverTrackId = null;
        lastNoCoverBg = null;
    } else {
        albumArt.src = "";
        albumArt.style.visibility = "hidden";
        backgroundBlur.style.backgroundImage = ""; // Remove any image
        document.querySelector(".album-container").style.display = "none";
        if (trackId !== lastNoCoverTrackId) {
            lastNoCoverBg = generateRandomPresetBackground(userColorSet);
            lastNoCoverTrackId = trackId;
        }
        backgroundBlur.style.background = lastNoCoverBg; // Show gradient
    }
    trackTitle.textContent = title;
    artistName.textContent = artist;
    updateWidthAndScrolling(title, artist);
}

// ========== POLLING & INIT ==========
function pollNowPlaying() {
    if (musicSource === "spotify") {
        getRecentTracksSpotify();
    } else {
        getRecentTracksLastFM();
    }
}

pollNowPlaying();
setInterval(pollNowPlaying, interval * 1000);