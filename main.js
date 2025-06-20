// ========== USER SETTINGS ==========
var interval = 1; // query interval in seconds
var bounceInterval = 5; // label bounce interval in seconds

// --- SOURCE SELECTION ---
// "spotify" or "lastfm"
// default = "lastfm"
var musicSource = "lastfm";

// ========== LAST.FM SETTINGS ==========
var lastfmUsername = ""; // your lastfm username
var lastfmApiKey = ""; // your lastfm api key

// ========== SPOTIFY SETTINGS ==========
/*
  LOGIN: PLEASE READ CAREFULLY!
  1. open this website, login to Spotify and allow access
  https://accounts.spotify.com/authorize?response_type=code&client_id=_&scope=user-read-currently-playing%20user-read-playback-position&redirect_uri=_
  2. after logging in, you will be redirected to https://www.google.com/?code=[your code here], paste this into the 'code' variable
  3. open a browser window, open Developer Tools and switch to console
  4. open main.html
  5. after successful login, you will find a refresh token in the console, copy this into the 'refreshToken' variable so you don't have to authorize the app anew
*/
var code = ''; // your code from step 2
var refreshToken = ''; // your refresh token from step 5

var tokenURL = 'https://accounts.spotify.com/api/token';
var clientId = ''; // your spotify client id
var clientSecret = ''; // your spotify client secret

var instance = this;
instance.token = null;

// ========== DOM ELEMENTS ==========
var root = document.getElementById('root');
var nowPlaying = document.getElementById('nowplaying');
var albumArt = document.getElementById('albumart');

// ========== SPOTIFY AUTH & FETCH ==========
var refreshAccessToken = function () {
  var request = new XMLHttpRequest();
  request.open(
    'POST',
    tokenURL,
    true
  );
  var params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    redirect_uri: 'https://google.com'
  });
  request.setRequestHeader(
    'Authorization',
    'Basic ' + window.btoa(clientId + ':' + clientSecret)
  );
  request.setRequestHeader(
    'Content-Type',
    'application/x-www-form-urlencoded'
  );
  request.onload = function () {
    if (this.status == 400) {
      console.error('token refresh failed!');
      return;
    }
    var token = JSON.parse(this.response);
    instance.token.access_token = token.access_token;
    instance.token.expires_in = token.expires_in;
    if (token.refresh_token) {
      instance.token.refresh_token = token.refresh_token;
    }
  };
  request.send(params.toString());
};

var spotifyAuthInit = function (callback) {
  if (!refreshToken) {
    var params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: 'https://google.com'
    });
    var request = new XMLHttpRequest();
    request.open(
      'POST',
      tokenURL,
      true
    );
    request.setRequestHeader(
      'Authorization',
      'Basic ' + window.btoa(clientId + ':' + clientSecret)
    );
    request.setRequestHeader(
      'Content-Type',
      'application/x-www-form-urlencoded'
    );
    request.onload = function () {
      if (this.status == 400) {
        console.error('invalid code, please copy the login URL and try again!');
        return;
      }
      instance.token = JSON.parse(this.response);
      console.log(
        'Your refresh token is: '
        + instance.token.refresh_token
        + '.\nPlease copy it into the \'refreshToken\''
        + 'variable in main.js.'
      );
      setInterval(
        refreshAccessToken,
        (instance.token.expires_in - 60) * 1000
      );
      if (callback) callback();
    };
    request.send(params.toString());
  } else {
    instance.token = {
      expires_in: 3600,
      refresh_token: refreshToken
    };
    refreshAccessToken();
    setInterval(
      refreshAccessToken,
      (instance.token.expires_in - 60) * 1000
    );
    if (callback) callback();
  }
};

