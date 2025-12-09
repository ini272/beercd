# Running BeerCD on Android - Quick Setup Guide

## Why You Need a Web Server

Progressive Web Apps (PWAs) require files to be served over HTTP/HTTPS, not opened directly as files. This is a browser security requirement.

## Recommended: Simple HTTP Server App

**This is the easiest method!**

1. **Install an HTTP Server app** from Google Play Store:
   - Search for "Simple HTTP Server" or "HTTP Server"
   - Popular options: "Simple HTTP Server" by kewlbear, "HTTP Server" by kewlbear

2. **Transfer files to your phone**:
   - Copy the entire `beercd` folder to your phone
   - You can use USB, Google Drive, Dropbox, or any file transfer method

3. **Start the server**:
   - Open the HTTP Server app
   - Navigate to and select the `beercd` folder
   - Tap "Start Server" or similar button
   - The app will show you a URL like `http://192.168.1.100:8080`

4. **Open in Chrome**:
   - Open Chrome browser on your phone
   - Type the URL shown by the server app (or use `http://localhost:8080` if available)
   - The app should load!

5. **Install as PWA**:
   - Chrome will show an "Add to Home screen" prompt, or
   - Tap the menu (three dots) → "Add to Home screen" or "Install app"
   - The app will appear on your home screen like a native app

## Alternative: Termux (Command Line)

If you're comfortable with command line:

1. Install **Termux** from F-Droid (recommended) or Play Store
2. Transfer the `beercd` folder to your phone
3. In Termux, run:
   ```bash
   cd /storage/emulated/0/Download/beercd  # or wherever you put it
   python3 -m http.server 8080
   ```
4. Open `http://localhost:8080` in Chrome
5. Install as PWA

## Troubleshooting

- **Service worker not registering?** Make sure you're accessing via `http://` not `file://`
- **Can't find the folder?** Use a file manager app to locate where you saved the files
- **Port already in use?** Try a different port (8081, 8082, etc.)
- **App won't install?** Make sure you're using Chrome browser (not Firefox or other browsers)

## Once Installed

After installing as a PWA, you can:
- Open it from your home screen like any app
- It will run in standalone mode (no browser UI)
- The timer will persist even if you close the app
- It works offline after first load

