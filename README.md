# PyNowCooing
A modern-looking Now Playing overlay for OBS, using SystemMediaTransportControl on Windows to show what you're listening to in any application.

This project is based on [NowCooing](https://github.com/victorlxyz/NowCooing), which in turn was based on [OBS-NowPlaying](https://github.com/sorachan/OBS-NowPlaying/#) by **sorachan**.

## Functionalities

- Shows the current song title, artist name, and album cover from any modern media player - tested with Spotify, Foobar2000, Apple Music and YouTube in Chrome.
- Overlay automatically resizes based on title name/artist name length.
- Single executable for Windows, no installation required.

## Examples

### Short title

![Screenshot of the overlay with a short title](/src/screenshots/NowCooing_screenshot_short-title.png?raw=true "Screenshot of the overlay with a short title")

### Long title

![Screenshot of the overlay with a long title](/src/screenshots/NowCooing_screenshot_long-title.png?raw=true "Screenshot of the overlay with a long title")

![Second screenshot of the overlay with a long title](/src/screenshots/NowCooing_screenshot_long-title-2.png?raw=true "Second screenshot of the overlay with a long title")

### No album cover

When the album cover is unavailable, it is hidden entirely.

  ![First screenshot of the overlay with no cover](/src/screenshots/NowCooing_screenshot_no-cover-1.png?raw=true "First screenshot of the overlay with no cover")
  
  ![Second screenshot of the overlay with no cover](/src/screenshots/NowCooing_screenshot_no-cover-2.png?raw=true "Second screenshot of the overlay with no cover")

## Usage

- Download the latest release from [Releases](github.com/vzsg/PyNowCooing/releases).
- Launch the executable `PyNowCooing.exe`, a console window will appear after a few seconds.
- Set up as a browser source in OBS (change the URL to what the window shows, other default settings will do).
- If you have multiple media players open, use the media controls of the Windows taskbar (click the volume icon) to select the one you want to show in the overlay.

## Releases

### v0.0.1 (2025-06-21)
- Initial release

