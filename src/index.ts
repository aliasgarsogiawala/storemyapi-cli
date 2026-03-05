#!/usr/bin/env node

import { Command } from "commander";
import { login } from "./commands/login";
import { whoami } from "./commands/whoami";
import { logout } from "./commands/logout";
import { init } from "./commands/init";


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

program.parse();