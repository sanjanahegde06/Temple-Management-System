# Temple Management System

Temple Management System is a Next.js application that digitizes temple operations with a modern, scalable architecture. This initial version delivers the Temple Registration module with validation-only UX.

## Current Module

- Temple Registration UI
- Real-time form validation
- Firebase configuration scaffolding (no writes yet)

## Tech Stack

- Next.js 15 (App Router)
- React
- Tailwind CSS
- Firebase Authentication, Firestore, Storage (client setup only)

## Firebase Configuration

1. Create a `.env.local` file based on `.env.example`.
2. Provide your Firebase project credentials using `NEXT_PUBLIC_` variables.
3. Firebase utilities live in `src/lib/firebase`.

## Development

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

## Notes

- This release does not perform authentication or Firestore writes.
- Future modules will layer on roles, staff, devotees, bookings, donations, and reporting.
