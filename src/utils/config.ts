import fs from "fs";
import os from "os";
import path from "path";

const configDir = path.join(os.homedir(), ".storemyapi");
const configPath = path.join(configDir, "config.json");

export function saveConfig(data: any) {
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir);
  }
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

export function getConfig() {
  if (!fs.existsSync(configPath)) return null;
  return JSON.parse(fs.readFileSync(configPath, "utf-8"));
}