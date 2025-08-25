# 🌱 KRISHIVA - Agricultural Companion App

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React_Native-0.72.0-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Platform: Android & iOS](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-lightgrey.svg)](https://github.com/adi-0903/KRISHIVA---Agricultural-Companion-App)

KRISHIVA is a comprehensive agricultural mobile application designed to empower farmers with essential tools and information. The app integrates crop management, market data, and premium subscription features to provide a one-stop solution for modern farming needs.

## ✨ Features

### 🌾 Core Features
- **User Authentication**
  - Secure login/signup with session management
  - Profile management with cloud sync
  - Multi-factor authentication support

- **Crop Management**
  - Track and manage crop details with rich media support
  - Growth monitoring with smart alerts and notifications
  - Disease detection and treatment suggestions
  - Weather-based recommendations

- **Market Data**
  - Real-time crop prices from local markets
  - Price trends and market analysis
  - Direct connection with buyers and suppliers
  - Historical price data visualization

- **Premium Features**
  - Subscription-based premium content
  - Secure in-app wallet system with UPI integration
  - Exclusive market insights and analytics
  - Priority customer support

- **Offline Support**
  - Robust data synchronization
  - Offline access to critical information
  - Automatic sync when back online

## 🛠 Tech Stack

### Frontend
- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: React Context API + Redux Toolkit
- **UI Toolkit**: React Native Paper + NativeBase
- **Animation**: Reanimated 3 + Lottie
- **Forms**: Formik + Yup

### Backend & Storage
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore + SQLite (offline)
- **File Storage**: Firebase Storage
- **Payments**: Razorpay + UPI Integration
- **Analytics**: Firebase Analytics
- **Push Notifications**: Firebase Cloud Messaging

### Development Tools
- **Language**: TypeScript
- **Linting**: ESLint + Prettier
- **Testing**: Jest + React Native Testing Library
- **CI/CD**: GitHub Actions
- **Package Manager**: Yarn

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- Yarn (recommended) or npm
- Expo CLI (latest version)
- Android Studio / Xcode (for emulator)
- Physical device with Expo Go app or development build
- Git (for version control)

### 🛠 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/adi-0903/KRISHIVA---Agricultural-Companion-App.git
   cd KRISHIVA---Agricultural-Companion-App
   ```

2. **Install dependencies**
   ```bash
   # Using Yarn (recommended)
   yarn install
   
   # Or using npm
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Update the environment variables in `.env`
   ```env
   EXPO_PUBLIC_API_URL=your_api_url
   EXPO_PUBLIC_RAZORPAY_KEY=your_razorpay_key
   FIREBASE_API_KEY=your_firebase_key
   # Add other required environment variables
   ```

4. **Start Development**
   ```bash
   # Start the development server
   npx expo start
   
   # For web development
   npx expo start --web
   ```

5. **Running the App**
   - **Android**: Press `a` in the terminal or scan QR with Expo Go
   - **iOS**: Press `i` in the terminal or scan QR with Camera app
   - **Web**: Press `w` in the terminal or open browser manually

## 📱 Screenshots

| | | |
|:-------------------------:|:-------------------------:|:-------------------------:|
| <img src="screenshots/login.jpg" width="200"> | <img src="screenshots/dashboard.jpg" width="200"> | <img src="screenshots/market.jpg" width="200"> |
| *Secure Login* | *Dashboard* | *Market Prices* |
| <img src="screenshots/crop-details.jpg" width="200"> | <img src="screenshots/notifications.jpg" width="200"> | <img src="screenshots/profile.jpg" width="200"> |
| *Crop Details* | *Notifications* | *User Profile* |

## 🤝 Contributing

We welcome contributions from the community! Here's how you can contribute:

1. **Fork** the repository on GitHub
2. **Clone** your forked repository
   ```bash
   git clone https://github.com/your-username/KRISHIVA---Agricultural-Companion-App.git
   ```
3. **Create** a new branch for your feature or bugfix
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Commit** your changes with a descriptive message
   ```bash
   git commit -m "feat: add new feature"
   ```
5. **Push** to your fork
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request** with a clear description of your changes

### 📝 Code Style
- Follow the [React Native Style Guide](https://reactnative.dev/docs/style)
- Use TypeScript for all new code
- Write meaningful commit messages following [Conventional Commits](https://www.conventionalcommits.org/)
- Ensure all tests pass before submitting a PR

### 🐛 Reporting Issues
Found a bug? Please [open an issue](https://github.com/adi-0903/KRISHIVA---Agricultural-Companion-App/issues) and include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Device/OS version

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

We would like to thank the following projects and communities for their valuable contributions:
- [Expo](https://expo.dev/) for the amazing development platform
- [React Native](https://reactnative.dev/) for cross-platform development
- [Razorpay](https://razorpay.com/) for payment integration
- [Firebase](https://firebase.google.com/) for backend services
- [React Native Paper](https://reactnativepaper.com/) for UI components
- All our amazing contributors and the open-source community

## 🌍 Join Our Community

- [GitHub Discussions](https://github.com/adi-0903/KRISHIVA---Agricultural-Companion-App/discussions)
- [Twitter](https://twitter.com/yourhandle)
- [Discord](https://discord.gg/yourinvite)

## 🤝 Support This Project

If you find this project useful, please consider supporting us:
- ⭐ Star this repository on GitHub
- 🐛 Report bugs and issues
- 💡 Suggest new features
- 📣 Share with your network
- 💖 Sponsor this project

---

<div align="center">
  Made with ❤️ for Farmers Worldwide
</div>
## 🛠 Development Guide

This project uses [Expo Router](https://expo.github.io/router) for file-based routing. The main application code lives in the `app/` directory.

### 📁 Project Structure

```
krishiva/
├── app/                    # Main application code with file-based routing
│   ├── (auth)/             # Authentication related screens
│   ├── (tabs)/             # Main app tabs
│   │   ├── dashboard/      # Dashboard screens
│   │   ├── market/         # Market related screens
│   │   └── profile/        # User profile and settings
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # Basic UI components
│   │   └── shared/         # Shared components
│   ├── constants/          # App constants and configurations
│   ├── contexts/           # React contexts
│   ├── database/           # Database models and utilities
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API and service layers
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── assets/                 # Static assets
│   ├── fonts/              # Custom fonts
│   └── images/             # Image assets
├── android/                # Android native code
├── ios/                    # iOS native code
├── scripts/                # Utility scripts
└── tests/                  # Test files
```

### 🚀 Development Scripts

```bash
# Start development server
npm start

# Run on Android
expo run:android

# Run on iOS
expo run:ios

# Run on web
expo start --web

# Lint code
npm run lint

# Run tests
npm test

# Build for production (creates .aab and .ipa files)
eas build --platform all
```

### 🧪 Testing

This project uses Jest and React Native Testing Library for testing. To run tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- path/to/test/file.test.tsx
```

### 🐛 Debugging

- **React Native Debugger**: Recommended for state inspection
- **Flipper**: For native debugging
- **React DevTools**: For component inspection

### 📦 Publishing

1. Update version in `app.json`
2. Update CHANGELOG.md
3. Create a new release on GitHub
4. Publish to stores using EAS:
   ```bash
   eas submit -p android
   eas submit -p ios
   ```

## 🤝 Support

For support, please:
1. Check the [documentation](https://github.com/adi-0903/KRISHIVA---Agricultural-Companion-App/wiki)
2. Search [existing issues](https://github.com/adi-0903/KRISHIVA---Agricultural-Companion-App/issues)
3. Open a [new issue](https://github.com/adi-0903/KRISHIVA---Agricultural-Companion-App/issues/new/choose) if your problem isn't solved

## 🌟 Show Your Support

If you find this project useful, please consider:
- ⭐ Giving it a star on [GitHub](https://github.com/adi-0903/KRISHIVA---Agricultural-Companion-App)
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 📣 Sharing with your network
- 💖 [Sponsoring](https://github.com/sponsors/yourusername) the project
