# StoreMyAPI CLI

A secure, cloud-synced environment variable manager for your development workflow.

**Version:** 1.0.5

## Overview

StoreMyAPI CLI is a command-line tool that provides seamless management of environment variables across your development environment. Authenticate securely via browser and manage your projects with confidence.

## Features

- **Secure Browser-Based Authentication** - OAuth-style device flow authentication
- **Project Management** - Initialize and manage projects locally
- **Cloud-Synced Configuration** - Store your project configuration securely
- **Session Management** - Track and logout of active sessions
- **Cross-Device Access** - Access your configuration from any machine
- **Zero-Config Setup** - Minimal configuration required

## Installation

```bash
npm install -g storemyapi
```

Alternatively, install locally in your project:

```bash
npm install --save-dev storemyapi
```

## Quick Start

### 1. Login

Start the authentication flow:

```bash
storemyapi login
```

This will open your browser for authentication and store your access token locally.

### 2. Initialize a Project

Set up a project in your current directory:

```bash
storemyapi init
```

You'll be prompted for:
- **Project name** (defaults to current folder name)
- **Description** (optional)

Creates a `.storemyapi.json` file linking your local folder to the project.

### 3. Verify Authentication

Check your current logged-in user:

```bash
storemyapi whoami
```

### 4. Logout

End your session:

```bash
storemyapi logout
```

## Commands

### `login`

Initiates CLI authentication via browser.

```bash
storemyapi login [options]
```

**Options:**
- `--no-browser` - Display authentication URL instead of opening browser automatically

**Output:**
```
Opening browser for authentication...
Login successful!
```

### `whoami`

Displays the currently authenticated user.

```bash
storemyapi whoami
```

**Output:**
```
Logged in as: your-email@example.com
```

### `logout`

Logs out and clears your local authentication token.

```bash
storemyapi logout
```

**Output:**
```
Logged out successfully.
Session duration: 2h 15m
```

### `init`

Initializes a StoreMyAPI project in your current folder.

```bash
storemyapi init
```

**Prompts:**
- Project name (required)
- Description (optional)

**Creates:**
- `.storemyapi.json` - Local project configuration

**Output:**
```
Initialized!
Project created: my-project
Linked locally via .storemyapi.json
```

## Configuration Files

### `.storemyapi/config.json`

Located in your home directory (`~/.storemyapi/config.json`). Contains:
- `accessToken` - Your authentication token
- `userId` - Your user identifier

**Security:** Never share or commit this file. Add `~/.storemyapi/` to your `.gitignore`.

### `.storemyapi.json`

Located in your project folder. Contains:
- `projectId` - Your project's unique identifier
- `projectName` - Project name
- `createdAt` - Project creation timestamp

Safe to commit to version control.

## System Requirements

- Node.js 18.0 or higher
- macOS, Linux, or Windows
- Default web browser (for authentication)

## Troubleshooting

### "You are not logged in"

Run the login command:
```bash
storemyapi login
```

### Browser doesn't open automatically

Use the `--no-browser` flag and manually visit the displayed URL:
```bash
storemyapi login --no-browser
```

### "Project already initialized"

A `.storemyapi.json` file already exists in this folder. Remove it if you want to reinitialize:
```bash
rm .storemyapi.json
storemyapi init
```

### Command not found

If installed globally, ensure npm's bin directory is in your PATH:
```bash
npm config get prefix
```

Add the returned path's `bin` directory to your system PATH.

## Project Structure

```
storemyapi-cli/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/
│   │   ├── login.ts          # Authentication handler
│   │   ├── logout.ts         # Session termination
│   │   ├── whoami.ts         # User info display
│   │   └── init.ts           # Project initialization
│   └── utils/
│       ├── api.ts            # API client
│       └── config.ts         # Config file management
├── dist/                     # Compiled output
├── tsconfig.json
└── package.json
```

## Dependencies

- **commander** ^14.0.3 - CLI framework
- **axios** ^1.13.6 - HTTP client
- **inquirer** ^9.0.0 - Interactive prompts
- **open** ^11.0.0 - Open URLs in browser
- **jwt-decode** ^4.0.0 - Token parsing

## Changelog

### Version 1.0.5

- Enhanced `init` command with project description support
- Improved error logging and diagnostics
- Better terminal output formatting
- Updated documentation

### Version 1.0.4

- Added `logout` command with session tracking
- Improved configuration cleanup

### Version 1.0.3

- Enhanced authentication UI
- Better error messages

---

**Built with TypeScript • Node.js CLI**
