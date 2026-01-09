import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Checks if a file exists
 * @param {string} filePath
 * @returns {Promise<boolean>}
 */
export async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads a text file, returns null on error
 * @param {string} filePath
 * @returns {Promise<string | null>}
 */
export async function readTextFile(filePath) {
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

/**
 * Reads and parses a JSON file
 * @param {string} filePath
 * @returns {Promise<object | null>}
 */
export async function readJsonFile(filePath) {
  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Writes an object as JSON to a file
 * @param {string} filePath
 * @param {object} data
 * @returns {Promise<void>}
 */
export async function writeJsonFile(filePath, data) {
  await writeFile(filePath, JSON.stringify(data, null, 2) + "\n");
}

/**
 * Reads and parses package.json from a project path
 * @param {string} projectPath
 * @returns {Promise<object | null>}
 */
export async function readPackageJson(projectPath) {
  return readJsonFile(join(projectPath, "package.json"));
}
