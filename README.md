# DailyCigs - Daily Cigarette Tracker

A modern, cross-platform mobile application built with React Native and Expo to help you track your daily cigarette consumption. Monitor your habits, set goals, and visualize your progress over time.

## Features

- 📊 **Daily Tracking**: Easily log cigarettes throughout the day with a simple tap
- 📈 **Trends & Analytics**: View your consumption patterns with interactive charts (weekly and monthly views)
- 🎯 **Daily Goals**: Set and track daily consumption goals
- ⏰ **Time-based Statistics**: See when you smoke most (morning, afternoon, evening, night)
- 🌓 **Dark Mode Support**: Automatic theme switching based on system preferences
- 💾 **Local Storage**: All data is stored locally on your device for privacy
- 📱 **Cross-platform**: Works on iOS, Android, and Web

## Screenshots

The app includes three main screens:
- **Home**: Quick counter and today's statistics
- **Trends**: Visual charts showing your consumption over time
- **Settings**: Configure your daily goals and preferences

## Tech Stack

- [Expo](https://expo.dev) - React Native framework
- [React Native](https://reactnative.dev) - Mobile app framework
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [Expo Router](https://docs.expo.dev/router/introduction) - File-based routing
- [React Native Chart Kit](https://github.com/indiespirit/react-native-chart-kit) - Data visualization
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage) - Local data persistence
- [date-fns](https://date-fns.org) - Date manipulation utilities

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (optional, but recommended)
- iOS Simulator (for Mac) or Android Emulator (optional)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/lifeofzi/daily-cigarettes-tracker.git
   cd daily-cigarettes-tracker/DailyCigs
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   npx expo start
   ```

4. Run on your preferred platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser
   - Scan QR code with Expo Go app on your physical device

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Start on Android emulator
- `npm run ios` - Start on iOS simulator
- `npm run web` - Start in web browser
- `npm run lint` - Run ESLint

## Project Structure

```
DailyCigs/
├── app/                    # App screens and routing
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home screen
│   │   ├── trends.tsx     # Trends/analytics screen
│   │   └── settings.tsx   # Settings screen
│   └── _layout.tsx        # Root layout
├── components/             # Reusable components
├── utils/                  # Utility functions
│   └── storage.ts         # Data persistence logic
├── constants/             # App constants
└── assets/                # Images and static assets
```

## Building for Production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

Make sure you have configured `eas.json` with your build profiles.

## Privacy

All data is stored locally on your device using AsyncStorage. No data is sent to external servers, ensuring complete privacy of your tracking information.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and not licensed for public use.

## Support

For issues, questions, or suggestions, please open an issue on the [GitHub repository](https://github.com/lifeofzi/daily-cigarettes-tracker).

---

Built with ❤️ using Expo and React Native
