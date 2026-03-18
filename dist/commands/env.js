"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.envRun = envRun;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
const LOCAL_FILE = ".storemyapi.json";
function getProjectId() {
    const p = path_1.default.join(process.cwd(), LOCAL_FILE);
    if (!fs_1.default.existsSync(p))
        return null;
    try {
        return JSON.parse(fs_1.default.readFileSync(p, "utf-8"))?.projectId ?? null;
    }
    catch {
        return null;
    }
}
async function envRun(args) {
    try {
        const auth = (0, config_1.getConfig)();
        if (!auth?.accessToken) {
            console.log(chalk_1.default.red("Not authenticated."));
            console.log("Run: storemyapi login");
            return;
        }
        const projectId = getProjectId();
        if (!projectId) {
            console.log(chalk_1.default.red("No linked project found."));
            console.log("Run: storemyapi init  or  storemyapi link");
            return;
        }
        if (!args.length) {
            console.log(chalk_1.default.red("No command provided."));
            console.log("Usage: storemyapi env run -- <command> [args...]");
            return;
        }
        const headers = { Authorization: `Bearer ${auth.accessToken}` };
        const res = await api_1.api.get(`/projects/${projectId}/keys`, { headers });
        const keys = res.data?.keys ?? [];
        const injected = {};
        for (const k of keys) {
            injected[k.key] = k.value;
        }
        const env = { ...process.env, ...injected };
        const [cmd, ...cmdArgs] = args;
        const child = (0, child_process_1.spawn)(cmd, cmdArgs, {
            env,
            stdio: "inherit",
            shell: false,
        });
        child.on("error", (err) => {
            console.error(chalk_1.default.red(`Failed to run command: ${err.message}`));
            process.exit(1);
        });
        child.on("close", (code) => {
            process.exit(code ?? 0);
        });
    }
    catch (err) {
        const status = err?.response?.status;
        const data = err?.response?.data;
        console.error(chalk_1.default.red("env run failed:"), status, data || err.message);
    }
}
