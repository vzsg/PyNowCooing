// ========== CONFIG ==========
var interval = 5; // query interval in seconds

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

// ========== DATA FETCHING ==========
function getCurrentMedia(callback) {
    var request = new XMLHttpRequest();
    request.open('GET', '/api', true);
    request.onload = function () {
        var data = JSON.parse(this.response);
        var trackId = `${data.title || ''}|${data.artist || ''}|${data.album || ''}`
        displayTrack(data.title || '', data.artist || '', data.thumbnail || '', trackId);
        if (callback) callback();
    }
    request.send();
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

getCurrentMedia();
setInterval(getCurrentMedia, interval * 1000);