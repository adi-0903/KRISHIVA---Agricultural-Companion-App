# 🌱 KRISHIVA - Agricultural Companion App

KRISHIVA is a comprehensive agricultural mobile application designed to empower farmers with essential tools and information. The app integrates crop management, market data, and premium subscription features to provide a one-stop solution for modern farming needs.

## 🌟 Features

- **User Authentication**
  - Secure login/signup with session management
  - Profile management

- **Crop Management**
  - Track and manage crop details
  - Growth monitoring and alerts

- **Market Data**
  - Real-time crop prices
  - Market trends and analysis

- **Premium Features**
  - Subscription-based premium content
  - Wallet system for transactions
  - Exclusive market insights

- **Offline Support**
  - Data synchronization
  - Offline access to critical information

## 🛠 Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation
- **State Management**: React Context API
- **Database**: SQLite with expo-sqlite
- **Authentication**: AsyncStorage with JWT
- **Payments**: Razorpay Integration
- **UI Components**: React Native Paper, Expo Vector Icons
- **Animation**: Moti, Lottie

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI
- Android Studio / Xcode (for emulator)
- Physical device with Expo Go app

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/krishiva.git
   cd krishiva
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory and add your configuration:
   ```
   EXPO_PUBLIC_RAZORPAY_KEY=your_razorpay_key
   # Add other environment variables as needed
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on device/emulator**
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator

## 📱 Screenshots

(Add screenshots of your app here)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for the amazing development platform
- [React Native](https://reactnative.dev/) for cross-platform development
- [Razorpay](https://razorpay.com/) for payment integration
- All open-source libraries and contributors

---

<div align="center">
  Made with ❤️ for Indian Farmers
</div>
## Development

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

### Project Structure

```
├── app/                    # Main application code
│   ├── components/         # Reusable components
│   ├── constants/          # Constants and configurations
│   ├── database/           # Database models and utilities
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── assets/                 # Static assets (images, fonts, etc.)
├── android/                # Android native code
├── ios/                    # iOS native code
└── razorpay-backend/       # Backend for Razorpay integration
```

### Available Scripts

- `npm start` - Start the development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint
- `npm run reset-project` - Reset the project to initial state

## Support

For support, please open an issue in the [GitHub repository](https://github.com/your-username/krishiva/issues).

## Show Your Support

Give a ⭐️ if this project helped you!
