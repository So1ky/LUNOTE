import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Attachments (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const stamp = Date.now();
  const password = 'test-password-123';
  let token: string;

  const signup = async (email: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password })
      .expect(201);
    const token = (res.body as { accessToken: string }).accessToken;
    await verifyByDb(email);
    return token;
  };
  const verifyByDb = async (email: string) => {
    // 게이트(EmailVerifiedGuard) 통과용 — 인증 플로우 자체는 email-verification 스펙에서 검증
    await prisma.user.update({
      where: { email },
      data: { emailVerifiedAt: new Date() },
    });
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    token = await signup(`att-${stamp}@test.lunote.app`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('실행 파일 MIME은 400', () => {
    return request(app.getHttpServer())
      .post('/attachments/presign')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileName: 'x.exe',
        mimeType: 'application/x-executable',
        sizeBytes: 100,
      })
      .expect(400);
  });

  it('10MB 초과는 400', () => {
    return request(app.getHttpServer())
      .post('/attachments/presign')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileName: 'big.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 11 * 1024 * 1024,
      })
      .expect(400);
  });

  it('경로 문자가 든 파일명은 400 (키 조작 방지)', () => {
    return request(app.getHttpServer())
      .post('/attachments/presign')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileName: '../../etc/passwd',
        mimeType: 'image/png',
        sizeBytes: 100,
      })
      .expect(400);
  });

  it('전체 루프: presign → MinIO 업로드 → 문의 첨부 → 상세에서 다운로드', async () => {
    // 1) presign
    const presign = await request(app.getHttpServer())
      .post('/attachments/presign')
      .set('Authorization', `Bearer ${token}`)
      .send({ fileName: 'photo.png', mimeType: 'image/png', sizeBytes: 8 })
      .expect(201);
    const { s3Key, uploadUrl } = presign.body as {
      s3Key: string;
      uploadUrl: string;
    };
    expect(s3Key).toMatch(/^uploads\//);

    // 2) presigned URL로 직접 PUT (실제 MinIO)
    const bytes = Buffer.from('PNGDATA!');
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      body: bytes,
    });
    expect(putRes.ok).toBe(true);

    // 3) 문의 생성에 첨부 연결
    const created = await request(app.getHttpServer())
      .post('/quote-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'HOUSING',
        description: 'Need help with housing contract, see attached photo.',
        contactMethod: 'email: a@b.c',
        attachments: [
          { s3Key, fileName: 'photo.png', mimeType: 'image/png', sizeBytes: 8 },
        ],
      })
      .expect(201);
    const requestId = (created.body as { id: number }).id;

    // 4) 상세 조회 → downloadUrl 발급 → 실제 다운로드해서 내용 일치 확인
    const detail = await request(app.getHttpServer())
      .get(`/quote-requests/${requestId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const atts = (
      detail.body as {
        attachments: { fileName: string; downloadUrl: string }[];
      }
    ).attachments;
    expect(atts).toHaveLength(1);
    expect(atts[0].fileName).toBe('photo.png');

    const download = await fetch(atts[0].downloadUrl);
    expect(download.ok).toBe(true);
    expect(Buffer.from(await download.arrayBuffer()).toString()).toBe(
      'PNGDATA!',
    );
  });

  it('타인의 s3Key를 첨부하면 400 (소유권 검증)', async () => {
    const otherToken = await signup(`att-other-${stamp}@test.lunote.app`);
    const presign = await request(app.getHttpServer())
      .post('/attachments/presign')
      .set('Authorization', `Bearer ${token}`) // 사용자 A의 키
      .send({ fileName: 'a.png', mimeType: 'image/png', sizeBytes: 4 })
      .expect(201);
    const { s3Key } = presign.body as { s3Key: string };

    return request(app.getHttpServer())
      .post('/quote-requests')
      .set('Authorization', `Bearer ${otherToken}`) // 사용자 B가 A의 키로 시도
      .send({
        category: 'OTHER',
        description: 'Trying to attach someone else file.',
        contactMethod: 'email: b@c.d',
        attachments: [
          { s3Key, fileName: 'a.png', mimeType: 'image/png', sizeBytes: 4 },
        ],
      })
      .expect(400);
  });
});
