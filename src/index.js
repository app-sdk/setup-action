import { pipeline } from "node:stream/promises";
import { getInput, getBooleanInput, setFailed, setOutput } from "@actions/core";
import {
  GetObjectCommand as S3GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Extract } from "unzipper";
import { detectPackageManager } from "./detect-package-manager.js";
import { detectNodeVersion } from "./detect-node-version.js";

try {
  // Download and extract the project from S3
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
  const workspacePath = process.env.GITHUB_WORKSPACE;
  await pipeline(s3Response.Body, Extract({ path: workspacePath }));

  // Detect package manager and Node version after extraction
  const packageManager = await detectPackageManager(workspacePath);
  const nodeVersion = await detectNodeVersion(workspacePath);

  // Set outputs
  setOutput("package-manager", packageManager.name || "");
  setOutput(
    "pnpm-version",
    packageManager.name === "pnpm" ? packageManager.version || "" : "",
  );
  setOutput(
    "npm-version",
    packageManager.name === "npm" ? packageManager.version || "" : "",
  );
  setOutput(
    "yarn-version",
    packageManager.name === "yarn" ? packageManager.version || "" : "",
  );
  setOutput(
    "bun-version",
    packageManager.name === "bun" ? packageManager.version || "" : "",
  );
  setOutput("node-version", nodeVersion || "");
} catch (error) {
  setFailed(error);
}
