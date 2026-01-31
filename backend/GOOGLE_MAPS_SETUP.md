# Google Maps API Key Setup for Backend

## Step 1: Add API Key to Backend Environment

Add your Google Maps API key to the backend `.env` file:

```bash
GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

Replace `YOUR_API_KEY_HERE` with your actual API key (the same one you use in the mobile app).

## Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

The `requests` library is already in requirements.txt.

## Step 3: Restart Backend Server

After adding the API key, restart your Django server:

```bash
python manage.py runserver
```

## Step 4: Test the Endpoints

The proxy endpoints are now available at:
- `GET /api/google-maps/places/autocomplete/?input=address`
- `GET /api/google-maps/places/details/?place_id=xxx`

These endpoints will handle the Google Maps API calls server-side, avoiding CORS issues.

## Notes

- The backend proxy is used automatically by the mobile app when running on web
- Native apps (iOS/Android) can still use direct API calls (no CORS issue)
- The API key should be the same one configured in Google Cloud Console
