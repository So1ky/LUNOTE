import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
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
      // 로컬 S3Mock용 설정. 프로덕션(S3 + IRSA)에서는 endpoint/credentials를 지정하지 않는다.
      ...(endpoint
        ? {
            endpoint,
            forcePathStyle: true, // S3Mock은 path-style URL 필요
            credentials: {
              accessKeyId: config.getOrThrow<string>('S3_ACCESS_KEY'),
              secretAccessKey: config.getOrThrow<string>('S3_SECRET_KEY'),
            },
          }
        : {}),
    });
  }

  /** 업로드용 presigned URL — 클라이언트가 이 URL로 직접 PUT (파일이 API 서버를 거치지 않음) */
  presignUpload(key: string, mimeType: string, sizeBytes: number) {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType,
        // Content-Length를 서명에 포함 — presign 시 신고한 크기와 다른 업로드는
        // 스토리지가 서명 불일치로 거부한다 (DTO의 10MB 제한이 실제로 강제됨)
        ContentLength: sizeBytes,
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

  /**
   * 사용자 프리픽스(uploads/<id>/) 아래 객체를 전부 영구 삭제한다 (버킷 버전 관리 없음).
   * 매번 처음부터 다시 목록을 받아 빌 때까지 반복 — 삭제 중 연속 토큰이 어긋날 일이 없다.
   * 부분 실패는 throw해서 호출 측(BullMQ 잡)이 재시도하게 한다.
   */
  async deletePrefix(prefix: string): Promise<number> {
    if (!/^uploads\/[^/]+\/$/.test(prefix)) {
      throw new Error(`refusing to delete unexpected prefix: "${prefix}"`);
    }
    let deleted = 0;
    for (;;) {
      const page = await this.client.send(
        new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }),
      );
      const objects = (page.Contents ?? []).flatMap((o) =>
        o.Key ? [{ Key: o.Key }] : [],
      );
      if (objects.length === 0) return deleted;

      const res = await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: { Objects: objects, Quiet: true },
        }),
      );
      if (res.Errors?.length) {
        throw new Error(
          `S3 delete failed for ${res.Errors.length} object(s): ${res.Errors[0].Code}`,
        );
      }
      deleted += objects.length;
    }
  }
}
