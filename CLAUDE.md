@AGENTS.md

# Claude Project Guidelines - Photobooth Frontend

This document outlines the commands, style guide, and architectural rules for the Next.js frontend of the Photobooth application.

## Dev & Build Commands
- **Start development server**: `npm run dev` (Runs Next.js dev server on [http://localhost:3000](http://localhost:3000))
- **Build application**: `npm run build` (Next.js production build)
- **Start production build**: `npm run start` (Runs built version)
- **Run linter**: `npm run lint` (ESLint static analysis)
- **Add shadcn/ui components**: `npx shadcn@latest add <component-name>`

## Code Style & Architecture
- **Tech Stack**: React 19, Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, Radix UI.
- **Next.js 16 Rules**: Follow instructions in `AGENTS.md` to reference the version-matched documentation inside `node_modules/next/dist/docs/` before implementing navigation, caching, layout, or data-fetching changes.
- **Component Import Aliases**: Use `@/components/...`, `@/components/ui/...`, `@/lib/...`, `@/hooks/...` to keep imports clean.
- **Styling**: Tailwind CSS v4 is used with CSS variables (`app/globals.css`). Follow modern UI/UX design:
  - Rich aesthetics (vibrant color palettes, smooth transitions, soft gradients, modern fonts).
  - Premium dark mode / glassmorphism styling.
  - Micro-animations using `framer-motion` (installed) or Tailwind transitions.
  - Wrap class merges with the `cn(...)` utility from `@/lib/utils`.
- **State Management & Logic**: Keep page components modular. Use React hooks for local state, and delegate logic to custom hooks or context if necessary.
- **Backend API Communication**:
  - The Laravel API backend runs on `http://localhost:8000`.
  - Use `getApiUrl(path)` from `@/lib/api` to format backend endpoints.
  - Always handle loading, success, and error states elegantly using components or `sonner` notifications.

## Key Directory Structure
- `app/` - Page routes and global layout (Next.js App Router).
- `components/` - Reusable UI layout and functional components.
- `components/ui/` - Shadcn/ui primitive components (Button, Dialog, Input, Sonner, Table).
- `lib/` - Utilities like `utils.ts` (`cn` helper) and `api.ts` (API configuration).
