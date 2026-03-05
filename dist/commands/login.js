"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
const open_1 = __importDefault(require("open"));
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
async function login(opts = {}) {
    try {
        console.log("Starting CLI authentication...");
        const { data } = await api_1.api.post("/cli/start");
        const { deviceCode, userCode, verificationUrl, verificationUrlNoBrowser, } = data;
        if (opts.browser === false) {
            console.log(`
🔐 Authentication required

1. Open this URL:
   ${verificationUrlNoBrowser}

2. Enter this code:
   ${userCode}

Waiting for confirmation...
`);
        }
        else {
            console.log("Opening browser to authenticate...");
            await (0, open_1.default)(verificationUrl);
            console.log("Waiting for verification...");
        }
        while (true) {
            await new Promise((res) => setTimeout(res, 3000));
            const pollRes = await api_1.api.get(`/cli/poll?code=${deviceCode}`);
            if (pollRes.data?.expired) {
                console.log("❌ Code expired. Run: storemyapi login");
                return;
            }
            if (pollRes.data?.verified) {
                const userId = pollRes.data.userId;
                const tokenRes = await api_1.api.post("/cli/token", { userId });
                const { token } = tokenRes.data;
                (0, config_1.saveConfig)({
                    accessToken: token,
                    userId,
                });
                console.log("\n✅ Logged in successfully!");
                return;
            }
        }
    }
    catch (err) {
        const status = err?.response?.status;
        const url = err?.config?.url;
        const data = err?.response?.data;
        console.error("Login failed:", status, url, data || err.message);
    }
}
