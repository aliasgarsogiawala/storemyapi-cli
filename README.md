# StoreMyAPI CLI

A secure, cloud-synced environment variable manager for your development workflow.

**Version:** 1.0.3

## Overview

StoreMyAPI CLI is a command-line tool that provides seamless management of environment variables across your development environment. Authenticate securely via browser and store your `.env` configuration in the cloud with confidence.

## Features

- **Secure Browser-Based Authentication** - OAuth-style device flow authentication
- **Cloud-Synced Environment Variables** - Store and retrieve your `.env` files securely
- **Cross-Device Access** - Access your configuration from any machine
- **Zero-Config Setup** - Minimal configuration required
- **Type-Safe** - Built with TypeScript for reliability

## Installation

```bash
npm install -g storemyapi
```

Alternatively, install locally in your project:

```bash
npm install --save-dev storemyapi
```

## Quick Start

### 1. Authenticate

Start the authentication flow:

```bash
storemyapi login
```

This will:
- Open your default browser for authentication
- Display a verification URL if browser fails to open
- Store your access token locally after successful authentication

### 2. Verify Authentication

Check your current authentication status:

```bash
storemyapi whoami
```

Returns the email address associated with your authenticated account.

## Commands

### `login`

Initiates CLI authentication via browser.

```bash
storemyapi login
```

**What it does:**
- Generates a device code for verification
- Opens your browser to the authentication page
- Polls for verification status
- Stores access token upon successful authentication

**Requirements:**
- Default browser available on your system
- Active internet connection

### `whoami`

Displays the currently authenticated user.

```bash
storemyapi whoami
```

**Output:**
```
👤 Logged in as:
User: your-email@example.com
```

**Error Cases:**
- Returns "not logged in" message if no authentication token exists
- Returns "session invalid" if token has expired

## Configuration

Your authentication token is stored locally in:

```
~/.storemyapi/config.json
```

This file contains:
- `accessToken` - Bearer token for API requests
- `userId` - Your unique user identifier

**Security Note:** This file contains sensitive authentication data. Do not share or commit this file to version control. Add it to your `.gitignore`.

## Authentication Flow

StoreMyAPI CLI uses a device code authentication flow:

1. CLI requests device code from StoreMyAPI API
2. Browser opens with verification URL
3. User authenticates in browser
4. CLI polls for verification status every 3 seconds
5. Upon verification, CLI exchanges device code for access token
6. Token is stored locally for future API requests

## Error Handling

### Authentication Errors

**"You are not logged in"**
- Run `storemyapi login` to authenticate

**"Session invalid or expired"**
- Your token has expired
- Run `storemyapi login` to re-authenticate

**"Login failed"**
- Check your internet connection
- Verify the authentication URL loaded in your browser
- Try the login process again

## System Requirements

- Node.js 18.0 or higher
- macOS, Linux, or Windows
- Default web browser for authentication

## API Reference

The CLI communicates with the StoreMyAPI backend at `https://storemyapi.dev/api`

### Endpoints Used

- `POST /cli/start` - Initiate device code flow
- `GET /cli/poll?code={deviceCode}` - Poll for verification status
- `POST /cli/token` - Exchange device code for access token
- `GET /cli/me` - Get authenticated user information

## Troubleshooting

### Browser doesn't open automatically

The CLI will display the authentication URL in the terminal. Copy and paste it into your browser manually.

### Authentication hangs

Ensure your internet connection is stable. The CLI polls every 3 seconds and will timeout after multiple failed attempts.

### Command not found

If you installed globally, ensure npm's global bin directory is in your PATH:

```bash
npm config get prefix
```

Add the returned path's `bin` directory to your PATH environment variable.

## Development

### Prerequisites

- Node.js 18+
- npm 9+
- TypeScript 5+

### Setup

```bash
git clone <repository>
cd storemyapi-cli
npm install
```

### Build

```bash
npm run build
```

Compiles TypeScript to JavaScript in the `dist/` directory.

### Test

```bash
npm test
```

## Project Structure

```
storemyapi-cli/
├── src/
│   ├── index.ts           # CLI entry point
│   ├── commands/
│   │   ├── login.ts       # Login command handler
│   │   └── whoami.ts      # Whoami command handler
│   └── utils/
│       ├── api.ts         # API client configuration
│       └── config.ts      # Configuration file management
├── dist/                  # Compiled JavaScript
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project metadata and dependencies
```

## Dependencies

- **commander** ^14.0.3 - Command-line interface framework
- **axios** ^1.13.6 - HTTP client for API requests
- **open** ^11.0.0 - Opens URLs in default browser

## License

ISC

## Support

For issues, feature requests, or contributions, please contact support or visit the project repository.

## Changelog

### Version 1.0.3

- Improved authentication success page formatting
- Enhanced error messages for better user guidance
- Refined terminal output for professional presentation
- Updated documentation and README

### Version 1.0.1

- Initial stable release
- Core authentication flow
- Basic user verification

---

**Built with TypeScript • Powered by Node.js**
