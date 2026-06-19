import fs from "fs";
import path from "path";
import chalk from "chalk";
import { api } from "../utils/api";
import { getConfig } from "../utils/config";

const LOCAL_FILE = ".storemyapi.json";

const ENV_CANDIDATES = [".env.local", ".env"];

function localPath() {
  return path.join(process.cwd(), LOCAL_FILE);
}

function getProjectId(): string | null {
  const p = localPath();
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"))?.projectId ?? null;
  } catch {
    return null;
  }
}

function resolveEnvFile(file?: string): string | null {
  if (file) {
    const p = path.resolve(process.cwd(), file);
    return fs.existsSync(p) ? p : null;
  }
  // Auto-detect: prefer .env.local, fall back to .env
  for (const candidate of ENV_CANDIDATES) {
    const p = path.join(process.cwd(), candidate);
    if (fs.existsSync(p)) return p;
  }
  // No existing file found
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

function writeEnvFile(filePath: string, data: Record<string, string>) {
  const lines = Object.entries(data).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(filePath, lines.join("\n") + "\n");
}

function mergeIntoEnvFile(filePath: string, incoming: Record<string, string>) {
  const existing = readEnvFile(filePath);
  const merged = { ...existing, ...incoming };
  writeEnvFile(filePath, merged);
}

export async function pull(keyName?: string, opts: { file?: string } = {}) {
  try {
    const auth = getConfig();
    if (!auth?.accessToken) {
      console.log(chalk.red("Not authenticated."));
      console.log("Run: storemyapi login");
      return;
    }

    const projectId = getProjectId();
    if (!projectId) {
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
      }
      return;
    }

    const envFile = path.basename(envPath);
    const headers = { Authorization: `Bearer ${auth.accessToken}` };

    if (keyName) {
      const res = await api.get(`/cli/keys/${encodeURIComponent(keyName)}?projectId=${projectId}`, { headers });
      const { key, value } = res.data;
      mergeIntoEnvFile(envPath, { [key]: value });
      console.log(chalk.green(`Pulled: ${key}`) + chalk.gray(`  (into ${envFile})`));
      return;
    }

    const res = await api.get(`/cli/keys?projectId=${projectId}`, { headers });
    const keys: { key: string; value: string }[] = res.data?.keys ?? [];

    if (!keys.length) {
      console.log(chalk.yellow("No keys found in this project."));
      return;
    }

    const incoming: Record<string, string> = {};
    for (const k of keys) {
      incoming[k.key] = k.value;
    }

    mergeIntoEnvFile(envPath, incoming);
    console.log(chalk.green(`Pulled ${keys.length} key(s) into ${envFile}`));
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error(chalk.red("Pull failed:"), status, data || err.message);
  }
}
