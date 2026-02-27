#!/usr/bin/env node

import { Command } from "commander";
import { login } from "./commands/login";

const program = new Command();

program
  .name("storemyapi")
  .description("Secure cloud-synced .env manager")
  .version("1.0.1");

program
  .command("login")
  .description("Login via browser")
  .action(login);

program.parse();