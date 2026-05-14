import type {NextConfig} from "next";

const backendOrigin =
  process.env.BACKEND_ORIGIN ||
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ||
  (process.env.NODE_ENV === "production" ? "https://stg.be-u.ai" : "http://localhost:8000");

const nextConfig: NextConfig = {
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
