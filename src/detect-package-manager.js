import { join } from "node:path";
import { fileExists, readPackageJson } from "./utils.js";

const LOCK_FILES = {
  "pnpm-lock.yaml": "pnpm",
  "yarn.lock": "yarn",
  "package-lock.json": "npm",
  "npm-shrinkwrap.json": "npm",
  "bun.lockb": "bun",
  "bun.lock": "bun",
};

/**
 * Parses packageManager field (e.g., "pnpm@10.27.0" or "pnpm@10.27.0+sha256.xxx")
 * @param {string} value
 * @returns {{ name: string, version: string | null }}
 */
function parsePackageManagerField(value) {
  // Remove corepack hash suffix if present (e.g., "+sha256.xxx")
  const withoutHash = value.split("+")[0];

  // Handle "^pnpm@10.27.0" format (remove leading ^)
  const normalized = withoutHash.replace(/^\^/, "");

  const atIndex = normalized.indexOf("@");
  if (atIndex === -1) {
    return { name: normalized, version: null };
  }

  return {
    name: normalized.substring(0, atIndex),
    version: normalized.substring(atIndex + 1),
  };
}

/**
 * Gets package manager version from packageManager field if names match
 * @param {string} projectPath
 * @param {string} pmName
 * @returns {Promise<string | null>}
 */
async function getPackageManagerVersion(projectPath, pmName) {
  const pkgJson = await readPackageJson(projectPath);
  if (pkgJson?.packageManager) {
    const parsed = parsePackageManagerField(pkgJson.packageManager);
    if (parsed.name === pmName) {
      return parsed.version;
    }
  }
  return null;
}

/**
 * Detects package manager from lock files and package.json
 * @param {string} projectPath - Path to the project
 * @returns {Promise<{ name: string | null, version: string | null }>}
 */
export async function detectPackageManager(projectPath) {
  // Strategy 1: Check lock files (highest priority)
  for (const [lockFile, pmName] of Object.entries(LOCK_FILES)) {
    if (await fileExists(join(projectPath, lockFile))) {
      const version = await getPackageManagerVersion(projectPath, pmName);
      return { name: pmName, version };
    }
  }

  // Strategy 2: Check packageManager field in package.json
  const pkgJson = await readPackageJson(projectPath);
  if (pkgJson?.packageManager) {
    return parsePackageManagerField(pkgJson.packageManager);
  }

  return { name: null, version: null };
}
