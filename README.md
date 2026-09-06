# Autism-Point-Scheduler

A TypeScript-based monorepo project for scheduling and managing autism support services.

**Version:** 1.0.0

## 📦 Packages

This monorepo contains the following packages:

- **@workspace/api-server** - Express.js API server with session management
- **@workspace/db** - Database layer with Drizzle ORM
- **@workspace/api-zod** - API validation schemas using Zod
- **@workspace/scripts** - Utility scripts

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm (package manager)

### Installation

```bash
pnpm install
```

### Development

```bash
# Type checking
pnpm run typecheck

# Build all packages
pnpm run build

# Start API server in development mode
cd artifacts/api-server
pnpm run dev
```

### Production Build

```bash
pnpm run build
```

## 📋 Available Scripts

- `pnpm run build` - Build all packages
- `pnpm run typecheck` - Run TypeScript type checking
- `pnpm run typecheck:libs` - Type check libraries only

## 🔧 Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Package Manager:** pnpm (monorepo workspaces)
- **Web Framework:** Express.js
- **Database ORM:** Drizzle ORM
- **Validation:** Zod
- **Code Formatting:** Prettier

## 📝 License

MIT

## 🔗 Links

- [Homepage](https://replit.com/@autismpointpk/Autism-Point-Scheduler)
- [GitHub Repository](https://github.com/talibjoiya/Autism-Point-Scheduler)

---

**Last Updated:** September 6, 2026
