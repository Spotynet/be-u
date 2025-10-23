# Environment Variables Setup

## Current Usage

The mobile app is already configured to use environment variables for API URLs. Here's how it works:

### 1. Environment Variable Usage

The app uses `EXPO_PUBLIC_API_URL` in the following files:

- `lib/api.ts` (line 24): `const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api";`
- `features/auth/hooks/useAuth.tsx` (line 114): `process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api"`

### 2. Setting Up Environment Variables

Create a `.env` file in the mobile directory with the following content:

```bash
# Development (local backend)
EXPO_PUBLIC_API_URL=http://localhost:8000/api

# For staging environment
# EXPO_PUBLIC_API_URL=https://stg.be-u.ai/api

# For production environment
# EXPO_PUBLIC_API_URL=https://be-u.ai/api
```

### 3. Environment-Specific Configuration

#### Development

```bash
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

#### Staging

```bash
EXPO_PUBLIC_API_URL=https://stg.be-u.ai/api
```

#### Production

```bash
EXPO_PUBLIC_API_URL=https://be-u.ai/api
```

### 4. How to Switch Environments

1. **For Development**: Use the default or set `EXPO_PUBLIC_API_URL=http://localhost:8000/api`
2. **For Staging**: Set `EXPO_PUBLIC_API_URL=https://stg.be-u.ai/api`
3. **For Production**: Set `EXPO_PUBLIC_API_URL=https://be-u.ai/api`

### 5. Verification

You can verify the API URL is being used correctly by checking the console logs when making API requests. The logs will show the full URL being used.

### 6. Important Notes

- Environment variables starting with `EXPO_PUBLIC_` are available in the client-side code
- The app falls back to `http://localhost:8000/api` if no environment variable is set
- Make sure to restart the Expo development server after changing environment variables
- Never commit sensitive environment variables to version control

### 7. Current Status

✅ Environment variables are already properly configured
✅ API calls use the environment variable
✅ Fallback to localhost is working
✅ Ready to switch between dev/staging/production
