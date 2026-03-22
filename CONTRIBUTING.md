# Contribute to storemyapi CLI

Thanks for your interest in contributing. This is the official CLI for [storemyapi](https://storemyapi.dev) — an open source npm package written in TypeScript.

## Project structure

```
src/
  commands/       # One file per CLI command
    login.ts
    logout.ts
    push.ts
    pull.ts
    env.ts
    keys.ts
    projects.ts
    init.ts
    link.ts
    share.ts
    audit.ts
    whoami.ts
    doctor.ts
    vercel.ts
  utils/
    api.ts        # Axios instance + auth token handling
    config.ts     # Local config read/write (~/.storemyapi)
  index.ts        # Entry point, registers all commands
```

## Getting started

**Prerequisites:** Node.js 18+, npm

```bash
# Clone the repo
git clone https://github.com/aliasgarsogiawala/storemyapi-cli
cd storemyapi-cli

# Install dependencies
npm install

# Build
npm run build

# Link locally so you can test the CLI
npm link

# Now you can run it
storemyapi --help
```

## Making changes

All commands live in `src/commands/`. Each file exports a function that accepts a `Command` instance from [commander](https://github.com/tj/commander.js) and registers its subcommand.

To add a new command:

1. Create `src/commands/yourcommand.ts`
2. Export a function that registers the command on the passed `Command`
3. Import and register it in `src/index.ts`
4. Build with `npm run build` and test with `storemyapi yourcommand`

## Building

```bash
npm run build
```

This runs `tsc` and outputs compiled JS to `dist/`.

## Code style

- TypeScript only — no plain JS in `src/`
- Keep commands focused and single-purpose
- Use `chalk` for terminal output colors (already a dependency)
- Use `inquirer` for interactive prompts
- Errors should print a clear message and exit with a non-zero code
- Don't log secrets or tokens anywhere

## Submitting a pull request

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `npm run build` and make sure it compiles cleanly
4. Test the affected commands manually
5. Open a PR with a clear description of what you changed and why

## Reporting issues

Open an issue on GitHub. Include:
- Your OS and Node.js version (`node -v`)
- The command you ran
- The full output/error

## License

ISC
