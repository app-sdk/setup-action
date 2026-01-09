import { pipeline } from "node:stream/promises";
import { getInput, getBooleanInput, setFailed, setOutput } from "@actions/core";
import {
  GetObjectCommand as S3GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Extract } from "unzipper";
import { detectPackageManager } from "./detect-package-manager.js";
import { detectNodeVersion } from "./detect-node-version.js";
import { updateTauriConfig } from "./update-tauri-config.js";
import { detectAppName } from "./detect-app-name.js";
import { detectAppVersion } from "./detect-app-version.js";

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

  // Update Tauri config if present
  await updateTauriConfig(workspacePath);

  // Detect Node.js version, package manager, and app details
  const [appName, appVersion, nodeVersion, packageManager] = await Promise.all([
    detectAppName(workspacePath),
    detectAppVersion(workspacePath),
    detectNodeVersion(workspacePath),
    detectPackageManager(workspacePath),
  ]);

  // Define package manager commands
  const PACKAGE_MANAGER_COMMANDS = {
    npm: { install: "npm ci", exec: "npx" },
    yarn: { install: "yarn install", exec: "yarn exec" },
    pnpm: { install: "pnpm install", exec: "pnpm exec" },
    bun: { install: "bun install", exec: "bunx" },
  };
  const commands = packageManager.name
    ? PACKAGE_MANAGER_COMMANDS[packageManager.name]
    : null;

  // Set outputs
  setOutput("app-name", appName || "");
  setOutput("app-version", appVersion || "");
  setOutput("node-version", nodeVersion || "");
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
  setOutput("install-command", commands?.install || "");
  setOutput("exec-command", commands?.exec || "");
} catch (error) {
  setFailed(error);
}
