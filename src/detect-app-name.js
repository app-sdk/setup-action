import { join } from "node:path";
import { TAURI_CONFIG_PATH } from "./constants.js";
import { readJsonFile, readPackageJson } from "./utils.js";

/**
 * Detects app name from Tauri config or package.json
 * Priority: tauri.conf.json productName > package.json name
 * @param {string} projectPath - Path to the project
 * @returns {Promise<string | null>}
 */
export async function detectAppName(projectPath) {
  // Strategy 1: Tauri config productName
  const tauriConfig = await readJsonFile(join(projectPath, TAURI_CONFIG_PATH));
  if (tauriConfig?.productName) {
    return tauriConfig.productName;
  }

  // Strategy 2: package.json name
  const pkgJson = await readPackageJson(projectPath);
  if (pkgJson?.name) {
    return pkgJson.name;
  }

  return null;
}
