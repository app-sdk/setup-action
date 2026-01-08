import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Reads a simple version file (.nvmrc, .node-version)
 * Handles various formats: "v20.10.0", "20.10.0", "20", "lts/*"
 * @param {string} filePath
 * @returns {Promise<string | null>}
 */
async function readVersionFile(filePath) {
  try {
    const content = await readFile(filePath, "utf-8");
    const trimmed = content.trim();

    // Return null if file is empty or only whitespace
    if (!trimmed) {
      return null;
    }

    // Handle comments (lines starting with #)
    const lines = trimmed.split("\n");
    for (const line of lines) {
      const stripped = line.trim();
      if (stripped && !stripped.startsWith("#")) {
        return stripped;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parses .tool-versions file (asdf format)
 * Format: "nodejs 20.10.0" or "nodejs 20.10.0 18.0.0" (first is primary)
 * @param {string} projectPath
 * @returns {Promise<string | null>}
 */
async function readToolVersions(projectPath) {
  try {
    const content = await readFile(
      join(projectPath, ".tool-versions"),
      "utf-8",
    );

    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      // Parse "tool version [version2 ...]" format
      const parts = trimmed.split(/\s+/);
      if (parts[0] === "nodejs" && parts[1]) {
        // Return the first (primary) version
        return parts[1];
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Reads and parses package.json
 * @param {string} projectPath
 * @returns {Promise<object | null>}
 */
async function readPackageJson(projectPath) {
  try {
    const content = await readFile(join(projectPath, "package.json"), "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Detects Node.js version from various sources
 * @param {string} projectPath - Path to the project
 * @returns {Promise<string | null>}
 */
export async function detectNodeVersion(projectPath) {
  // Strategy 1: .node-version file
  const nodeVersionFile = await readVersionFile(
    join(projectPath, ".node-version"),
  );
  if (nodeVersionFile) {
    return nodeVersionFile;
  }

  // Strategy 2: .nvmrc file
  const nvmrc = await readVersionFile(join(projectPath, ".nvmrc"));
  if (nvmrc) {
    return nvmrc;
  }

  // Strategy 3: .tool-versions (asdf format)
  const toolVersions = await readToolVersions(projectPath);
  if (toolVersions) {
    return toolVersions;
  }

  // Strategy 4 & 5: package.json (volta.node then engines.node)
  const pkgJson = await readPackageJson(projectPath);
  if (pkgJson) {
    // Volta takes precedence (exact version)
    if (pkgJson.volta?.node) {
      return pkgJson.volta.node;
    }

    // engines.node as fallback (may be a range)
    if (pkgJson.engines?.node) {
      return pkgJson.engines.node;
    }
  }

  return null;
}
