"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.link = link;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const readline_1 = require("readline");
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
const LOCAL_FILE = ".storemyapi.json";
function localPath() {
    return path_1.default.join(process.cwd(), LOCAL_FILE);
}
function normalize(s) {
    return String(s ?? "").trim().toLowerCase();
}
function looksLikeId(input) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
}
function writeLocal(project) {
    fs_1.default.writeFileSync(localPath(), JSON.stringify({
        projectId: project.id,
        projectName: project.name,
        linkedAt: new Date().toISOString(),
    }, null, 2));
    console.log(chalk_1.default.green("Project linked successfully."));
    console.log(`Project: ${project.name}`);
    console.log(`Configuration written to ${LOCAL_FILE}`);
}
async function askNumber(promptText) {
    const rl = (0, readline_1.createInterface)({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((resolve) => rl.question(promptText, (ans) => resolve(ans)));
    rl.close();
    return answer;
}
async function manualSelect(projects) {
    console.log("Select a project:");
    projects.forEach((p, i) => {
        const keys = typeof p.keyCount === "number" ? p.keyCount : Number(p.keyCount) || 0;
        console.log(`  ${i + 1}) ${p.name} (keys: ${keys})`);
    });
    while (true) {
        const ans = (await askNumber("Enter a number: ")).trim();
        const idx = Number(ans);
        if (Number.isInteger(idx) && idx >= 1 && idx <= projects.length) {
            return projects[idx - 1];
        }
        console.log("Invalid selection. Try again.");
    }
}
function readLocal() {
    const p = localPath();
    if (!fs_1.default.existsSync(p))
        return null;
    try {
        return JSON.parse(fs_1.default.readFileSync(p, "utf-8"));
    }
    catch {
        return null;
    }
}
async function link(nameOrId) {
    try {
        const auth = (0, config_1.getConfig)();
        if (!auth?.accessToken) {
            console.log(chalk_1.default.red("Not authenticated."));
            console.log("Run 'storemyapi login' first.");
            return;
        }
        const existing = readLocal();
        if (existing) {
            console.log(`Currently linked to: ${chalk_1.default.bold(existing.projectName)}`);
            const { proceed } = await inquirer_1.default.prompt([
                {
                    type: "confirm",
                    name: "proceed",
                    message: "Switch to a different project?",
                    default: false,
                },
            ]);
            if (!proceed) {
                console.log(chalk_1.default.yellow("Aborted."));
                return;
            }
        }
        const res = await api_1.api.get("/projects", {
            headers: { Authorization: `Bearer ${auth.accessToken}` },
        });
        const projects = Array.isArray(res?.data?.projects) ? res.data.projects : [];
        if (!projects.length) {
            console.log("No projects found for this account.");
            return;
        }
        if (typeof nameOrId === "string" && nameOrId.trim()) {
            const query = nameOrId.trim();
            const selected = looksLikeId(query)
                ? projects.find((p) => p.id === query)
                : projects.find((p) => normalize(p.name) === normalize(query));
            if (!selected) {
                console.log(`No project found matching "${query}".`);
                return;
            }
            writeLocal(selected);
            return;
        }
        let selectedProject = null;
        const canUseInquirer = Boolean(process.stdout.isTTY && process.stdin.isTTY);
        if (canUseInquirer) {
            try {
                const answer = await inquirer_1.default.prompt([
                    {
                        type: "select",
                        name: "projectId",
                        message: "Select a project:",
                        choices: projects.map((p) => ({
                            name: `${p.name} (keys: ${Number(p.keyCount) || 0})`,
                            value: p.id,
                        })),
                        pageSize: 12,
                    },
                ]);
                selectedProject = projects.find((p) => p.id === answer.projectId) ?? null;
            }
            catch {
                selectedProject = null;
            }
        }
        if (!selectedProject) {
            selectedProject = await manualSelect(projects);
        }
        if (!selectedProject) {
            console.log("Invalid project selection.");
            return;
        }
        writeLocal(selectedProject);
    }
    catch (err) {
        console.error("Link command failed:", err?.response?.data || err.message);
    }
}
