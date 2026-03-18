#!/usr/bin/env node

import { Command } from "commander";
import { login } from "./commands/login";
import { whoami } from "./commands/whoami";
import { logout } from "./commands/logout";
import { init } from "./commands/init";
import { projects } from "./commands/projects";
import { link } from "./commands/link";
import { pull } from "./commands/pull";
import { push } from "./commands/push";

const program = new Command();

program
  .name("storemyapi")
  .description("Secure cloud-synced .env manager")
  .version("1.0.3");

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
  .description("Pull keys from project into .env (all keys, or a specific one)")
  .action((key) => pull(key));

program
  .command("push [key]")
  .description("Push keys from .env to project (all keys, or a specific one)")
  .action((key) => push(key));

program.parse();