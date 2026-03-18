"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pull = pull;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
const LOCAL_FILE = ".storemyapi.json";
function localPath() {
    return path_1.default.join(process.cwd(), LOCAL_FILE);
}
function getProjectId() {
    const p = localPath();
    if (!fs_1.default.existsSync(p))
        return null;
    try {
        return JSON.parse(fs_1.default.readFileSync(p, "utf-8"))?.projectId ?? null;
    }
    catch {
        return null;
    }
}
function readEnvFile(filePath) {
    if (!fs_1.default.existsSync(filePath))
        return {};
    const lines = fs_1.default.readFileSync(filePath, "utf-8").split("\n");
    const result = {};
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#"))
            continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1)
            continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        result[key] = value;
    }
    return result;
}
function writeEnvFile(filePath, data) {
    const lines = Object.entries(data).map(([k, v]) => `${k}=${v}`);
    fs_1.default.writeFileSync(filePath, lines.join("\n") + "\n");
}
function mergeIntoEnvFile(filePath, incoming) {
    const existing = readEnvFile(filePath);
    const merged = { ...existing, ...incoming };
    writeEnvFile(filePath, merged);
}
async function pull(keyName) {
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
        const envPath = path_1.default.join(process.cwd(), ".env");
        const headers = { Authorization: `Bearer ${auth.accessToken}` };
        if (keyName) {
            const res = await api_1.api.get(`/projects/${projectId}/keys/${encodeURIComponent(keyName)}`, { headers });
            const { key, value } = res.data;
            mergeIntoEnvFile(envPath, { [key]: value });
            console.log(chalk_1.default.green(`Pulled: ${key}`));
            return;
        }
        const res = await api_1.api.get(`/projects/${projectId}/keys`, { headers });
        const keys = res.data?.keys ?? [];
        if (!keys.length) {
            console.log(chalk_1.default.yellow("No keys found in this project."));
            return;
        }
        const incoming = {};
        for (const k of keys) {
            incoming[k.key] = k.value;
        }
        mergeIntoEnvFile(envPath, incoming);
        console.log(chalk_1.default.green(`Pulled ${keys.length} key(s) into .env`));
    }
    catch (err) {
        const status = err?.response?.status;
        const data = err?.response?.data;
        console.error(chalk_1.default.red("Pull failed:"), status, data || err.message);
    }
}
