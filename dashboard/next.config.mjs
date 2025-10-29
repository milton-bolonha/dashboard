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
  experimental: {
    serverComponentsExternalPackages: ["mongodb"],
  },
  webpack: (config, { isServer }) => {
    // A biblioteca do MongoDB usa alguns módulos que não são feitos
    // para o navegador. Esta configuração diz ao Next.js para
    // fornecer versões vazias para eles no lado do cliente, evitando
    // erros de build e de runtime que quebram a autenticação.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "mongodb-client-encryption": false,
      aws4: false,
      snappy: false,
      kerberos: false,
      "@mongodb-js/zstd": false,
      "supports-color": false,
    };

    // Otimizações para serverless
    if (isServer) {
      config.optimization.minimize = false; // Desabilitar minificação para melhor debugging
    }

    return config;
  },
};

export default nextConfig;
