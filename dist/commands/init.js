"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = init;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
const LOCAL_FILE = ".storemyapi.json";
function localPath() {
    return path_1.default.join(process.cwd(), LOCAL_FILE);
}
async function init() {
    try {
        const auth = (0, config_1.getConfig)();
        if (!auth?.accessToken) {
            console.log(chalk_1.default.red("Not authenticated."));
            console.log("Run: storemyapi login");
            return;
        }
        if (fs_1.default.existsSync(localPath())) {
            console.log(chalk_1.default.yellow(`${LOCAL_FILE} already exists in this folder.`));
            console.log("This project is already initialized.");
            return;
        }
        const defaultName = path_1.default.basename(process.cwd());
        const { name, description } = await inquirer_1.default.prompt([
            {
                type: "input",
                name: "name",
                message: "Project name:",
                default: defaultName,
                validate: (v) => (String(v).trim() ? true : "Project name cannot be empty"),
            },
            {
                type: "input",
                name: "description",
                message: "Description (optional):",
            },
        ]);
        console.log("Creating project...");
        const res = await api_1.api.post("/projects", { name, description }, { headers: { Authorization: `Bearer ${auth.accessToken}` } });
        const project = res.data.project;
        fs_1.default.writeFileSync(localPath(), JSON.stringify({
            projectId: project.id,
            projectName: project.name,
            createdAt: new Date().toISOString(),
        }, null, 2));
        console.log(chalk_1.default.green("\nInitialized!"));
        console.log(`Project: ${project.name}`);
        console.log(`Linked locally via ${LOCAL_FILE}`);
    }
    catch (err) {
        const status = err?.response?.status;
        const data = err?.response?.data;
        console.error(chalk_1.default.red("Init failed:"), status, data || err.message);
    }
}
