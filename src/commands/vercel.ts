import chalk from "chalk";
import * as readline from "readline";
import { api } from "../utils/api";
import { getConfig } from "../utils/config";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PushResult {
  pushed: string[];
  failed: string[];
  skipped: string[];
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function prompt(question: string, silent = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    if (silent) {
      // Hide input for tokens
      process.stdout.write(question);
      let value = "";
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", function handler(ch: string) {
        if (ch === "\n" || ch === "\r" || ch === "\u0003") {
          process.stdin.setRawMode(false);
          process.stdin.removeListener("data", handler);
          process.stdout.write("\n");
          rl.close();
          resolve(value);
        } else if (ch === "\u007f" || ch === "\b") {
          if (value.length > 0) {
            value = value.slice(0, -1);
          }
        } else {
          value += ch;
        }
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

function printBetaBanner() {
  console.log(
    chalk.yellow("  [BETA] ") +
      chalk.gray("This feature may have bugs. Please report issues at https://github.com/anomalyco/opencode")
  );
  console.log();
}

// ─── Command ──────────────────────────────────────────────────────────────────

export async function vercelDeploy(opts: {
  token?: string;
  project?: string;
  team?: string;
  target?: string;
  keys?: string[];
  yes?: boolean;
}) {
  try {
    // Auth check
    const auth = getConfig();
    if (!auth?.accessToken) {
      console.log(chalk.red("Not authenticated."));
      console.log("Run: storemyapi login");
      return;
    }

    const headers = { Authorization: `Bearer ${auth.accessToken}` };

    // ── Print beta notice ──────────────────────────────────────────
    console.log();
    console.log(chalk.bold("Deploy to Vercel") + chalk.yellow("  [BETA]"));
    printBetaBanner();

    // ── Fetch available keys ───────────────────────────────────────
    process.stdout.write(chalk.gray("Fetching your keys..."));
    const keysRes = await api.get("/keys", { headers });
    const allKeys: Array<{
      id: string;
      name: string;
      isCli: boolean;
    }> = keysRes.data?.keys ?? keysRes.data ?? [];
    process.stdout.write(" " + chalk.green("done") + "\n");

    if (!allKeys.length) {
      console.log(chalk.yellow("No keys found in your account."));
      return;
    }

    // ── Determine which keys to deploy ────────────────────────────
    let selectedKeys: typeof allKeys;

    if (opts.keys && opts.keys.length > 0) {
      // Filter by names provided via --key flags
      const nameSet = new Set(opts.keys.map((k) => k.toUpperCase()));
      selectedKeys = allKeys.filter((k) => nameSet.has(k.name.toUpperCase()));
      const notFound = opts.keys.filter((k) => !allKeys.find((a) => a.name.toUpperCase() === k.toUpperCase()));
      if (notFound.length) {
        console.log(chalk.yellow(`Warning: keys not found: ${notFound.join(", ")}`));
      }
      if (!selectedKeys.length) {
        console.log(chalk.red("None of the specified keys were found."));
        return;
      }
    } else {
      // Deploy all CLI-encrypted keys (browser-encrypted keys can't be decrypted server-side)
      const cliKeys = allKeys.filter((k) => k.isCli);
      const browserKeys = allKeys.filter((k) => !k.isCli);

      if (!cliKeys.length && browserKeys.length > 0) {
        console.log(
          chalk.yellow("All your keys are browser-encrypted and cannot be deployed from the CLI.")
        );
        console.log(
          chalk.gray("Use the web dashboard to deploy browser-encrypted keys to Vercel.")
        );
        return;
      }

      if (browserKeys.length > 0 && !opts.yes) {
        console.log(
          chalk.yellow(
            `Note: ${browserKeys.length} browser-encrypted key(s) will be skipped (not decryptable server-side).`
          )
        );
        console.log(
          chalk.gray("  Use --key <name> to specify CLI-encrypted keys individually, or use the web dashboard.")
        );
        console.log();
      }

      selectedKeys = cliKeys;
    }

    if (!selectedKeys.length) {
      console.log(chalk.red("No deployable keys selected."));
      return;
    }

    // ── Collect Vercel credentials ────────────────────────────────
    let vercelToken = opts.token ?? "";
    if (!vercelToken) {
      vercelToken = await prompt("Vercel personal access token (hidden): ", true);
    }
    if (!vercelToken) {
      console.log(chalk.red("Vercel token is required."));
      return;
    }

    let vercelProjectId = opts.project ?? "";
    if (!vercelProjectId) {
      vercelProjectId = await prompt("Vercel project ID or name: ");
    }
    if (!vercelProjectId) {
      console.log(chalk.red("Vercel project ID or name is required."));
      return;
    }

    let vercelTeamId = opts.team ?? "";
    if (!vercelTeamId && !opts.yes) {
      const teamInput = await prompt("Vercel team ID (optional, press Enter to skip): ");
      vercelTeamId = teamInput.trim();
    }

    const validTargets = ["production", "preview", "development"];
    let target = opts.target ?? "production";
    if (!validTargets.includes(target)) {
      console.log(chalk.red(`Invalid target "${target}". Must be one of: production, preview, development.`));
      return;
    }

    // ── Confirm ────────────────────────────────────────────────────
    if (!opts.yes) {
      console.log();
      console.log(chalk.bold("Summary"));
      console.log(chalk.gray("  Keys:    ") + chalk.white(selectedKeys.map((k) => k.name).join(", ")));
      console.log(chalk.gray("  Project: ") + chalk.white(vercelProjectId));
      console.log(chalk.gray("  Target:  ") + chalk.white(target));
      if (vercelTeamId) {
        console.log(chalk.gray("  Team:    ") + chalk.white(vercelTeamId));
      }
      console.log();
      const confirm = await prompt("Proceed? (y/N): ");
      if (confirm.toLowerCase() !== "y" && confirm.toLowerCase() !== "yes") {
        console.log(chalk.gray("Aborted."));
        return;
      }
    }

    // ── Call the API ───────────────────────────────────────────────
    console.log();
    process.stdout.write(chalk.gray("Deploying to Vercel..."));

    const payload = {
      vercelToken,
      vercelProjectId: vercelProjectId.trim(),
      vercelTeamId: vercelTeamId || undefined,
      target,
      keys: selectedKeys.map((k) => ({ id: k.id })),
    };

    const res = await api.post<PushResult>("/integrations/vercel/deploy", payload, { headers });
    const result = res.data;

    process.stdout.write(" " + chalk.green("done") + "\n\n");

    // ── Print results ──────────────────────────────────────────────
    if (result.pushed.length > 0) {
      console.log(chalk.green(`  Pushed (${result.pushed.length}):`));
      for (const name of result.pushed) {
        console.log(chalk.green("    + ") + name);
      }
    }

    if (result.skipped.length > 0) {
      console.log(chalk.gray(`  Skipped (${result.skipped.length}):`));
      for (const name of result.skipped) {
        console.log(chalk.gray("    ~ ") + name);
      }
    }

    if (result.failed.length > 0) {
      console.log(chalk.red(`  Failed (${result.failed.length}):`));
      for (const name of result.failed) {
        console.log(chalk.red("    x ") + name);
      }
    }

    console.log();
    if (result.failed.length === 0) {
      console.log(chalk.green("Deploy complete.") + chalk.gray(` ${result.pushed.length} key(s) pushed to Vercel [${target}].`));
    } else {
      console.log(
        chalk.yellow("Deploy finished with errors.") +
          chalk.gray(` ${result.pushed.length} pushed, ${result.failed.length} failed.`)
      );
    }
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    if (status === 401) {
      console.log(chalk.red("Session expired. Run: storemyapi login"));
    } else if (status === 400) {
      console.log(chalk.red("Bad request:"), data?.error || data || err.message);
    } else {
      console.error(chalk.red("Deploy failed:"), status, data?.error || data || err.message);
    }
  }
}
