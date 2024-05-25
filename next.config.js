/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: false,
    env: {
        subgraph_url:
            "https://api.studio.thegraph.com/query/31392/medichain-goerli/v0.0.1",
        DAOURI: "https://app.aragon.org/#/daos/sepolia/0x6a63eff4ba55be13f53bc6b6275e1d42248092e6",
    },
}

module.exports = nextConfig
