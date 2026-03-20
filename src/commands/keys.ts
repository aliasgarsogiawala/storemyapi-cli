import fs from "fs";
import path from "path";
import chalk from "chalk";
import { api } from "../utils/api";
import { getConfig } from "../utils/config";

const LOCAL_FILE = ".storemyapi.json";

function getProjectId(): string | null {
  const p = path.join(process.cwd(), LOCAL_FILE);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"))?.projectId ?? null;
  } catch {
    return null;
  }
}

function guardAuth() {
  const auth = getConfig();
  if (!auth?.accessToken) {
    console.log(chalk.red("Not authenticated."));
    console.log("Run: storemyapi login");
    return null;
  }
  return auth;
}

function guardProject() {
  const projectId = getProjectId();
  if (!projectId) {
    console.log(chalk.red("No linked project found."));
    console.log("Run: storemyapi init  or  storemyapi link");
    return null;
  }
  return projectId;
}

export async function keyGet(keyName: string) {
  try {
    const auth = guardAuth();
    if (!auth) return;
    const projectId = guardProject();
    if (!projectId) return;

    const headers = { Authorization: `Bearer ${auth.accessToken}` };
    const res = await api.get(
      `/cli/keys/${encodeURIComponent(keyName)}?projectId=${projectId}`,
      { headers }
    );
    const { key, value } = res.data;
    console.log(`${chalk.bold(key)}=${value}`);
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 404) {
      console.log(chalk.red(`Key "${keyName}" not found.`));
      return;
    }
    console.error(chalk.red("key get failed:"), err?.response?.data || err.message);
  }
}

export async function keySet(keyName: string, value: string) {
  try {
    const auth = guardAuth();
    if (!auth) return;
    const projectId = guardProject();
    if (!projectId) return;

    const headers = { Authorization: `Bearer ${auth.accessToken}` };

    // Check existence first
    let exists = false;
    try {
      await api.get(
        `/cli/keys/${encodeURIComponent(keyName)}?projectId=${projectId}`,
        { headers }
      );
      exists = true;
    } catch (err: any) {
      if (err?.response?.status !== 404) throw err;
    }

    if (exists) {
      const { confirm } = await (await import("inquirer")).default.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: `"${keyName}" already exists. Overwrite?`,
          default: false,
        },
      ]);
      if (!confirm) {
        console.log(chalk.yellow("Aborted."));
        return;
      }
    }

    await api.post(
      `/cli/keys`,
      { key: keyName, value, projectId },
      { headers }
    );
    console.log(chalk.green(`Set: ${keyName}`));
  } catch (err: any) {
    console.error(chalk.red("key set failed:"), err?.response?.data || err.message);
  }
}

export async function keyDelete(keyName: string) {
  try {
    const auth = guardAuth();
    if (!auth) return;
    const projectId = guardProject();
    if (!projectId) return;

    const headers = { Authorization: `Bearer ${auth.accessToken}` };
    await api.delete(
      `/cli/keys/${encodeURIComponent(keyName)}?projectId=${projectId}`,
      { headers }
    );
    console.log(chalk.green(`Deleted: ${keyName}`));
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 404) {
      console.log(chalk.red(`Key "${keyName}" not found.`));
      return;
    }
    console.error(chalk.red("key delete failed:"), err?.response?.data || err.message);
  }
}

export async function keyList() {
  try {
    const auth = guardAuth();
    if (!auth) return;
    const projectId = guardProject();
    if (!projectId) return;

    const headers = { Authorization: `Bearer ${auth.accessToken}` };
    const res = await api.get(`/cli/keys?projectId=${projectId}`, { headers });
    const keys: { key: string; value: string }[] = res.data?.keys ?? [];

    if (!keys.length) {
      console.log(chalk.yellow("No keys in this project."));
      return;
    }

    console.log("");
    for (const k of keys) {
      console.log(`${chalk.bold(k.key)}=${k.value}`);
    }
    console.log("");
    console.log(chalk.gray(`${keys.length} key(s)`));
  } catch (err: any) {
    console.error(chalk.red("key list failed:"), err?.response?.data || err.message);
  }
}
