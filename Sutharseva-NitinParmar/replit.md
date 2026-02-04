# Suthar Seva - Carpenter Services Application

## Overview

This is a bilingual (Gujarati/English) carpenter services web application for Nitin Parmar's carpentry business. The application serves two main purposes:

1. **Customer-facing site** - Allows customers to get cost estimates for furniture work, contact the carpenter via phone/WhatsApp, and view the service gallery
2. **Admin dashboard** - Enables business management including project tracking, worker management, and attendance tracking

The project uses a hybrid architecture with a modern React/Express stack alongside legacy vanilla JavaScript files that integrate with Firebase for real-time data.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Dual Frontend Approach:**
- **Modern React SPA** (`client/src/`) - Built with React, TypeScript, Vite, and shadcn/ui component library. Uses Tailwind CSS for styling and Wouter for client-side routing.
- **Legacy Static HTML** (`client/admin.html`, `client/index.html`) - Vanilla JavaScript with direct Firebase SDK integration for real-time database operations. These files handle the actual business logic for the calculator, admin dashboard, and worker management.

**UI Components:**
- Full shadcn/ui component library available with "new-york" style variant
- Radix UI primitives for accessible, unstyled components
- TanStack Query for server state management in React portions
- Custom Gujarati font (Hind Vadodara) for localized text

### Backend Architecture

**Express.js Server:**
- Express 5.x with HTTP server creation pattern
- API routes prefixed with `/api` (defined in `server/routes.ts`)
- In-memory storage interface (`server/storage.ts`) with PostgreSQL-ready Drizzle schema
- Vite middleware integration for development hot reloading
- Static file serving for production builds

**Data Layer:**
- Drizzle ORM configured for PostgreSQL dialect
- Schema defined in `shared/schema.ts` with Zod validation via drizzle-zod
- Current schema includes basic user model with UUID primary keys
- In-memory storage implementation provides immediate functionality without database dependency

### Build System

- **Development:** Vite dev server with HMR, tsx for server execution
- **Production:** Custom build script using esbuild for server bundling and Vite for client
- **Database:** Drizzle Kit for schema migrations (`db:push` command)

### Authentication Pattern

The legacy admin section uses Firebase Authentication with email/password. The modern stack has placeholder user schema ready for session-based auth with passport integration (dependencies present but not wired).

## External Dependencies

### Firebase Services (Legacy Integration)
- **Firebase Auth** - Admin login functionality
- **Cloud Firestore** - Real-time database for projects, workers, attendance, settings, villages, and gallery
- **Firebase Storage** - Image storage for gallery

### Database
- **PostgreSQL** - Required for Drizzle ORM (DATABASE_URL environment variable)
- Schema supports UUID generation via `gen_random_uuid()`

### Third-Party APIs
- **WhatsApp Business API** - Direct messaging integration for customer inquiries via `wa.me` links

### Key NPM Packages
- `@tanstack/react-query` - Server state management
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `zod` - Runtime type validation
- `connect-pg-simple` - PostgreSQL session storage (available but not configured)
- `wouter` - Lightweight React router

### Replit-Specific Plugins
- `@replit/vite-plugin-runtime-error-modal` - Error overlay in development
- `@replit/vite-plugin-cartographer` - Development tooling
- `@replit/vite-plugin-dev-banner` - Development environment indicator