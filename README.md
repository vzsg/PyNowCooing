# PyNowCooing
A modern-looking Now Playing overlay for OBS, using SystemMediaTransportControl on Windows to show what you're listening to in any application.

This project is based on [NowCooing](https://github.com/victorlxyz/NowCooing), which in turn was based on [OBS-NowPlaying](https://github.com/sorachan/OBS-NowPlaying/#) by **sorachan**.

## Functionalities

- Shows the current song title, artist name, and album cover from any modern media player - tested with Spotify, Foobar2000, Apple Music and YouTube in Chrome.
- Overlay automatically resizes based on title name/artist name length.
- Single executable for Windows, no installation required.

## Usage

- Download the latest release from [Releases](github.com/vzsg/PyNowCooing/releases).
- Launch the executable `PyNowCooing.exe`, a console window will appear after a few seconds.
- Set up as a browser source in OBS (change the URL to what the window shows, other default settings will do).
- If you have multiple media players open, use the media controls of the Windows taskbar (click the volume icon) to select the one you want to show in the overlay.

## Examples

### Album cover

  ![Screenshot of the overlay with a short title](https://github.com/user-attachments/assets/ceb43e1d-442f-43c9-b3cf-4eb1a5aef0f5)

  ![Screenshot of the overlay with a long title](https://github.com/user-attachments/assets/b0525864-21f7-43fb-985c-a1fd07e95fd8)

  ![Second screenshot of the overlay with a long title](https://github.com/user-attachments/assets/dce9c18c-2fb1-442c-affd-2f83a7ce8e74)

### No album cover

When the album cover is unavailable, it is hidden entirely.

  ![First screenshot of the overlay with no cover](https://github.com/user-attachments/assets/d2aea701-7fa2-4043-b8a3-164009e36924)

  ![Second screenshot of the overlay with no cover](https://github.com/user-attachments/assets/4eea565a-888f-423e-a8c0-0a95fb80ecb2)

## Releases

### v0.0.1 (2025-06-21)
- Initial release
