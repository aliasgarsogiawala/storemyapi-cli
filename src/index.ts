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
import { keyGet, keySet, keyDelete, keyList } from "./commands/keys";
import { shareAdd, shareRemove, shareList, shareInvites, shareAccept, shareDecline } from "./commands/share";

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

program.parse();