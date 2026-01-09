import { join } from "node:path";
import { info, warning } from "@actions/core";
import { TAURI_CONFIG_PATH } from "./constants.js";
import { readJsonFile, writeJsonFile } from "./utils.js";

const BUNDLE_CONFIG = {
  active: true,
  targets: ["app", "dmg", "nsis"],
  windows: {
    signCommand:
      "trusted-signing-cli -e https://eus.codesigning.azure.net -a phuctm97 -c phuctm97 %1",
  },
};

export async function updateTauriConfig(workspacePath) {
  const configPath = join(workspacePath, TAURI_CONFIG_PATH);
  const configJson = await readJsonFile(configPath);
  if (!configJson) {
    info(
      "No valid src-tauri/tauri.conf.json found, skipping Tauri config update",
    );
    return;
  }
  try {
    configJson.bundle = {
      ...configJson.bundle,
      ...BUNDLE_CONFIG,
      createUpdaterArtifacts: !!configJson.plugins?.updater,
      windows: {
        ...configJson.bundle?.windows,
        ...BUNDLE_CONFIG.windows,
      },
    };
    await writeJsonFile(configPath, configJson);
    info("Updated src-tauri/tauri.conf.json with bundle configuration");
  } catch (error) {
    warning(`Failed to update Tauri config: ${error.message}`);
  }
}
