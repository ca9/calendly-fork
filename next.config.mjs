/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    },
    webpack: (config, { dev }) => {
        if (!dev) {
            config.devtool = false; // Disable source maps in production
        } else {
            config.devtool = 'eval-source-map'; // Enable source maps in development
        }
        return config;
    },
};

export default nextConfig;
