# Google Maps API Key Setup Guide

## Step 1: Get Your Google Maps API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select a Project**
   - Click on the project dropdown at the top
   - Click "New Project" or select an existing one
   - Give it a name (e.g., "nabbi App")
   - Click "Create"

3. **Enable Required APIs**
   - Go to "APIs & Services" > "Library"
   - Search for and enable these APIs:
     - ✅ **Places API** (for autocomplete)
     - ✅ **Geocoding API** (for address validation)
     - ✅ **Maps JavaScript API** (for web maps, if needed)

4. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key (it will look like: `AIzaSy...`)

5. **Restrict Your API Key (Recommended for Production)**
   - Click on your newly created API key
   - Under "API restrictions", select "Restrict key"
   - Choose only the APIs you enabled:
     - Places API
     - Geocoding API
     - Maps JavaScript API
   - Under "Application restrictions", you can restrict by:
     - **HTTP referrers** (for web)
     - **Android apps** (for Android)
     - **iOS apps** (for iOS)
   - Click "Save"

## Step 2: Add API Key to Your Project

1. **Create a `.env` file** in the `mobile` folder (if it doesn't exist)

2. **Add your API key:**
   ```
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
   ```

3. **Replace `YOUR_API_KEY_HERE`** with your actual API key from Step 1

4. **Restart your Expo development server:**
   ```bash
   npm start -- --clear
   ```

## Step 3: Update app.json (Optional - for native maps)

If you're using native maps (iOS/Android), also update `app.json`:

- **iOS**: Update `ios.config.googleMapsApiKey`
- **Android**: Update `android.config.googleMaps.apiKey`

## Important Notes:

- ⚠️ **Never commit your `.env` file to git** - it should be in `.gitignore`
- 💰 **Google Maps API has a free tier** - $200/month credit (usually enough for development)
- 🔒 **Always restrict your API keys** in production to prevent unauthorized use
- 📱 **For production**, set up billing in Google Cloud Console (free tier still requires billing account)

## Troubleshooting:

- **"Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY" error**: Make sure your `.env` file is in the `mobile` folder and you've restarted the server
- **API not working**: Check that you've enabled the required APIs in Google Cloud Console
- **Quota exceeded**: Check your usage in Google Cloud Console > APIs & Services > Dashboard
