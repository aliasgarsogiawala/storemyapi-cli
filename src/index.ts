#!/usr/bin/env node

import { Command } from "commander";
import { login } from "./commands/login";
import { whoami } from "./commands/whoami";


const program = new Command();

program
  .name("storemyapi")
  .description("Secure cloud-synced .env manager")
  .version("1.0.1");

program
  .command("login")
  .description("Login via browser")
  .action(login);

program
  .command("whoami")
  .description("Show current logged in user")
  .action(whoami);
program.parse();