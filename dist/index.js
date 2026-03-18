#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const login_1 = require("./commands/login");
const whoami_1 = require("./commands/whoami");
const logout_1 = require("./commands/logout");
const init_1 = require("./commands/init");
const projects_1 = require("./commands/projects");
const link_1 = require("./commands/link");
const pull_1 = require("./commands/pull");
const push_1 = require("./commands/push");
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
program
    .command("projects")
    .description("List your projects")
    .action(projects_1.projects);
program
    .command("link [nameOrId]")
    .description("Link this folder to an existing storemyapi project")
    .action((nameOrId) => (0, link_1.link)(nameOrId));
program
    .command("pull [key]")
    .description("Pull keys from project into .env (all keys, or a specific one)")
    .action((key) => (0, pull_1.pull)(key));
program
    .command("push [key]")
    .description("Push keys from .env to project (all keys, or a specific one)")
    .action((key) => (0, push_1.push)(key));
program.parse();
