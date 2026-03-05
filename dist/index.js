#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const login_1 = require("./commands/login");
const whoami_1 = require("./commands/whoami");
const logout_1 = require("./commands/logout");
const init_1 = require("./commands/init");
const program = new commander_1.Command();
program
    .name("storemyapi")
    .description("Secure cloud-synced .env manager")
    .version("1.0.3");
program
    .command("login")
    .description("Authenticate with storemyapi")
    .option("--no-browser", "Do not open the browser automatically")
    .action((opts) => (0, login_1.login)(opts));
program
    .command("whoami")
    .description("Show current logged in user")
    .action(whoami_1.whoami);
program
    .command("logout")
    .description("Logout from storemyapi")
    .action(logout_1.logout);
program
    .command("init")
    .description("Initialize storemyapi in this folder")
    .action(init_1.init);
program.parse();
