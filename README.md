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

Creates a new project and links it to your current folder. Writes a `.storemyapi.json` file locally.

### `link`

Links an existing project to your current folder. Pass a name or ID directly, or pick from a list. If a project is already linked, it will ask before switching.

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

### `key`

Work with individual keys directly — no `.env` file involved.

```bash
storemyapi key list
storemyapi key get API_KEY
storemyapi key set API_KEY somevalue
storemyapi key delete API_KEY
```

`key set` will ask for confirmation before overwriting an existing key.

### `share`

Collaborate with teammates on a project.

**As the owner:**

```bash
storemyapi share add teammate@example.com read
storemyapi share add teammate@example.com write
storemyapi share remove teammate@example.com
storemyapi share list
```

**As the receiver:**

```bash
storemyapi share invites
```

Lists your pending invites as a dropdown. Select one and you'll be asked to accept or decline on the spot. After accepting, run `storemyapi link` to connect the project to a local folder.

### `doctor`

Checks your setup end to end — Node version, auth, API connectivity, linked project, and whether a `.env` file exists. Good first step when something feels off.

```bash
storemyapi doctor
```

### `audit`

Compares your local `.env` against the cloud and shows what's out of sync. Tells you exactly what to run to fix it.

```bash
storemyapi audit
```

Reports three things:
- Keys in the cloud that are missing from your `.env`
- Keys in your `.env` that haven't been pushed to the cloud
- Keys that exist on both sides but have different values

## Files

- `~/.storemyapi/config.json` — stores your auth token. Never commit this.
- `.storemyapi.json` — links your folder to a project. Gitignored by default.
- `.env` — where pulled keys land and pushed keys are read from.

## Requirements

Node.js 18 or higher.
