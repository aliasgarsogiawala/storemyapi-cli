"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.audit = audit;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
const LOCAL_FILE = ".storemyapi.json";
const ENV_CANDIDATES = [".env.local", ".env"];
function getProjectLocal() {
    const p = path_1.default.join(process.cwd(), LOCAL_FILE);
    if (!fs_1.default.existsSync(p))
        return null;
    try {
        return JSON.parse(fs_1.default.readFileSync(p, "utf-8"));
    }
    catch {
        return null;
    }
}
function resolveEnvFile(file) {
    if (file) {
        const p = path_1.default.resolve(process.cwd(), file);
        return fs_1.default.existsSync(p) ? p : null;
    }
    for (const candidate of ENV_CANDIDATES) {
        const p = path_1.default.join(process.cwd(), candidate);
        if (fs_1.default.existsSync(p))
            return p;
    }
    return null;
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
async function audit(opts = {}) {
    try {
        const auth = (0, config_1.getConfig)();
        if (!auth?.accessToken) {
            console.log(chalk_1.default.red("Not authenticated."));
            console.log("Run: storemyapi login");
            return;
        }
        const local = getProjectLocal();
        if (!local?.projectId) {
            console.log(chalk_1.default.red("No linked project found."));
            console.log("Run: storemyapi init  or  storemyapi link");
            return;
        }
        const envPath = resolveEnvFile(opts.file);
        if (!envPath) {
            if (opts.file) {
                console.log(chalk_1.default.red(`File not found: ${opts.file}`));
            }
            else {
                console.log(chalk_1.default.red("No .env or .env.local file found in this directory."));
                console.log("Run: storemyapi pull  to fetch keys from the cloud.");
            }
            return;
        }
        const envFile = path_1.default.basename(envPath);
        const headers = { Authorization: `Bearer ${auth.accessToken}` };
        const res = await api_1.api.get(`/projects/${local.projectId}/keys`, { headers });
        const cloudKeys = res.data?.keys ?? [];
        const cloudMap = {};
        for (const k of cloudKeys)
            cloudMap[k.key] = k.value;
        const localMap = readEnvFile(envPath);
        const onlyInCloud = cloudKeys.filter((k) => !(k.key in localMap));
        const onlyInLocal = Object.keys(localMap).filter((k) => !(k in cloudMap));
        const outOfSync = cloudKeys.filter((k) => k.key in localMap && localMap[k.key] !== k.value);
        const allClean = !onlyInCloud.length && !onlyInLocal.length && !outOfSync.length;
        console.log(`\nAudit: ${chalk_1.default.bold(local.projectName)} ${chalk_1.default.gray(`(${envFile})`)}\n`);
        if (allClean) {
            console.log(chalk_1.default.green("Everything is in sync."));
            console.log("");
            return;
        }
        if (onlyInCloud.length) {
            console.log(chalk_1.default.yellow(`In cloud, missing from ${envFile} (${onlyInCloud.length}):`));
            for (const k of onlyInCloud) {
                console.log(`  ${chalk_1.default.bold(k.key)}`);
            }
            console.log(chalk_1.default.gray("  Run: storemyapi pull  to bring these down."));
            console.log("");
        }
        if (onlyInLocal.length) {
            console.log(chalk_1.default.yellow(`In ${envFile}, not in cloud (${onlyInLocal.length}):`));
            for (const k of onlyInLocal) {
                console.log(`  ${chalk_1.default.bold(k)}`);
            }
            console.log(chalk_1.default.gray("  Run: storemyapi push  to push these up."));
            console.log("");
        }
        if (outOfSync.length) {
            console.log(chalk_1.default.yellow(`Values differ between ${envFile} and cloud (${outOfSync.length}):`));
            for (const k of outOfSync) {
                console.log(`  ${chalk_1.default.bold(k.key)}`);
            }
            console.log(chalk_1.default.gray("  Run: storemyapi pull  or  storemyapi push  to resolve."));
            console.log("");
        }
    }
    catch (err) {
        const status = err?.response?.status;
        const data = err?.response?.data;
        console.error(chalk_1.default.red("Audit failed:"), status, data || err.message);
    }
}
