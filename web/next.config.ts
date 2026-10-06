import type { NextConfig } from "next";

// Kanonik adres gonulpusulasi.tr; diğer adresler kalıcı (308) olarak buraya yönlenir.
const CANONICAL = "https://gonulpusulasi.tr";
const ALIAS_HOSTS = [
  "www.gonulpusulasi.tr",
  "gonulpusulasi.com.tr",
  "www.gonulpusulasi.com.tr",
  "gonul-pusulasi.vercel.app",
];

const nextConfig: NextConfig = {
  async redirects() {
    return ALIAS_HOSTS.map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: `${CANONICAL}/:path*`,
      permanent: true,
    }));
  },
};

export default nextConfig;
