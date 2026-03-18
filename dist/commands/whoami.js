"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whoami = whoami;
const chalk_1 = __importDefault(require("chalk"));
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
async function whoami() {
    try {
        const config = (0, config_1.getConfig)();
        if (!config?.accessToken) {
            console.log(chalk_1.default.red("Not authenticated."));
            console.log("Run: storemyapi login");
            return;
        }
        const res = await api_1.api.get("/cli/me", {
            headers: { Authorization: `Bearer ${config.accessToken}` },
        });
        console.log(`Logged in as: ${chalk_1.default.bold(res.data.email)}`);
    }
    catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
            console.log(chalk_1.default.red("Session expired."));
        }
        else {
            console.log(chalk_1.default.red("Could not reach API."));
        }
        console.log("Run: storemyapi login");
    }
}
