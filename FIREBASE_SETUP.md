# Firebase Owner-Only Video Management Setup

This project now uses Firebase so only your owner account can publish/delete videos.

## 1. Create Firebase project
1. Go to Firebase Console.
2. Create a project.
3. Add a **Web app** and copy the config object.

Firebase project used in this setup:
Project ID: ptsp-34b78

## 2. Enable Email/Password auth
1. Firebase Console -> Authentication -> Sign-in method.
2. Enable **Email/Password**.
3. Create your owner account in Authentication -> Users.

Owner account email:
v4313436@gmail.com

## 3. Configure project file
Edit `firebase-config.js`:
- Replace all `YOUR_...` values with your actual Firebase config values.
- Replace `adminEmails` with your owner email.

Example configuration used for this project:

```javascript
export const firebaseConfig = {
  apiKey: "AIzaSyA_My_J6I7UtSahDNLIX3eF28c7rh_T1Fc",
  authDomain: "ptsp-34b78.firebaseapp.com",
  projectId: "ptsp-34b78",
  storageBucket: "ptsp-34b78.firebasestorage.app",
  messagingSenderId: "679438278259",
  appId: "1:679438278259:web:ec27b6f0f93561725d5406",
  measurementId: "G-2W8GMRFQ37"
};

export const adminEmails = [
  "v4313436@gmail.com"
];
```

## 4. Create Firestore and apply rules
1. Firebase Console -> Firestore Database -> Create database.
2. Open Rules and paste contents of `firestore.rules`.
3. Replace `your-email@example.com` in rules with your real owner email.
4. Publish rules.

Example rules configured for this project:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner() {
      return request.auth != null
        && request.auth.token.email in [
          "v4313436@gmail.com"
        ];
    }

    match /videos/{videoId} {
      allow read: if true;
      allow create, update, delete: if isOwner();
    }
  }
}
```

## 5. How it works
- Visitors can read videos.
- Only signed-in owner email can create/delete videos.
- Video data is stored in Firestore collection: `videos`.

Owner account allowed to manage videos:
v4313436@gmail.com

## 6. Video document format
Each document in `videos` contains:
- `title` (string)
- `tech` (string)
- `level` (string)
- `duration` (string)
- `description` (string)
- `youtubeId` (string)
- `createdAt` (timestamp)