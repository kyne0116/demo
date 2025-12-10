/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default-key',
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig