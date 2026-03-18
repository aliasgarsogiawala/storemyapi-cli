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
exports.keyGet = keyGet;
exports.keySet = keySet;
exports.keyDelete = keyDelete;
exports.keyList = keyList;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
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
function guardAuth() {
    const auth = (0, config_1.getConfig)();
    if (!auth?.accessToken) {
        console.log(chalk_1.default.red("Not authenticated."));
        console.log("Run: storemyapi login");
        return null;
    }
    return auth;
}
function guardProject() {
    const projectId = getProjectId();
    if (!projectId) {
        console.log(chalk_1.default.red("No linked project found."));
        console.log("Run: storemyapi init  or  storemyapi link");
        return null;
    }
    return projectId;
}
async function keyGet(keyName) {
    try {
        const auth = guardAuth();
        if (!auth)
            return;
        const projectId = guardProject();
        if (!projectId)
            return;
        const headers = { Authorization: `Bearer ${auth.accessToken}` };
        const res = await api_1.api.get(`/projects/${projectId}/keys/${encodeURIComponent(keyName)}`, { headers });
        const { key, value } = res.data;
        console.log(`${chalk_1.default.bold(key)}=${value}`);
    }
    catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
            console.log(chalk_1.default.red(`Key "${keyName}" not found.`));
            return;
        }
        console.error(chalk_1.default.red("key get failed:"), err?.response?.data || err.message);
    }
}
async function keySet(keyName, value) {
    try {
        const auth = guardAuth();
        if (!auth)
            return;
        const projectId = guardProject();
        if (!projectId)
            return;
        const headers = { Authorization: `Bearer ${auth.accessToken}` };
        let exists = false;
        try {
            await api_1.api.get(`/projects/${projectId}/keys/${encodeURIComponent(keyName)}`, { headers });
            exists = true;
        }
        catch (err) {
            if (err?.response?.status !== 404)
                throw err;
        }
        if (exists) {
            const { confirm } = await (await Promise.resolve().then(() => __importStar(require("inquirer")))).default.prompt([
                {
                    type: "confirm",
                    name: "confirm",
                    message: `"${keyName}" already exists. Overwrite?`,
                    default: false,
                },
            ]);
            if (!confirm) {
                console.log(chalk_1.default.yellow("Aborted."));
                return;
            }
        }
        await api_1.api.post(`/projects/${projectId}/keys`, { key: keyName, value }, { headers });
        console.log(chalk_1.default.green(`Set: ${keyName}`));
    }
    catch (err) {
        console.error(chalk_1.default.red("key set failed:"), err?.response?.data || err.message);
    }
}
async function keyDelete(keyName) {
    try {
        const auth = guardAuth();
        if (!auth)
            return;
        const projectId = guardProject();
        if (!projectId)
            return;
        const headers = { Authorization: `Bearer ${auth.accessToken}` };
        await api_1.api.delete(`/projects/${projectId}/keys/${encodeURIComponent(keyName)}`, { headers });
        console.log(chalk_1.default.green(`Deleted: ${keyName}`));
    }
    catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
            console.log(chalk_1.default.red(`Key "${keyName}" not found.`));
            return;
        }
        console.error(chalk_1.default.red("key delete failed:"), err?.response?.data || err.message);
    }
}
async function keyList() {
    try {
        const auth = guardAuth();
        if (!auth)
            return;
        const projectId = guardProject();
        if (!projectId)
            return;
        const headers = { Authorization: `Bearer ${auth.accessToken}` };
        const res = await api_1.api.get(`/projects/${projectId}/keys`, { headers });
        const keys = res.data?.keys ?? [];
        if (!keys.length) {
            console.log(chalk_1.default.yellow("No keys in this project."));
            return;
        }
        console.log("");
        for (const k of keys) {
            console.log(`${chalk_1.default.bold(k.key)}=${k.value}`);
        }
        console.log("");
        console.log(chalk_1.default.gray(`${keys.length} key(s)`));
    }
    catch (err) {
        console.error(chalk_1.default.red("key list failed:"), err?.response?.data || err.message);
    }
}
