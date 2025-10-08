import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
      // Proxy Django static files for admin panel
      {
        source: "/static/:path*",
        destination: "http://localhost:8000/static/:path*",
      },
      // Proxy Django media files
      {
        source: "/media/:path*",
        destination: "http://localhost:8000/media/:path*",
      },
    ];
  },
};

export default nextConfig;
