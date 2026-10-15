/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Disable symlink resolution on FAT32 drives to prevent Windows readlink EISDIR errors
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
