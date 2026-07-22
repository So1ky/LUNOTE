import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());

  // ALB 뒤에서 동작하므로 X-Forwarded-For를 신뢰해야 rate limit이 실제 클라이언트 IP 기준으로 동작한다
  app.set('trust proxy', 1);

  // 모바일 앱은 Origin을 보내지 않지만, 관리자 웹/결제 리다이렉트를 위해 명시적으로 설정
  const origins = process.env.CORS_ORIGINS?.split(',').filter(Boolean) ?? [];
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
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('LUNOTE API')
      .setDescription('한국 거주 외국인 대상 컨시어지 플랫폼 API')
      .setVersion('1.0')
      .addBearerAuth() // 우측 상단 Authorize 버튼에 JWT를 넣으면 이후 요청에 자동 첨부된다
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
