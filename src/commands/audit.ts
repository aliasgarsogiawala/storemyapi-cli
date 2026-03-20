import fs from "fs";
import path from "path";
import chalk from "chalk";
import { api } from "../utils/api";
import { getConfig } from "../utils/config";

const LOCAL_FILE = ".storemyapi.json";

const ENV_CANDIDATES = [".env.local", ".env"];

function getProjectLocal(): { projectId: string; projectName: string } | null {
  const p = path.join(process.cwd(), LOCAL_FILE);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

function resolveEnvFile(file?: string): string | null {
  if (file) {
    const p = path.resolve(process.cwd(), file);
    return fs.existsSync(p) ? p : null;
  }
  for (const candidate of ENV_CANDIDATES) {
    const p = path.join(process.cwd(), candidate);
    if (fs.existsSync(p)) return p;
  }
  return null;
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

export async function audit(opts: { file?: string } = {}) {
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

    const envPath = resolveEnvFile(opts.file);
    if (!envPath) {
      if (opts.file) {
        console.log(chalk.red(`File not found: ${opts.file}`));
      } else {
        console.log(chalk.red("No .env or .env.local file found in this directory."));
        console.log("Run: storemyapi pull  to fetch keys from the cloud.");
      }
      return;
    }

    const envFile = path.basename(envPath);
    const headers = { Authorization: `Bearer ${auth.accessToken}` };
    const res = await api.get(`/cli/keys?projectId=${local.projectId}`, { headers });
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

    console.log(`\nAudit: ${chalk.bold(local.projectName)} ${chalk.gray(`(${envFile})`)}\n`);

    if (allClean) {
      console.log(chalk.green("Everything is in sync."));
      console.log("");
      return;
    }

    if (onlyInCloud.length) {
      console.log(chalk.yellow(`In cloud, missing from ${envFile} (${onlyInCloud.length}):`));
      for (const k of onlyInCloud) {
        console.log(`  ${chalk.bold(k.key)}`);
      }
      console.log(chalk.gray("  Run: storemyapi pull  to bring these down."));
      console.log("");
    }

    if (onlyInLocal.length) {
      console.log(chalk.yellow(`In ${envFile}, not in cloud (${onlyInLocal.length}):`));
      for (const k of onlyInLocal) {
        console.log(`  ${chalk.bold(k)}`);
      }
      console.log(chalk.gray("  Run: storemyapi push  to push these up."));
      console.log("");
    }

    if (outOfSync.length) {
      console.log(chalk.yellow(`Values differ between ${envFile} and cloud (${outOfSync.length}):`));
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
