# Awalingo App

[![CI](https://github.com/sirolad/neolingo-app/actions/workflows/ci.yml/badge.svg)](https://github.com/sirolad/neolingo-app/actions/workflows/ci.yml)
[![Deploy](https://github.com/sirolad/neolingo-app/actions/workflows/deploy.yml/badge.svg)](https://github.com/sirolad/neolingo-app/actions/workflows/deploy.yml)
[![Dependency Update](https://github.com/sirolad/neolingo-app/actions/workflows/dependency-update.yml/badge.svg)](https://github.com/sirolad/neolingo-app/actions/workflows/dependency-update.yml)

A modern, community-driven language learning platform built with **Next.js 16**. Awalingo empowers communities to preserve and expand their languages through a curated dictionary, voting system, and gamified learning experience.

This project is bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Key Features

- **🚀 Next.js 16**: Leveraging the latest App Router, Server Actions, and Turbopack for performance.
- **🔐 Robust Auth & RBAC**: Supabase authentication integrated with a custom Role-Based Access Control system (Admin, Juror, Contributor, Explorer).
- **� Dynamic Dictionary**: Community-sourced definitions with support for audio pronunciations and usage examples.
- **�️ Curator Workflow**: Dedicated dashboards for Jurors to review, approve, or reject word submissions.
- **🎨 Custom Design System**: A meticulously crafted UI using CSS variables and semantic tokens (no utility-first CSS libraries), ensuring a unique and premium aesthetic.
- **🌍 Multi-language Support**: Scalable architecture for supporting multiple languages and dialects.
- **� PWA Ready**: Installable on mobile devices with offline capabilities.
- **🧪 Type-Safe**: End-to-end type safety with TypeScript, Zod, and Prisma.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL (via Supabase) and [Prisma ORM](https://www.prisma.io/)
- **Authentication**: Supabase Auth + Custom Authorization Hooks
- **Styling**: Vanilla CSS Modules with a comprehensive Design System (Variables, Tokens)
- **State Management**: React Context + Server State (via Server Components)
- **Testing**: [Vitest](https://vitest.dev/) for unit and integration tests
- **Icons**: Lucide React
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm, pnpm, or yarn
- A local or remote PostgreSQL database URL (env variable)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/sirolad/neolingo-app.git
   cd neolingo-app
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Setup:**

   ```bash
   cp .env.example .env.local
   # Update .env.local with your Supabase credentials and DATABASE_URL
   ```

4. **Database Migration:**

   Initialize your database schema:

   ```bash
   npx prisma migrate dev --name init
   ```

5. **Run Development Server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

## Available Scripts

- `npm run dev`: Start the development server with Turbopack.
- `npm run build`: Build the application for production.
- `npm start`: Start the production server.
- `npm run lint`: Run ESLint.
- `npm run type-check`: Run TypeScript compiler check (no emit).
- `npm run test`: Run tests with Vitest.
- `npm run format`: Format code with Prettier.

## Project Structure

```bash
src/
├── actions/         # Server Actions (data mutations, API calls)
├── app/             # Next.js App Router pages and layouts
├── components/      # React components
│   ├── auth/        # Auth-related components (PermissionGate, etc.)
│   ├── layout/      # Layout wrappers
│   ├── ui/          # Reusable design system components
│   └── ...
├── contexts/        # React Context providers (AuthContext, etc.)
├── hooks/           # Custom hooks (usePermissions, etc.)
├── lib/             # Utilities and configurations
│   ├── auth/        # RBAC logic, decorators, permissions
│   ├── prisma.ts    # Prisma client instance
│   └── ...
└── types/           # TypeScript definitions
```

## Documentation

Comprehensive documentation for developers can be found in the [`docs/`](./docs) directory:

- [**RBAC Developer Guide**](./docs/rbac_developer_guide.md): How to use the permission system, `PermissionGate`, and decorators.
- [**Typogaphy System**](./docs/TYPOGRAPHY.md): Guide to the custom font sizes and weights.
- [**Testing Guide**](./docs/TESTING.md): How to write and run tests.

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit your changes: `git commit -m 'Add some amazing feature'`.
4. Push to the branch: `git push origin feature/amazing-feature`.
5. Open a Pull Request.

## License

This project is licensed under the MIT License.
