import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Prisma 7부터 DB 연결 정보는 schema.prisma가 아니라 이 파일에서 관리한다.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
