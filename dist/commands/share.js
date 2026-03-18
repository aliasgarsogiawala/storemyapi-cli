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
exports.shareAdd = shareAdd;
exports.shareRemove = shareRemove;
exports.shareInvites = shareInvites;
exports.shareAccept = shareAccept;
exports.shareDecline = shareDecline;
exports.shareList = shareList;
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
const VALID_PERMISSIONS = ["read", "write"];
async function shareAdd(email, permission) {
    if (!VALID_PERMISSIONS.includes(permission)) {
        console.log(chalk_1.default.red(`Invalid permission "${permission}". Use: read or write`));
        return;
    }
    try {
        const auth = guardAuth();
        if (!auth)
            return;
        const projectId = guardProject();
        if (!projectId)
            return;
        const headers = { Authorization: `Bearer ${auth.accessToken}` };
        await api_1.api.post(`/projects/${projectId}/share`, { email, permission }, { headers });
        console.log(chalk_1.default.green(`Shared with ${email} as ${permission}`));
    }
    catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
            console.log(chalk_1.default.red(`No user found with email "${email}".`));
            return;
        }
        if (status === 403) {
            console.log(chalk_1.default.red("Only the project owner can share it."));
            return;
        }
        console.error(chalk_1.default.red("share add failed:"), err?.response?.data || err.message);
    }
}
async function shareRemove(email) {
    try {
        const auth = guardAuth();
        if (!auth)
            return;
        const projectId = guardProject();
        if (!projectId)
            return;
        const headers = { Authorization: `Bearer ${auth.accessToken}` };
        await api_1.api.delete(`/projects/${projectId}/share`, { headers, data: { email } });
        console.log(chalk_1.default.green(`Removed ${email} from project`));
    }
    catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
            console.log(chalk_1.default.red(`"${email}" does not have access to this project.`));
            return;
        }
        if (status === 403) {
            console.log(chalk_1.default.red("Only the project owner can manage access."));
            return;
        }
        console.error(chalk_1.default.red("share remove failed:"), err?.response?.data || err.message);
    }
}
async function shareInvites() {
    try {
        const auth = guardAuth();
        if (!auth)
            return;
        const headers = { Authorization: `Bearer ${auth.accessToken}` };
        const res = await api_1.api.get("/invites", { headers });
        const invites = res.data?.invites ?? [];
        if (!invites.length) {
            console.log(chalk_1.default.yellow("No pending invites."));
            return;
        }
        const inquirer = (await Promise.resolve().then(() => __importStar(require("inquirer")))).default;
        const { selectedId } = await inquirer.prompt([
            {
                type: "select",
                name: "selectedId",
                message: "Select an invite:",
                choices: invites.map((inv) => ({
                    name: `${inv.projectName}  •  from ${inv.ownerEmail}  •  ${inv.permission}`,
                    value: inv.id,
                })),
            },
        ]);
        const { action } = await inquirer.prompt([
            {
                type: "select",
                name: "action",
                message: "What do you want to do?",
                choices: [
                    { name: "Accept", value: "accept" },
                    { name: "Decline", value: "decline" },
                ],
            },
        ]);
        if (action === "accept") {
            await api_1.api.post(`/invites/${selectedId}/accept`, {}, { headers });
            console.log(chalk_1.default.green("Invite accepted. Run: storemyapi link  to link this project locally."));
        }
        else {
            await api_1.api.post(`/invites/${selectedId}/decline`, {}, { headers });
            console.log(chalk_1.default.green("Invite declined."));
        }
    }
    catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
            console.log(chalk_1.default.red("Invite not found or already resolved."));
            return;
        }
        console.error(chalk_1.default.red("share invites failed:"), err?.response?.data || err.message);
    }
}
async function shareAccept(inviteId) {
    try {
        const auth = guardAuth();
        if (!auth)
            return;
        const headers = { Authorization: `Bearer ${auth.accessToken}` };
        await api_1.api.post(`/invites/${inviteId}/accept`, {}, { headers });
        console.log(chalk_1.default.green("Invite accepted. Run: storemyapi link  to link this project locally."));
    }
    catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
            console.log(chalk_1.default.red("Invite not found or already resolved."));
            return;
        }
        console.error(chalk_1.default.red("share accept failed:"), err?.response?.data || err.message);
    }
}
async function shareDecline(inviteId) {
    try {
        const auth = guardAuth();
        if (!auth)
            return;
        const headers = { Authorization: `Bearer ${auth.accessToken}` };
        await api_1.api.post(`/invites/${inviteId}/decline`, {}, { headers });
        console.log(chalk_1.default.green("Invite declined."));
    }
    catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
            console.log(chalk_1.default.red("Invite not found or already resolved."));
            return;
        }
        console.error(chalk_1.default.red("share decline failed:"), err?.response?.data || err.message);
    }
}
async function shareList() {
    try {
        const auth = guardAuth();
        if (!auth)
            return;
        const projectId = guardProject();
        if (!projectId)
            return;
        const headers = { Authorization: `Bearer ${auth.accessToken}` };
        const res = await api_1.api.get(`/projects/${projectId}/share`, { headers });
        const members = res.data?.members ?? [];
        if (!members.length) {
            console.log(chalk_1.default.yellow("No collaborators on this project."));
            return;
        }
        console.log("");
        for (const m of members) {
            const perm = m.permission === "write" ? chalk_1.default.blue("write") : chalk_1.default.gray("read");
            console.log(`${m.email} ${chalk_1.default.gray("•")} ${perm}`);
        }
        console.log("");
        console.log(chalk_1.default.gray(`${members.length} collaborator(s)`));
    }
    catch (err) {
        const status = err?.response?.status;
        if (status === 403) {
            console.log(chalk_1.default.red("Only the project owner can view collaborators."));
            return;
        }
        console.error(chalk_1.default.red("share list failed:"), err?.response?.data || err.message);
    }
}
