<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# DJ-Live Challenge

Realtime duel app with React, Firebase Authentication, and Firestore.

## Run Locally

Prerequisites: Node.js and a Firebase project.

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and fill all `VITE_FIREBASE_*` values from Firebase project settings.
3. In Firebase Console, enable Authentication with Email/Password provider.
4. In Firebase Console, create Firestore Database.
5. Run app:
   `npm run dev`

## Firestore Structure

Collection: `games`
Document: `active_duel`

Fields used by the app:
- `turn`: `"DoDo" | "JoJo"`
- `scores`: `{ DoDo: number, JoJo: number }`
- `status`: `"waiting" | "active" | "finished"`
- `challenger`: optional player
- `target`: optional player
- `category`: optional string
- `question_text`: optional string
- `timer_limit`: optional number
- `start_time`: optional timestamp
- `score_pending`: optional boolean
