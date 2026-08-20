import { Client } from "minio";

const globalForMinio = globalThis as unknown as {
  minio: Client | undefined;
};

export const minio =
  globalForMinio.minio ??
  new Client({
    endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
    port: parseInt(process.env.MINIO_PORT ?? "9000"),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
  });

if (process.env.NODE_ENV !== "production") globalForMinio.minio = minio;

export const BUCKET_NAME = process.env.MINIO_BUCKET ?? "task-attachments";

export async function ensureBucketExists() {
  const exists = await minio.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minio.makeBucket(BUCKET_NAME, "us-east-1");
    // Make bucket publicly readable
    const policy = JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        },
      ],
    });
    await minio.setBucketPolicy(BUCKET_NAME, policy);
  }
}

export function getPublicUrl(objectName: string): string {
  const endpoint = process.env.MINIO_ENDPOINT ?? "localhost";
  const port = process.env.MINIO_PORT ?? "9000";
  const useSSL = process.env.MINIO_USE_SSL === "true";
  const protocol = useSSL ? "https" : "http";
  return `${protocol}://${endpoint}:${port}/${BUCKET_NAME}/${objectName}`;
}
