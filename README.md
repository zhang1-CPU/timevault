# TimeVault

Hide a secret message inside a photo, time-locked until the moment arrives.

## Live Demo

**https://zhang1-CPU.github.io/timevault/**

## Features

- **Zero Storage**: Messages are hidden inside the photo you provide. We store nothing.
- **Time-Locked Encryption**: Messages can only be decrypted after the specified time.
- **PIN Protection**: A 4-digit PIN adds an extra layer of security.
- **Calendar Reminders**: Download an .ics file or add directly to Google Calendar.
- **Pure Client-Side**: All encryption happens in your browser.

## How It Works

1. **Seal**: Choose a photo, write your secret message, set a 4-digit PIN, and pick the unlock date.
2. **Download**: Get your sealed photo (a PNG with the message hidden inside).
3. **Unlock**: After the unlock date, visit the site, upload your photo, and enter your PIN.

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS
- tlock (Drand time-lock encryption)
- ICS calendar generation

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Deployment

This project is deployed automatically to GitHub Pages via GitHub Actions.

Every push to the `main` branch triggers:
1. Install dependencies
2. Build the project
3. Deploy to GitHub Pages

## Privacy

TimeVault does **not** store any data on any server:
- No messages
- No photos
- No PINs
- No email addresses

Everything happens in your browser. Your sealed photo is the only key.
