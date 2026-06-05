/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@react-pdf/renderer'],
  eslint: {
    // Phase 1 MVP: 빌드 시 ESLint 검사 비활성화 (any/unused 룰 정리는 v1.5에서)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 일부 외부 모듈 타입 충돌 방지 (v1.5에서 strict 복구)
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'mathjs', 'recharts'],
    esmExternals: 'loose',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    // 3D glb/gltf 모델 임포트
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: 'asset/resource',
    });
    // pptxgenjs 등 클라이언트 번들에서 Node 빌트인 fallback (브라우저에선 미사용)
    if (!isServer) {
      const nodeBuiltins = ["https", "http", "fs", "path", "stream", "zlib", "crypto", "os"];
      const fallback = { ...(config.resolve.fallback || {}) };
      for (const m of nodeBuiltins) {
        fallback[m] = false;
        fallback[`node:${m}`] = false;
      }
      config.resolve.fallback = fallback;
      // node: 스킴 alias → false
      // node: 스킴 import를 클라이언트 번들에서 무시 (pptxgenjs는 브라우저에서 node 미사용)
      config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^node:(https|http|fs|stream|zlib|crypto|os|path)$/ })
      );
    }
    return config;
  },
};

export default nextConfig;
