# Push Notifications (FCM) Setup

Push notifications use Firebase Cloud Messaging. The app already includes `@react-native-firebase/app` and `@react-native-firebase/messaging`.

## Native configuration

1. **Android**: Add `google-services.json` from Firebase Console to `android/app/`.
2. **iOS**: Add `GoogleService-Info.plist` from Firebase Console to the Xcode project (e.g. `ios/AppChat/`).

See [React Native Firebase – Messaging](https://rnfirebase.io/messaging/usage) for full setup (project creation, dependencies, permissions).

## Behaviour

- After login, the app requests notification permission and sends the FCM token to the server.
- On logout, the token is removed from the server.
- Tapping a notification opens the matching chat room.
- Unread count badges on the chat list come from `GET /api/conversations` and are updated when entering a room or receiving messages.
