# BeerCD - Beer Cooldown Timer 🍺

A simple web app to help limit beer intake by enforcing a cooldown period between drinks.

## Features

- Click the "Beer Button" to start a cooldown timer
- Configurable cooldown duration (30 minutes to 3 hours, default: 1 hour)
- Countdown timer displays remaining time
- Cooldown state persists across page refreshes (using localStorage)
- Modern, clean UI with visual feedback
- Progressive Web App (PWA) - can be installed on Android home screen

## Running on Android Phone

Since PWAs require HTTP/HTTPS (not `file://`), you need to run a local web server on your Android device. Here are the easiest options:

### Option 1: Use a Simple HTTP Server App (Easiest)

1. Install **"Simple HTTP Server"** or **"HTTP Server"** from Google Play Store
2. Copy the `beercd` folder to your phone (via USB, cloud storage, etc.)
3. Open the app and select the `beercd` folder
4. Start the server (usually shows an IP like `http://192.168.x.x:8080`)
5. Open that URL in Chrome on your phone
6. Install the app to home screen when prompted

### Option 2: Use Termux (For Advanced Users)

1. Install **Termux** from F-Droid or Play Store
2. Copy the `beercd` folder to your phone
3. Open Termux and run:
   ```bash
   cd /path/to/beercd
   python3 -m http.server 8080
   ```
4. Open `http://localhost:8080` in Chrome
5. Install the app to home screen

### Option 3: Host Online (Free)

- Upload to **GitHub Pages**, **Netlify**, or **Vercel** (all free)
- Access from your phone's browser
- Install as PWA from the hosted URL

## Usage

1. Open the app in your browser (or install as PWA)
2. Select your desired cooldown duration
3. Click the "Beer Button" to start the cooldown
4. Wait for the countdown to complete before having another beer!

## Files

- `index.html` - Main HTML structure
- `style.css` - Styling and layout
- `script.js` - Cooldown logic and timer functionality
- `manifest.json` - PWA manifest for Android installation
- `service-worker.js` - Service worker for offline functionality
- `icons/` - App icons for home screen

## How It Works

When you click the beer button, a cooldown period starts. The timer counts down in real-time, and the button is disabled until the cooldown completes. The cooldown state is saved to your browser's localStorage, so it persists even if you close the page or the app is backgrounded.

