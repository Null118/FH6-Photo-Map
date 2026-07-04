import type { NextConfig } from "next";

function getRemoteImagePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const storagePublicUrl = process.env.SUPABASE_STORAGE_PUBLIC_URL;
  if (!storagePublicUrl) {
    return [];
  }

  try {
    const url = new URL(storagePublicUrl);

    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: `${url.pathname.replace(/\/$/, "")}/**`,
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: getRemoteImagePatterns(),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
