/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const host = supabaseUrl ? new URL(supabaseUrl).hostname : "";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: host, // contoh: abcdefg.supabase.co
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

module.exports = nextConfig;
