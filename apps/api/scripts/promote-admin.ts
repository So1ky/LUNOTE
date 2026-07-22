/**
 * 기존 사용자를 관리자로 승격한다.
 * 사용법: npm run promote-admin -- you@example.com
 *
 * 첫 관리자 생성 절차: 일반 가입(POST /auth/signup) 후 이 스크립트 실행.
 * 프로덕션에서는 배포 환경의 시크릿으로 DATABASE_URL을 지정해 실행한다.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '@prisma/client';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('사용법: npm run promote-admin -- <email>');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: UserRole.ADMIN },
      select: { id: true, email: true, role: true },
    });
    console.log(`✅ 관리자 승격 완료: ${user.email} (${user.id})`);
  } catch {
    console.error(`❌ 해당 이메일의 사용자를 찾을 수 없습니다: ${email}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
