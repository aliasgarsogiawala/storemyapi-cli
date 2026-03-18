"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projects = projects;
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
const chalk_1 = __importDefault(require("chalk"));
async function projects() {
    try {
        const auth = (0, config_1.getConfig)();
        if (!auth?.accessToken) {
            console.log(chalk_1.default.red(" You are not logged in."));
            console.log(chalk_1.default.yellow("Run: storemyapi login"));
            return;
        }
        const res = await api_1.api.get("/projects", {
            headers: {
                Authorization: `Bearer ${auth.accessToken}`,
            },
        });
        const list = res.data?.projects || [];
        if (!list.length) {
            console.log(chalk_1.default.yellow("No projects found."));
            console.log(chalk_1.default.gray("Create one on the dashboard or run: storemyapi init"));
            return;
        }
        console.log("\n" + chalk_1.default.bold.cyan("Your Projects\n"));
        for (const p of list) {
            const ownerLabel = p.isOwner
                ? chalk_1.default.green("owner")
                : chalk_1.default.blue(`shared (${p.permission})`);
            const ownerInfo = p.isOwner
                ? ""
                : chalk_1.default.gray(` • owner: ${p.ownerEmail || p.ownerName || "unknown"}`);
            console.log(`${chalk_1.default.bold(p.name)} ${chalk_1.default.gray("•")} ${ownerLabel}`);
            console.log(`${chalk_1.default.gray("keys:")} ${p.keyCount} ${ownerInfo}`);
            console.log(`${chalk_1.default.gray("id:")} ${chalk_1.default.dim(p.id)}\n`);
        }
    }
    catch (err) {
        const status = err?.response?.status;
        const url = err?.config?.url;
        const data = err?.response?.data;
        console.error(chalk_1.default.red("Projects failed:"), status, url, data || err.message);
    }
}
