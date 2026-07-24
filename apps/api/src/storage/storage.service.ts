import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly uploadTtlSec: number;
  private readonly downloadTtlSec: number;

  constructor(config: ConfigService) {
    const endpoint = config.get<string>('S3_ENDPOINT');
    this.bucket = config.getOrThrow<string>('S3_BUCKET');
    this.uploadTtlSec = Number(config.getOrThrow('PRESIGN_UPLOAD_TTL_SEC'));
    this.downloadTtlSec = Number(config.getOrThrow('PRESIGN_DOWNLOAD_TTL_SEC'));
    this.client = new S3Client({
      region: config.getOrThrow<string>('S3_REGION'),
      // 로컬 MinIO용 설정. 프로덕션(S3 + IRSA)에서는 endpoint/credentials를 지정하지 않는다.
      ...(endpoint
        ? {
            endpoint,
            forcePathStyle: true, // MinIO는 path-style URL 필요
            credentials: {
              accessKeyId: config.getOrThrow<string>('S3_ACCESS_KEY'),
              secretAccessKey: config.getOrThrow<string>('S3_SECRET_KEY'),
            },
          }
        : {}),
    });
  }

  /** 업로드용 presigned URL — 클라이언트가 이 URL로 직접 PUT (파일이 API 서버를 거치지 않음) */
  presignUpload(key: string, mimeType: string) {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType,
      }),
      { expiresIn: this.uploadTtlSec },
    );
  }

  /** 다운로드용 presigned URL — 버킷은 비공개이므로 조회 시마다 임시 URL 발급 */
  presignDownload(key: string) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: this.downloadTtlSec },
    );
  }
}
