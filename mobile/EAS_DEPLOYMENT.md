# EAS Deployment Guide

## Environment Variables Configuration

### 1. **EAS Build Configuration**

The `eas.json` file is configured with environment variables for different build profiles:

- **Development**: `http://localhost:8000/api`
- **Preview**: `https://stg.be-u.ai/api`
- **Production**: `https://be-u.ai/api`

### 2. **Build Commands**

```bash
# Development build (for testing)
eas build --profile development --platform all

# Preview build (staging)
eas build --profile preview --platform all

# Production build
eas build --profile production --platform all
```

### 3. **Update Commands**

```bash
# Create update for development
eas update --branch development --message "Development update"

# Create update for preview/staging
eas update --branch preview --message "Staging update"

# Create update for production
eas update --branch production --message "Production update"
```

### 4. **Environment Variable Verification**

The app will log environment configuration on startup. Check the console for:

```
🔧 Environment Configuration: {
  EXPO_PUBLIC_API_URL: "https://be-u.ai/api",
  API_BASE_URL: "https://be-u.ai/api",
  NODE_ENV: "production",
  EXPO_PUBLIC_DEBUG: "false"
}
```

### 5. **Troubleshooting**

If environment variables are not working:

1. **Check EAS build logs** for environment variable injection
2. **Verify `eas.json`** configuration is correct
3. **Check app logs** for the environment configuration output
4. **Ensure you're using the correct build profile**

### 6. **Local Development**

For local development, create a `.env` file:

```bash
# .env
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_DEBUG=true
```

### 7. **Build Profiles Explained**

- **development**: For internal testing with localhost API
- **preview**: For staging/testing with staging API
- **production**: For production with live API

Each profile has its own environment variables configured in `eas.json`.
