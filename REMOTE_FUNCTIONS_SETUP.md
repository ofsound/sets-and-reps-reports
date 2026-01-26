# Remote Functions Setup Guide

This project has been migrated to use SvelteKit's remote functions feature instead of traditional `load` functions.

## Required Dependencies

You need to install the following packages:

```bash
npm install valibot firebase-admin
```

## Firebase Admin SDK Setup

Remote functions run on the server, so you need to set up Firebase Admin SDK (not the client SDK).

### 1. Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file

### 2. Set Environment Variables

Add the following to your `.env` file (or `.env.local`):

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

**Important:** 
- The `FIREBASE_PRIVATE_KEY` should include the full key with `\n` characters (they will be converted to actual newlines in the code)
- Make sure these are in `$env/static/private` (not public) for security

### 3. Update .gitignore

Make sure your `.env` files are in `.gitignore` (they should already be).

## What Changed

### Before (Load Function)
- Data fetching happened in `+page.ts` using `load` function
- Data was passed via `data` prop to component
- SSR/SSG support built-in

### After (Remote Functions)
- Data fetching happens via `query` in `exercise.remote.ts`
- Component uses `await` with the remote function directly
- Still supports SSR, but with more flexibility
- Can be called from anywhere in your app
- Type-safe with validation using Valibot

## Files Created/Modified

1. **`svelte.config.js`** - Enabled remote functions and async support
2. **`src/lib/server/firebase-admin.ts`** - Firebase Admin SDK setup
3. **`src/routes/exercises/[exerciseID]/exercise.remote.ts`** - Remote query function
4. **`src/routes/exercises/[exerciseID]/+page.svelte`** - Updated to use remote function
5. **`src/routes/exercises/[exerciseID]/+page.ts`** - Removed (no longer needed)

## Benefits of Remote Functions

- ✅ Type-safe with automatic validation
- ✅ Can be called from anywhere (not just page components)
- ✅ Better error handling
- ✅ Automatic caching and refresh capabilities
- ✅ Works with Svelte 5's `await` expressions
- ✅ Progressive enhancement support

## Troubleshooting

### "Cannot find module 'valibot'"
Run: `npm install valibot`

### "Cannot find module 'firebase-admin'"
Run: `npm install firebase-admin`

### Firebase Admin initialization errors
- Check that your environment variables are set correctly
- Ensure the private key includes the `\n` characters
- Verify your service account has the correct permissions

### "Remote functions not working"
- Make sure `kit.experimental.remoteFunctions: true` is in `svelte.config.js`
- Make sure `compilerOptions.experimental.async: true` is set
- Restart your dev server after making config changes
