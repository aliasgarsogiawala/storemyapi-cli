import { api } from "../utils/api";
import { getConfig } from "../utils/config";
import chalk from "chalk";

export async function projects() {
  try {
    const auth = getConfig();

    if (!auth?.accessToken) {
      console.log(chalk.red(" You are not logged in."));
      console.log(chalk.yellow("Run: storemyapi login"));
      return;
    }

    const res = await api.get("/projects", {
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });

    const list = res.data?.projects || [];

    if (!list.length) {
      console.log(chalk.yellow("No projects found."));
      console.log(chalk.gray("Create one on the dashboard or run: storemyapi init"));
      return;
    }

    console.log("\n" + chalk.bold.cyan("Your Projects\n"));

    for (const p of list) {
      const ownerLabel = p.isOwner
        ? chalk.green("owner")
        : chalk.blue(`shared (${p.permission})`);

      const ownerInfo = p.isOwner
        ? ""
        : chalk.gray(` • owner: ${p.ownerEmail || p.ownerName || "unknown"}`);

      console.log(
        `${chalk.bold(p.name)} ${chalk.gray("•")} ${ownerLabel}`
      );

      console.log(
        `${chalk.gray("keys:")} ${p.keyCount} ${ownerInfo}`
      );

      console.log(`${chalk.gray("id:")} ${chalk.dim(p.id)}\n`);
    }
  } catch (err: any) {
    const status = err?.response?.status;
    const url = err?.config?.url;
    const data = err?.response?.data;

    console.error(
      chalk.red("Projects failed:"),
      status,
      url,
      data || err.message
    );
  }
}