var getRecentTracksSpotify = function () {
  if (!instance.token || !instance.token.access_token) {
    return;
  }
  var request = new XMLHttpRequest();
  request.open(
    'GET',
    'https://api.spotify.com/v1/me/player/currently-playing',
    true
  );
  request.setRequestHeader(
    'Authorization',
    'Bearer ' + instance.token.access_token
  );
  request.setRequestHeader('Accept', 'application/json');
  request.setRequestHeader('Content-Type', 'application/json');
  request.onload = processRecentTracksSpotify;
  request.send();
};

var processRecentTracksSpotify = function () {
  try {
    var data = JSON.parse(this.response);
  } catch (error) {
    return;
  }
  if (!data.item) return;
  // build artist(s) string
  var artists = data.item.artists[0].name;
  if (data.item.artists.length > 1) {
    for (var i = 1; i < data.item.artists.length; i++) {
      if (i < data.item.artists.length - 1) {
        artists += ', ';
      } else {
        artists += ' and ';
      }
      artists += data.item.artists[i].name;
    }
  }
  // load album art
  albumArt.src = data.item.album.images[0].url;
  albumArt.style.display = "";
  // set "now playing" label
  nowPlaying.innerHTML = (
    '<em>'
    + data.item.name
    + '</em>&nbsp;by&nbsp;<em>'
    + artists
    + '</em>'
  );
  // set progress bar (optional)
  var duration = data.item.duration_ms;
  var progress = data.progress_ms;
  var documentRoot = document.querySelector(':root');
  documentRoot.style.setProperty(
    '--progress',
    100 * progress / duration + '%'
  );
  // animate if necessary
  var textWidth = nowPlaying.offsetWidth;
  var rootWidth = root.clientWidth;
  rootWidth -= 2 * parseFloat(getComputedStyle(root).padding);
  documentRoot.style.setProperty('--textWidth', textWidth + 'px');
  documentRoot.style.setProperty('--rootWidth', rootWidth + 'px');
  if (textWidth > rootWidth) {
    nowPlaying.style.animation = 'floatText '
      + bounceInterval + 's infinite alternate ease-in-out';
  } else {
    nowPlaying.style.animation = '';
  }
};

// ========== LASTFM FETCH ==========
var getRecentTracksLastFM = function () {
  var request = new XMLHttpRequest();
  request.open(
    'GET',
    'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&nowplaying=true&user='
    + lastfmUsername + '&api_key=' + lastfmApiKey + '&format=json',
    true
  );
  request.onload = processRecentTracksLastFM;
  request.send();
};

var processRecentTracksLastFM = function () {
  var data = JSON.parse(this.response);
  if (!data.recenttracks || !data.recenttracks.track || !data.recenttracks.track[0]) return;
  var track = data.recenttracks.track[0];
  // Album art
  var albumArtUrl = track.image && track.image.length ? track.image.slice(-1)[0]['#text'] : "";
  if (albumArtUrl) {
    albumArt.src = albumArtUrl;
    albumArt.style.display = "";
  } else {
    albumArt.src = "";
    albumArt.style.display = "none";
  }
  // Artists
  var artist = track.artist['#text'] || "";
  // Song title
  var title = track.name || "";
  nowPlaying.innerHTML = (
    '<em>' + title + '</em>&nbsp;by&nbsp;<em>' + artist + '</em>'
  );
  // Progress bar not supported for Last.fm (no timing info)
  var documentRoot = document.querySelector(':root');
  documentRoot.style.setProperty('--progress', '0%');
  nowPlaying.style.animation = '';
};

// ========== POLLING & INIT ==========
function pollNowPlaying() {
  if (musicSource === "spotify") {
    getRecentTracksSpotify();
  } else {
    getRecentTracksLastFM();
  }
}

// If using Spotify, initialize auth and polling
if (musicSource === "spotify") {
  spotifyAuthInit(function () {
    pollNowPlaying();
    setInterval(pollNowPlaying, interval * 1000);
  });
} else {
  pollNowPlaying();
  setInterval(pollNowPlaying, interval * 1000);
}