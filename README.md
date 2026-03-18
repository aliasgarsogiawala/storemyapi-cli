# StoreMyAPI CLI

A command-line tool to sync your `.env` keys to the cloud and share them across machines and teammates.

## Installation

```bash
npm install -g storemyapi
```

## Getting started

```bash
storemyapi login
storemyapi init
storemyapi push
```

That's it. Your keys are in the cloud. On another machine, run `storemyapi pull` and you're back in business.

## Commands

### `login`

Opens a browser to authenticate. If that's not possible, use `--no-browser` and follow the instructions in the terminal.

```bash
storemyapi login
storemyapi login --no-browser
```

### `whoami`

Shows who you're currently logged in as.

### `logout`

Clears your local session.

### `projects`

Lists all your projects with their key counts and roles.

### `init`

Creates a new project and links it to your current folder. Writes a `.storemyapi.json` file — safe to commit.

### `link`

Links an existing project to your current folder. You can pass a project name or ID directly, or pick from a list.

```bash
storemyapi link
storemyapi link my-project
storemyapi link <project-id>
```

### `push`

Pushes keys from your local `.env` to the project. Pushes everything by default, or a single key if specified.

```bash
storemyapi push
storemyapi push API_KEY
```

### `pull`

Pulls keys from the project into your local `.env`. Merges with what's already there.

```bash
storemyapi pull
storemyapi pull API_KEY
```

## Files

- `~/.storemyapi/config.json` — stores your auth token. Never commit this.
- `.storemyapi.json` — links your folder to a project. Safe to commit.
- `.env` — where pulled keys land and pushed keys are read from.

## Requirements

Node.js 18 or higher.
