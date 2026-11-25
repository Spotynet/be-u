import type {NextConfig} from "next";

const backendOrigin =
  process.env.BACKEND_ORIGIN ||
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ||
  (process.env.NODE_ENV === "production" ? "https://api.nabbi.app" : "http://localhost:8000");

/**
 * Next `:path*` captures omit the trailing slash, so a single
 * `/api/:path*` → backend `/api/:path*` rewrite turns
 * `/api/auth/register/` into `/api/auth/register`. Django then APPEND_SLASH
 * 301s back to the slashed URL and browsers loop (POST becomes GET).
 * Match slashed and non-slashed sources explicitly.
 */
const djangoProxyRewrites = (prefix: "/api" | "/static" | "/media") => [
  {
    source: `${prefix}/:path+/`,
    destination: `${backendOrigin}${prefix}/:path+/`,
  },
  {
    source: `${prefix}/:path+`,
    destination: `${backendOrigin}${prefix}/:path+`,
  },
  {
    source: `${prefix}/`,
    destination: `${backendOrigin}${prefix}/`,
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Django API paths use trailing slashes. If /api is ever served by Next
  // (misrouted api host), the default 308 strip has no CORS headers and
  // browsers report "Access-Control-Allow-Origin missing" / status 308.
  skipTrailingSlashRedirect: true,
  allowedDevOrigins: ["nabbi-dev.spotynet.com"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nabbi.s3.us-east-1.amazonaws.com",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "nabbi.s3.amazonaws.com",
        pathname: "/media/**",
      },
    ],
  },
  async rewrites() {
    return [
      ...djangoProxyRewrites("/api"),
      ...djangoProxyRewrites("/static"),
      ...djangoProxyRewrites("/media"),
    ];
  },
};

export default nextConfig;
