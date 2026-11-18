import type {NextConfig} from "next";

const backendOrigin =
  process.env.BACKEND_ORIGIN ||
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ||
  (process.env.NODE_ENV === "production" ? "https://api.nabbi.app" : "http://localhost:8000");

const nextConfig: NextConfig = {
  output: "standalone",
  // Django API paths use trailing slashes. If /api is ever served by Next
  // (misrouted api host), the default 308 strip has no CORS headers and
  // browsers report "Access-Control-Allow-Origin missing" / status 308.
  skipTrailingSlashRedirect: true,
  allowedDevOrigins: ["nabbi-dev.spotynet.com"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
      // Proxy Django static files for admin panel
      {
        source: "/static/:path*",
        destination: `${backendOrigin}/static/:path*`,
      },
      // Proxy Django media files
      {
        source: "/media/:path*",
        destination: `${backendOrigin}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
