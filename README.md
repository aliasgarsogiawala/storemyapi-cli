# 🚀 StoreMyAPI CLI

The official command-line tool for **StoreMyAPI**.

Manage your APIs directly from your terminal with secure authentication and fast commands.

---

## 📦 Installation

Install globally using npm:

```bash
npm install -g storemyapi
```

After installation, verify:

```bash
storemyapi --version
```

---

## 🔐 Login

Authenticate your CLI session:

```bash
storemyapi login
```

What happens:

1. Your browser opens automatically
2. You log into StoreMyAPI
3. The CLI securely connects to your account
4. You're ready to use commands

You’ll see:

```
✅ Logged in successfully!!
```

---

## 🛠 Available Commands

### Login

```bash
storemyapi login
```

Authenticate your CLI with your StoreMyAPI account.

More commands coming soon.

---

## 🔒 Security

StoreMyAPI CLI uses a secure device authorization flow:

- Browser-based authentication
- JWT token issuance
- 30-day token expiration
- No password stored in CLI

Your credentials are never exposed to the CLI.

---

## 🌐 About StoreMyAPI

StoreMyAPI helps developers manage, store, and deploy APIs with ease.

Website:
https://storemyapi.dev

---

## 📄 License

MIT