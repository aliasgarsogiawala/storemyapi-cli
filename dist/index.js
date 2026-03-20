#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../package.json");
const login_1 = require("./commands/login");
const whoami_1 = require("./commands/whoami");
const logout_1 = require("./commands/logout");
const init_1 = require("./commands/init");
const projects_1 = require("./commands/projects");
const link_1 = require("./commands/link");
const pull_1 = require("./commands/pull");
const push_1 = require("./commands/push");
const keys_1 = require("./commands/keys");
const share_1 = require("./commands/share");
const doctor_1 = require("./commands/doctor");
const audit_1 = require("./commands/audit");
const env_1 = require("./commands/env");
const program = new commander_1.Command();
program
    .name("storemyapi")
    .description("Secure cloud-synced .env manager")
    .version(version);
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
    .description("Pull keys from project into .env.local (or .env). Use -f to specify a file.")
    .option("-f, --file <file>", "Target env file (default: auto-detect .env.local or .env)")
    .action((key, opts) => (0, pull_1.pull)(key, opts));
program
    .command("push [key]")
    .description("Push keys from .env.local (or .env) to project. Use -f to specify a file.")
    .option("-f, --file <file>", "Source env file (default: auto-detect .env.local or .env)")
    .action((key, opts) => (0, push_1.push)(key, opts));
const key = program.command("key").description("Manage individual keys in the linked project");
key
    .command("get <name>")
    .description("Get a key's value from the project")
    .action((name) => (0, keys_1.keyGet)(name));
key
    .command("set <name> <value>")
    .description("Set a key's value in the project")
    .action((name, value) => (0, keys_1.keySet)(name, value));
key
    .command("delete <name>")
    .description("Delete a key from the project")
    .action((name) => (0, keys_1.keyDelete)(name));
key
    .command("list")
    .description("List all keys in the project")
    .action(keys_1.keyList);
const share = program.command("share").description("Manage collaborator access to the linked project");
share
    .command("add <email> <permission>")
    .description("Give a user access to this project (permission: read or write)")
    .action((email, permission) => (0, share_1.shareAdd)(email, permission));
share
    .command("remove <email>")
    .description("Revoke a user's access to this project")
    .action((email) => (0, share_1.shareRemove)(email));
share
    .command("list")
    .description("List all collaborators on this project")
    .action(share_1.shareList);
share
    .command("invites")
    .description("List all pending invites sent to you")
    .action(share_1.shareInvites);
share
    .command("accept <inviteId>")
    .description("Accept a pending invite")
    .action((inviteId) => (0, share_1.shareAccept)(inviteId));
share
    .command("decline <inviteId>")
    .description("Decline a pending invite")
    .action((inviteId) => (0, share_1.shareDecline)(inviteId));
program
    .command("doctor")
    .description("Check your setup and connection health")
    .action(doctor_1.doctor);
program
    .command("audit")
    .description("Compare local .env.local (or .env) with cloud keys and show what is out of sync")
    .option("-f, --file <file>", "Env file to compare (default: auto-detect .env.local or .env)")
    .action((opts) => (0, audit_1.audit)(opts));
const env = program.command("env").description("Run commands with cloud keys injected as environment variables").enablePositionalOptions();
env
    .command("run")
    .description("Run a command with cloud keys injected into the environment")
    .allowUnknownOption()
    .passThroughOptions()
    .argument("[args...]")
    .action((args) => (0, env_1.envRun)(args));
program.parse();
