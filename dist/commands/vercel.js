"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vercelDeploy = vercelDeploy;
const chalk_1 = __importDefault(require("chalk"));
const readline = __importStar(require("readline"));
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
// ─── Helpers ──────────────────────────────────────────────────────────────────
function prompt(question, silent = false) {
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
            process.stdin.on("data", function handler(ch) {
                if (ch === "\n" || ch === "\r" || ch === "\u0003") {
                    process.stdin.setRawMode(false);
                    process.stdin.removeListener("data", handler);
                    process.stdout.write("\n");
                    rl.close();
                    resolve(value);
                }
                else if (ch === "\u007f" || ch === "\b") {
                    if (value.length > 0) {
                        value = value.slice(0, -1);
                    }
                }
                else {
                    value += ch;
                }
            });
        }
        else {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer.trim());
            });
        }
    });
}
function printBetaBanner() {
    console.log(chalk_1.default.yellow("  [BETA] ") +
        chalk_1.default.gray("This feature may have bugs. Please report issues at https://github.com/anomalyco/opencode"));
    console.log();
}
// ─── Command ──────────────────────────────────────────────────────────────────
async function vercelDeploy(opts) {
    try {
        // Auth check
        const auth = (0, config_1.getConfig)();
        if (!auth?.accessToken) {
            console.log(chalk_1.default.red("Not authenticated."));
            console.log("Run: storemyapi login");
            return;
        }
        const headers = { Authorization: `Bearer ${auth.accessToken}` };
        // ── Print beta notice ──────────────────────────────────────────
        console.log();
        console.log(chalk_1.default.bold("Deploy to Vercel") + chalk_1.default.yellow("  [BETA]"));
        printBetaBanner();
        // ── Fetch available keys ───────────────────────────────────────
        process.stdout.write(chalk_1.default.gray("Fetching your keys..."));
        const keysRes = await api_1.api.get("/keys", { headers });
        const allKeys = keysRes.data?.keys ?? keysRes.data ?? [];
        process.stdout.write(" " + chalk_1.default.green("done") + "\n");
        if (!allKeys.length) {
            console.log(chalk_1.default.yellow("No keys found in your account."));
            return;
        }
        // ── Determine which keys to deploy ────────────────────────────
        let selectedKeys;
        if (opts.keys && opts.keys.length > 0) {
            // Filter by names provided via --key flags
            const nameSet = new Set(opts.keys.map((k) => k.toUpperCase()));
            selectedKeys = allKeys.filter((k) => nameSet.has(k.name.toUpperCase()));
            const notFound = opts.keys.filter((k) => !allKeys.find((a) => a.name.toUpperCase() === k.toUpperCase()));
            if (notFound.length) {
                console.log(chalk_1.default.yellow(`Warning: keys not found: ${notFound.join(", ")}`));
            }
            if (!selectedKeys.length) {
                console.log(chalk_1.default.red("None of the specified keys were found."));
                return;
            }
        }
        else {
            // Deploy all CLI-encrypted keys (browser-encrypted keys can't be decrypted server-side)
            const cliKeys = allKeys.filter((k) => k.isCli);
            const browserKeys = allKeys.filter((k) => !k.isCli);
            if (!cliKeys.length && browserKeys.length > 0) {
                console.log(chalk_1.default.yellow("All your keys are browser-encrypted and cannot be deployed from the CLI."));
                console.log(chalk_1.default.gray("Use the web dashboard to deploy browser-encrypted keys to Vercel."));
                return;
            }
            if (browserKeys.length > 0 && !opts.yes) {
                console.log(chalk_1.default.yellow(`Note: ${browserKeys.length} browser-encrypted key(s) will be skipped (not decryptable server-side).`));
                console.log(chalk_1.default.gray("  Use --key <name> to specify CLI-encrypted keys individually, or use the web dashboard."));
                console.log();
            }
            selectedKeys = cliKeys;
        }
        if (!selectedKeys.length) {
            console.log(chalk_1.default.red("No deployable keys selected."));
            return;
        }
        // ── Collect Vercel credentials ────────────────────────────────
        let vercelToken = opts.token ?? "";
        if (!vercelToken) {
            vercelToken = await prompt("Vercel personal access token (hidden): ", true);
        }
        if (!vercelToken) {
            console.log(chalk_1.default.red("Vercel token is required."));
            return;
        }
        let vercelProjectId = opts.project ?? "";
        if (!vercelProjectId) {
            vercelProjectId = await prompt("Vercel project ID or name: ");
        }
        if (!vercelProjectId) {
            console.log(chalk_1.default.red("Vercel project ID or name is required."));
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
            console.log(chalk_1.default.red(`Invalid target "${target}". Must be one of: production, preview, development.`));
            return;
        }
        // ── Confirm ────────────────────────────────────────────────────
        if (!opts.yes) {
            console.log();
            console.log(chalk_1.default.bold("Summary"));
            console.log(chalk_1.default.gray("  Keys:    ") + chalk_1.default.white(selectedKeys.map((k) => k.name).join(", ")));
            console.log(chalk_1.default.gray("  Project: ") + chalk_1.default.white(vercelProjectId));
            console.log(chalk_1.default.gray("  Target:  ") + chalk_1.default.white(target));
            if (vercelTeamId) {
                console.log(chalk_1.default.gray("  Team:    ") + chalk_1.default.white(vercelTeamId));
            }
            console.log();
            const confirm = await prompt("Proceed? (y/N): ");
            if (confirm.toLowerCase() !== "y" && confirm.toLowerCase() !== "yes") {
                console.log(chalk_1.default.gray("Aborted."));
                return;
            }
        }
        // ── Call the API ───────────────────────────────────────────────
        console.log();
        process.stdout.write(chalk_1.default.gray("Deploying to Vercel..."));
        const payload = {
            vercelToken,
            vercelProjectId: vercelProjectId.trim(),
            vercelTeamId: vercelTeamId || undefined,
            target,
            keys: selectedKeys.map((k) => ({ id: k.id })),
        };
        const res = await api_1.api.post("/integrations/vercel/deploy", payload, { headers });
        const result = res.data;
        process.stdout.write(" " + chalk_1.default.green("done") + "\n\n");
        // ── Print results ──────────────────────────────────────────────
        if (result.pushed.length > 0) {
            console.log(chalk_1.default.green(`  Pushed (${result.pushed.length}):`));
            for (const name of result.pushed) {
                console.log(chalk_1.default.green("    + ") + name);
            }
        }
        if (result.skipped.length > 0) {
            console.log(chalk_1.default.gray(`  Skipped (${result.skipped.length}):`));
            for (const name of result.skipped) {
                console.log(chalk_1.default.gray("    ~ ") + name);
            }
        }
        if (result.failed.length > 0) {
            console.log(chalk_1.default.red(`  Failed (${result.failed.length}):`));
            for (const name of result.failed) {
                console.log(chalk_1.default.red("    x ") + name);
            }
        }
        console.log();
        if (result.failed.length === 0) {
            console.log(chalk_1.default.green("Deploy complete.") + chalk_1.default.gray(` ${result.pushed.length} key(s) pushed to Vercel [${target}].`));
        }
        else {
            console.log(chalk_1.default.yellow("Deploy finished with errors.") +
                chalk_1.default.gray(` ${result.pushed.length} pushed, ${result.failed.length} failed.`));
        }
    }
    catch (err) {
        const status = err?.response?.status;
        const data = err?.response?.data;
        if (status === 401) {
            console.log(chalk_1.default.red("Session expired. Run: storemyapi login"));
        }
        else if (status === 400) {
            console.log(chalk_1.default.red("Bad request:"), data?.error || data || err.message);
        }
        else {
            console.error(chalk_1.default.red("Deploy failed:"), status, data?.error || data || err.message);
        }
    }
}
