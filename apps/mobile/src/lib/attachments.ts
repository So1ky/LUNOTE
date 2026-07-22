import { api } from './api';

export type AttachmentInput = {
  s3Key: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type Attachment = AttachmentInput & {
  id: string;
  downloadUrl: string;
};

/**
 * presign → 스토리지에 직접 PUT 업로드.
 * 파일 바이트는 API 서버를 거치지 않고 S3(MinIO)로 바로 올라간다.
 */
export async function uploadAttachment(
  token: string,
  file: { uri: string; fileName: string; mimeType: string },
): Promise<AttachmentInput> {
  const blob = await (await fetch(file.uri)).blob();
  const sizeBytes = blob.size;

  const { s3Key, uploadUrl } = await api<{ s3Key: string; uploadUrl: string }>(
    '/attachments/presign',
    {
      method: 'POST',
      body: { fileName: file.fileName, mimeType: file.mimeType, sizeBytes },
      token,
    },
  );

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.mimeType },
    body: blob,
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }

  return { s3Key, fileName: file.fileName, mimeType: file.mimeType, sizeBytes };
}
