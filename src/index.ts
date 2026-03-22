#!/usr/bin/env node

import { Command } from "commander";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../package.json") as { version: string };
import { login } from "./commands/login";
import { whoami } from "./commands/whoami";
import { logout } from "./commands/logout";
import { init } from "./commands/init";
import { projects } from "./commands/projects";
import { link } from "./commands/link";
import { pull } from "./commands/pull";
import { push } from "./commands/push";
import { keyGet, keySet, keyDelete, keyList } from "./commands/keys";
import { shareAdd, shareRemove, shareList, shareInvites, shareAccept, shareDecline } from "./commands/share";
import { doctor } from "./commands/doctor";
import { audit } from "./commands/audit";
import { envRun } from "./commands/env";
import { vercelDeploy } from "./commands/vercel";

const program = new Command();

program
  .name("storemyapi")
  .description("Secure cloud-synced .env manager")
  .version(version);

program
  .command("login")
  .description("Authenticate with storemyapi")
  .option("--no-browser", "Do not open the browser automatically")
  .action((opts) => login(opts));

program
  .command("whoami")
  .description("Show current logged in user")
  .action(whoami);

program
  .command("logout")
  .description("Logout from storemyapi")
  .action(logout);

program
  .command("init")
  .description("Initialize storemyapi in this folder")
  .action(init);

program
  .command("projects")
  .description("List your projects")
  .action(projects);

program
  .command("link [nameOrId]")
  .description("Link this folder to an existing storemyapi project")
  .action((nameOrId) => link(nameOrId));

program
  .command("pull [key]")
  .description("Pull keys from project into .env.local (or .env). Use -f to specify a file.")
  .option("-f, --file <file>", "Target env file (default: auto-detect .env.local or .env)")
  .action((key, opts) => pull(key, opts));

program
  .command("push [key]")
  .description("Push keys from .env.local (or .env) to project. Use -f to specify a file.")
  .option("-f, --file <file>", "Source env file (default: auto-detect .env.local or .env)")
  .action((key, opts) => push(key, opts));

const key = program.command("key").description("Manage individual keys in the linked project");

key
  .command("get <name>")
  .description("Get a key's value from the project")
  .action((name) => keyGet(name));

key
  .command("set <name> <value>")
  .description("Set a key's value in the project")
  .action((name, value) => keySet(name, value));

key
  .command("delete <name>")
  .description("Delete a key from the project")
  .action((name) => keyDelete(name));

key
  .command("list")
  .description("List all keys in the project")
  .action(keyList);

const share = program.command("share").description("Manage collaborator access to the linked project");

share
  .command("add <email> <permission>")
  .description("Give a user access to this project (permission: read or write)")
  .action((email, permission) => shareAdd(email, permission));

share
  .command("remove <email>")
  .description("Revoke a user's access to this project")
  .action((email) => shareRemove(email));

share
  .command("list")
  .description("List all collaborators on this project")
  .action(shareList);

share
  .command("invites")
  .description("List all pending invites sent to you")
  .action(shareInvites);

share
  .command("accept <inviteId>")
  .description("Accept a pending invite")
  .action((inviteId) => shareAccept(inviteId));

share
  .command("decline <inviteId>")
  .description("Decline a pending invite")
  .action((inviteId) => shareDecline(inviteId));

program
  .command("doctor")
  .description("Check your setup and connection health")
  .action(doctor);

program
  .command("audit")
  .description("Compare local .env.local (or .env) with cloud keys and show what is out of sync")
  .option("-f, --file <file>", "Env file to compare (default: auto-detect .env.local or .env)")
  .action((opts) => audit(opts));

const env = program.command("env").description("Run commands with cloud keys injected as environment variables").enablePositionalOptions();

env
  .command("run")
  .description("Run a command with cloud keys injected into the environment")
  .allowUnknownOption()
  .passThroughOptions()
  .argument("[args...]")
  .action((args) => envRun(args));

const vercel = program.command("vercel").description("Vercel integration (beta)");

vercel
  .command("deploy")
  .description("Push storemyapi keys as environment variables to a Vercel project [BETA]")
  .option("-t, --token <token>", "Vercel personal access token")
  .option("-p, --project <project>", "Vercel project ID or name")
  .option("--team <teamId>", "Vercel team ID (optional)")
  .option("--target <target>", "Deployment target: production, preview, or development (default: production)")
  .option("-k, --key <name>", "Deploy only this key (can be repeated)", (v, acc: string[]) => [...acc, v], [] as string[])
  .option("-y, --yes", "Skip confirmation prompts")
  .action((opts) =>
    vercelDeploy({
      token: opts.token,
      project: opts.project,
      team: opts.team,
      target: opts.target,
      keys: opts.key,
      yes: opts.yes,
    })
  );

program.parse();