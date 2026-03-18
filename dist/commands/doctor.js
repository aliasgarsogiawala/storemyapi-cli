"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.doctor = doctor;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
const LOCAL_FILE = ".storemyapi.json";
function pass(msg) {
    console.log(chalk_1.default.green("  ok  ") + msg);
}
function fail(msg, hint) {
    console.log(chalk_1.default.red(" fail ") + msg);
    if (hint)
        console.log(chalk_1.default.gray(`       ${hint}`));
}
function warn(msg, hint) {
    console.log(chalk_1.default.yellow(" warn ") + msg);
    if (hint)
        console.log(chalk_1.default.gray(`       ${hint}`));
}
async function doctor() {
    console.log("\nRunning diagnostics...\n");
    const [major] = process.versions.node.split(".").map(Number);
    if (major >= 18) {
        pass(`Node.js ${process.versions.node}`);
    }
    else {
        fail(`Node.js ${process.versions.node}`, "Version 18 or higher is required.");
    }
    const auth = (0, config_1.getConfig)();
    if (!auth?.accessToken) {
        fail("Not authenticated.", "Run: storemyapi login");
    }
    else {
        try {
            await api_1.api.get("/cli/me", {
                headers: { Authorization: `Bearer ${auth.accessToken}` },
            });
            pass("Authenticated, session valid, and API reachable");
        }
        catch (err) {
            const status = err?.response?.status;
            if (status === 401) {
                fail("Session expired.", "Run: storemyapi login");
            }
            else {
                fail("Could not reach API.", "Check your internet connection.");
            }
        }
    }
    const localFilePath = path_1.default.join(process.cwd(), LOCAL_FILE);
    if (!fs_1.default.existsSync(localFilePath)) {
        warn("No linked project in this folder.", "Run: storemyapi init  or  storemyapi link");
    }
    else {
        try {
            const local = JSON.parse(fs_1.default.readFileSync(localFilePath, "utf-8"));
            if (local?.projectId && local?.projectName) {
                pass(`Linked to project: ${local.projectName}`);
            }
            else {
                fail(`${LOCAL_FILE} is malformed.`, "Run: storemyapi link to relink.");
            }
        }
        catch {
            fail(`${LOCAL_FILE} could not be parsed.`, "Run: storemyapi link to relink.");
        }
    }
    const envPath = path_1.default.join(process.cwd(), ".env");
    if (fs_1.default.existsSync(envPath)) {
        pass(".env file present");
    }
    else {
        warn("No .env file in this directory.", "Run: storemyapi pull to create one.");
    }
    console.log("");
}
