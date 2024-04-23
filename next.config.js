/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    subgraph_url: 'https://api.studio.thegraph.com/query/31392/medichain-goerli/v0.0.1',
    pinata_gateway_url: 'https://crimson-logical-reindeer-468.mypinata.cloud/ipfs/',
  },
}

module.exports = nextConfig
