"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = logout;
const config_1 = require("../utils/config");
const jwt_decode_1 = require("jwt-decode");
function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0)
        return `${h}h ${m}m`;
    if (m > 0)
        return `${m}m ${s}s`;
    return `${s}s`;
}
function logout() {
    const cfg = (0, config_1.getConfig)();
    if (!cfg?.accessToken) {
        console.log("You are not logged in.");
        return;
    }
    try {
        const decoded = (0, jwt_decode_1.jwtDecode)(cfg.accessToken);
        let duration = "";
        if (decoded?.iat) {
            const now = Math.floor(Date.now() / 1000);
            const sessionSeconds = now - decoded.iat;
            duration = formatDuration(sessionSeconds);
        }
        (0, config_1.clearConfig)();
        console.log("✅ Logged out successfully.");
        if (duration) {
            console.log(`Session duration: ${duration}`);
        }
    }
    catch {
        (0, config_1.clearConfig)();
        console.log("✅ Logged out successfully.");
    }
}
