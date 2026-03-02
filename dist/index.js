#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const login_1 = require("./commands/login");
const program = new commander_1.Command();
program
    .name("storemyapi")
    .description("Secure cloud-synced .env manager")
    .version("1.0.1");
program
    .command("login")
    .description("Login via browser")
    .action(login_1.login);
program.parse();
