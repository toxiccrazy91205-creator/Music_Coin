export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"] || "postgresql://musiccoin:musiccoin_pass@postgres:5432/music_coin_demo?schema=public",
  },
};
