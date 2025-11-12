/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Configuração para Netlify
  serverExternalPackages: ["mongodb"],
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "mongodb-client-encryption": false,
      aws4: false,
      snappy: false,
      kerberos: false,
      "@mongodb-js/zstd": false,
      "supports-color": false,
    };

    if (isServer) {
      config.optimization.minimize = false;
    }

    return config;
  },
};

export default nextConfig;
