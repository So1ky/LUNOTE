import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const isProd = config.get('NODE_ENV') === 'production';

  // SIGTERM(K8s 롤링 배포) 시 onModuleDestroy 훅 실행 — Prisma 연결 해제, BullMQ 워커 drain
  app.enableShutdownHooks();

  // HTTPS 강제 전환 지시는 프로덕션에서만 켠다.
  // - hsts: 로컬에 보내면 브라우저가 이후 모든 localhost 요청을 https로 바꿔버려
  //   다른 포트/프로젝트까지 최대 1년간 접속 불가가 된다.
  // - upgrade-insecure-requests: 같은 이유로 로컬에서는 제외한다.
  app.use(
    helmet({
      hsts: isProd,
      contentSecurityPolicy: {
        useDefaults: true,
        directives: isProd ? {} : { 'upgrade-insecure-requests': null },
      },
    }),
  );

  // ALB 뒤에서 동작하므로 X-Forwarded-For를 신뢰해야 rate limit이 실제 클라이언트 IP 기준으로 동작한다
  app.set('trust proxy', 1);

  // 모바일 앱은 Origin을 보내지 않지만, 관리자 웹/결제 리다이렉트를 위해 명시적으로 설정
  const origins =
    config.get<string>('CORS_ORIGINS')?.split(',').filter(Boolean) ?? [];
  app.enableCors({
    origin: origins.length > 0 ? origins : false,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 없는 필드는 제거
      forbidNonWhitelisted: true, // 모르는 필드가 오면 400
      transform: true,
    }),
  );

  // API 문서는 개발 환경에서만 노출한다 (프로덕션에서 엔드포인트 구조를 공개하지 않기 위해)
  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('LUNOTE API')
      .setDescription('한국 거주 외국인 대상 컨시어지 플랫폼 API')
      .setVersion('1.0')
      .addBearerAuth() // 우측 상단 Authorize 버튼에 JWT를 넣으면 이후 요청에 자동 첨부된다
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  // 기본은 루프백 전용 — 같은 네트워크의 다른 기기가 개발 서버에 접근하지 못하게 한다.
  // 실기기(폰) 테스트 등으로 LAN 노출이 필요할 때만 HOST=0.0.0.0 으로 실행한다.
  // 프로덕션(K8s)에서는 Pod 외부에서 접근해야 하므로 HOST=0.0.0.0 이 필수다.
  // 기본값은 env.validation.ts에서 채워진다 (로컬 127.0.0.1, 프로덕션은 HOST 필수)
  await app.listen(
    Number(config.getOrThrow('PORT')),
    config.getOrThrow<string>('HOST'),
  );
}
void bootstrap();
