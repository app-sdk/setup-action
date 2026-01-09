import { join } from "node:path";
import { TAURI_CONFIG_PATH } from "./constants.js";
import { readJsonFile, readPackageJson } from "./utils.js";

/**
 * Detects app version from Tauri config or package.json
 * Priority: tauri.conf.json version > package.json version
 * @param {string} projectPath - Path to the project
 * @returns {Promise<string | null>}
 */
export async function detectAppVersion(projectPath) {
  // Strategy 1: Tauri config version
  const tauriConfig = await readJsonFile(join(projectPath, TAURI_CONFIG_PATH));
  if (tauriConfig?.version) {
    return tauriConfig.version;
  }

  // Strategy 2: package.json version
  const pkgJson = await readPackageJson(projectPath);
  if (pkgJson?.version) {
    return pkgJson.version;
  }

  return null;
}
