# Nginx Configuration for File Uploads

## Problem
The server is returning "413 Request Entity Too Large" errors when uploading images. This is because Nginx has a default `client_max_body_size` limit that's too small for image uploads.

## Solution

Add or update the following configuration in your Nginx configuration file (usually located at `/etc/nginx/nginx.conf` or in your site-specific config at `/etc/nginx/sites-available/your-site`):

```nginx
http {
    # Increase the maximum allowed size for client request bodies
    # This allows file uploads up to 20MB
    client_max_body_size 20M;
    
    # Optional: Increase timeouts for large file uploads
    client_body_timeout 60s;
    client_header_timeout 60s;
    
    # ... rest of your nginx configuration
}
```

Or, if you want to set it only for specific locations (like API endpoints):

```nginx
server {
    # ... other server configuration
    
    location /api/posts/ {
        client_max_body_size 20M;
        proxy_pass http://your-backend;
        # ... other proxy settings
    }
}
```

## After Making Changes

1. Test the configuration:
   ```bash
   sudo nginx -t
   ```

2. If the test passes, reload Nginx:
   ```bash
   sudo systemctl reload nginx
   # or
   sudo service nginx reload
   ```

## Recommended Settings

- **client_max_body_size**: 20M (20 megabytes) - This should be sufficient for compressed images
- **client_body_timeout**: 60s - Allows enough time for uploads
- **client_header_timeout**: 60s - Allows enough time for request headers

## Note

The frontend now compresses images before upload (max 1920x1920px, 70% quality), so most images should be under 2-3MB. However, setting the limit to 20MB provides a safety margin for multiple images or slightly larger files.
