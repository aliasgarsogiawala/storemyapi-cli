"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
const axios_1 = __importDefault(require("axios"));
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
const open_1 = __importDefault(require("open"));
async function login() {
    try {
        console.log("Starting CLI authentication...");
        const { data } = await api_1.api.post("/cli/start");
        const { deviceCode, verificationUrl } = data;
        console.log("Opening browser to authenticate...");
        await (0, open_1.default)(verificationUrl);
        console.log("Waiting for verification...");
        let authenticated = false;
        while (!authenticated) {
            await new Promise((res) => setTimeout(res, 3000));
            const statusRes = await api_1.api.get(`/cli/poll?code=${deviceCode}`);
            if (statusRes.data.verified) {
                // userId comes back from the status poll, now exchange it for tokens
                console.log("Verified user:", statusRes.data.userId);
                const tokenRes = await axios_1.default.post("https://storemyapi.dev/api/cli/token", {
                    userId: statusRes.data.userId,
                });
                console.log("Token received:", tokenRes.data);
                // the token endpoint should respond with the same shape we were
                // previously getting in the status response
                const { token } = tokenRes.data;
                (0, config_1.saveConfig)({
                    accessToken: token,
                    userId: statusRes.data.userId,
                });
                // Display centered success message
                console.log("\n");
                console.log("╔════════════════════════════════════════╗");
                console.log("║   ✅ CLI Authentication                ║");
                console.log("║   CLI authenticated successfully.      ║");
                console.log("║   You can now close this window.       ║");
                console.log("╚════════════════════════════════════════╝");
                console.log("\n");
                authenticated = true;
            }
        }
    }
    catch (err) {
        console.error("Login failed:", err.message);
    }
}
