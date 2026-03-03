"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveConfig = saveConfig;
exports.getConfig = getConfig;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const configDir = path_1.default.join(os_1.default.homedir(), ".storemyapi");
const configPath = path_1.default.join(configDir, "config.json");
function saveConfig(data) {
    if (!fs_1.default.existsSync(configDir)) {
        fs_1.default.mkdirSync(configDir);
    }
    fs_1.default.writeFileSync(configPath, JSON.stringify(data, null, 2));
}
function getConfig() {
    if (!fs_1.default.existsSync(configPath))
        return null;
    return JSON.parse(fs_1.default.readFileSync(configPath, "utf-8"));
}
