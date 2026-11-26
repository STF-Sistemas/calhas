import './src/carregar-env';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx src/cli/seed.ts' },
  datasource: { url: process.env['DATABASE_URL'] },
});
