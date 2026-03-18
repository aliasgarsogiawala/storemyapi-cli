import chalk from "chalk";
import { api } from "../utils/api";
import { getConfig } from "../utils/config";

export async function whoami() {
  try {
    const config = getConfig();

    if (!config?.accessToken) {
      console.log(chalk.red("Not authenticated."));
      console.log("Run: storemyapi login");
      return;
    }

    const res = await api.get("/cli/me", {
      headers: { Authorization: `Bearer ${config.accessToken}` },
    });

    console.log(`Logged in as: ${chalk.bold(res.data.email)}`);
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 401) {
      console.log(chalk.red("Session expired."));
    } else {
      console.log(chalk.red("Could not reach API."));
    }
    console.log("Run: storemyapi login");
  }
}