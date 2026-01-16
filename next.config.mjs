/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  reactStrictMode: true,
  // Apenas usar export em produção (build), não em dev
  ...(isDev ? {} : { output: 'export' }),
  // Diretório de saída local (será copiado para /manager/dist no Dockerfile)
  // distDir: "out", <--- REMOVED (Use default .next for build, 'out' for export)

  // Desabilitar otimização de imagens para export estático
  images: {
    unoptimized: true,
  },
  // Base path vazio pois será servido na raiz
  basePath: "",
  // Trailing slash
  trailingSlash: false,
  // Rewrites funcionam apenas em dev mode (proxy para o backend Go)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4120/api/:path*",
      },
      {
        source: "/media/:path*",
        destination: "http://localhost:4120/media/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:4120/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;

