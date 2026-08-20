/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep tracing and Turbopack scoped to this app when parent directories
  // contain unrelated lockfiles.
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
