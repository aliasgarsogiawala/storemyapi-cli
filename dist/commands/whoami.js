"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whoami = whoami;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../utils/config");
async function whoami() {
    try {
        const config = (0, config_1.getConfig)();
        if (!config?.accessToken) {
            console.log("❌ You are not logged in.");
            console.log("Run: storemyapi login");
            return;
        }
        const res = await axios_1.default.get("https://storemyapi.dev/api/cli/me", {
            headers: {
                Authorization: `Bearer ${config.accessToken}`,
            },
        });
        console.log("👤 Logged in as:");
        console.log("User ID:", res.data.userId);
    }
    catch (err) {
        console.log("❌ Session invalid or expired.");
        console.log("Run: storemyapi login");
    }
}
