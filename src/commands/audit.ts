import fs from "fs";
import path from "path";
import chalk from "chalk";
import { api } from "../utils/api";
import { getConfig } from "../utils/config";

const LOCAL_FILE = ".storemyapi.json";

function getProjectLocal(): { projectId: string; projectName: string } | null {
  const p = path.join(process.cwd(), LOCAL_FILE);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

function readEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  const result: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    result[key] = value;
  }
  return result;
}

export async function audit() {
  try {
    const auth = getConfig();
    if (!auth?.accessToken) {
      console.log(chalk.red("Not authenticated."));
      console.log("Run: storemyapi login");
      return;
    }

    const local = getProjectLocal();
    if (!local?.projectId) {
      console.log(chalk.red("No linked project found."));
      console.log("Run: storemyapi init  or  storemyapi link");
      return;
    }

    const envPath = path.join(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) {
      console.log(chalk.red("No .env file found in this directory."));
      console.log("Run: storemyapi pull  to fetch keys from the cloud.");
      return;
    }

    const headers = { Authorization: `Bearer ${auth.accessToken}` };
    const res = await api.get(`/projects/${local.projectId}/keys`, { headers });
    const cloudKeys: { key: string; value: string }[] = res.data?.keys ?? [];

    const cloudMap: Record<string, string> = {};
    for (const k of cloudKeys) cloudMap[k.key] = k.value;

    const localMap = readEnvFile(envPath);

    const onlyInCloud = cloudKeys.filter((k) => !(k.key in localMap));
    const onlyInLocal = Object.keys(localMap).filter((k) => !(k in cloudMap));
    const outOfSync = cloudKeys.filter(
      (k) => k.key in localMap && localMap[k.key] !== k.value
    );

    const allClean = !onlyInCloud.length && !onlyInLocal.length && !outOfSync.length;

    console.log(`\nAudit: ${chalk.bold(local.projectName)}\n`);

    if (allClean) {
      console.log(chalk.green("Everything is in sync."));
      console.log("");
      return;
    }

    if (onlyInCloud.length) {
      console.log(chalk.yellow(`In cloud, missing from .env (${onlyInCloud.length}):`));
      for (const k of onlyInCloud) {
        console.log(`  ${chalk.bold(k.key)}`);
      }
      console.log(chalk.gray("  Run: storemyapi pull  to bring these down."));
      console.log("");
    }

    if (onlyInLocal.length) {
      console.log(chalk.yellow(`In .env, not in cloud (${onlyInLocal.length}):`));
      for (const k of onlyInLocal) {
        console.log(`  ${chalk.bold(k)}`);
      }
      console.log(chalk.gray("  Run: storemyapi push  to push these up."));
      console.log("");
    }

    if (outOfSync.length) {
      console.log(chalk.yellow(`Values differ between .env and cloud (${outOfSync.length}):`));
      for (const k of outOfSync) {
        console.log(`  ${chalk.bold(k.key)}`);
      }
      console.log(chalk.gray("  Run: storemyapi pull  or  storemyapi push  to resolve."));
      console.log("");
    }
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error(chalk.red("Audit failed:"), status, data || err.message);
  }
}
