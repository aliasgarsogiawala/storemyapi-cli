import fs from "fs";
import path from "path";
import chalk from "chalk";
import { api } from "../utils/api";
import { getConfig } from "../utils/config";

const LOCAL_FILE = ".storemyapi.json";

function pass(msg: string) {
  console.log(chalk.green("  ok  ") + msg);
}

function fail(msg: string, hint?: string) {
  console.log(chalk.red(" fail ") + msg);
  if (hint) console.log(chalk.gray(`       ${hint}`));
}

function warn(msg: string, hint?: string) {
  console.log(chalk.yellow(" warn ") + msg);
  if (hint) console.log(chalk.gray(`       ${hint}`));
}

export async function doctor() {
  console.log("\nRunning diagnostics...\n");

  const [major] = process.versions.node.split(".").map(Number);
  if (major >= 18) {
    pass(`Node.js ${process.versions.node}`);
  } else {
    fail(`Node.js ${process.versions.node}`, "Version 18 or higher is required.");
  }

  const auth = getConfig();
  if (!auth?.accessToken) {
    fail("Not authenticated.", "Run: storemyapi login");
  } else {
    try {
      await api.get("/cli/me", {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      pass("Authenticated, session valid, and API reachable");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        fail("Session expired.", "Run: storemyapi login");
      } else {
        fail("Could not reach API.", "Check your internet connection.");
      }
    }
  }

  const localFilePath = path.join(process.cwd(), LOCAL_FILE);
  if (!fs.existsSync(localFilePath)) {
    warn("No linked project in this folder.", "Run: storemyapi init  or  storemyapi link");
  } else {
    try {
      const local = JSON.parse(fs.readFileSync(localFilePath, "utf-8"));
      if (local?.projectId && local?.projectName) {
        pass(`Linked to project: ${local.projectName}`);
      } else {
        fail(`${LOCAL_FILE} is malformed.`, "Run: storemyapi link to relink.");
      }
    } catch {
      fail(`${LOCAL_FILE} could not be parsed.`, "Run: storemyapi link to relink.");
    }
  }

  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    pass(".env file present");
  } else {
    warn("No .env file in this directory.", "Run: storemyapi pull to create one.");
  }

  console.log("");
}
