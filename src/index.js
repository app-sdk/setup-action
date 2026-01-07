import { pipeline } from "node:stream/promises";
import { getInput, getBooleanInput, setFailed } from "@actions/core";
import {
  GetObjectCommand as S3GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Extract } from "unzipper";

try {
  const s3Client = new S3Client({
    credentials: {
      accessKeyId: getInput("s3-access-key-id") || undefined,
      secretAccessKey: getInput("s3-secret-access-key") || undefined,
    },
    region: getInput("s3-region") || undefined,
    endpoint: getInput("s3-endpoint") || undefined,
    forcePathStyle: getBooleanInput("s3-force-path-style") || false,
  });
  const s3Response = await s3Client.send(
    new S3GetObjectCommand({
      Bucket: getInput("s3-bucket", { required: true }),
      Key: getInput("s3-key", { required: true }),
    }),
  );
  await pipeline(
    s3Response.Body,
    Extract({ path: process.env.GITHUB_WORKSPACE }),
  );
} catch (error) {
  setFailed(error);
}
