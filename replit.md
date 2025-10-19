# GWT Task Management System

## Overview

GWT Task Management is a comprehensive Arabic-language task and employee management system designed for companies. It provides real-time employee activity tracking through AUX status monitoring, task management with Kanban boards, HR management features, and analytics reporting. Built as a full-stack web application, it supports role-based access control for employees, sub-admins, and administrators. The project aims to streamline company operations and enhance employee oversight.

## Recent Changes

**October 19, 2025 - Calling Feature Synchronization Fix (v1.1.0)**

Fixed critical synchronization issue in the WebRTC calling system where callers would remain stuck on "جاري الاتصال..." (Connecting) while receivers saw a connected call with running timer.

**Root Cause:** Receiver-side code was prematurely setting call status to 'connected' before WebRTC media streams were actually established.

**Fixes Applied:**
- Removed all premature status transitions on both caller and receiver sides
- Both parties now wait for actual WebRTC `ontrack` event before transitioning to 'connected'
- Guarded `ontrack` handler to prevent duplicate status updates when multiple tracks (audio/video) arrive
- Fixed connection state monitoring to ignore transient 'disconnected' states
- Database status now accurately reflects actual WebRTC connection state

**Result:** Caller and receiver now transition to 'connected' simultaneously when media is flowing, call timers start at the same time, and the system is robust against network fluctuations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:** React 18 (TypeScript), Vite, Wouter (routing), TanStack Query (server state), Shadcn UI (components), Radix UI (primitives), Tailwind CSS (styling), Noto Sans Arabic (fonts).

**Design Patterns:** Component-based architecture, custom hooks, HOC for protected routes, Context API for global state, real-time updates via WebSockets.

**Key Features:** Dark mode, responsive design, Arabic localization, real-time data synchronization.

### Backend Architecture

**Technology Stack:** Node.js, Express.js, TypeScript, Passport.js (authentication), Express sessions (PostgreSQL store), WebSocket server, Drizzle ORM.

**Authentication & Security:** Session-based authentication with secure HTTP-only cookies, bcrypt hashing, role-based access control (admin, sub-admin, employee), password reset.

**API Design:** RESTful API (`/api/*`), middleware for authentication and authorization, centralized error handling, request/response logging.

### Database Architecture

**Database:** PostgreSQL (Neon serverless).

**Schema Design:** Tables for users, AUX sessions, tasks, task collaborators, task notes, leave requests, notifications, and shifts. UUID primary keys, enum types for status fields, soft delete (`isActive`), timestamp tracking.

### State Management

**Client-Side:** TanStack Query for server state, React Context for authentication, local component state, localStorage for preferences.

**Real-Time Updates:** WebSocket connections for live status, query invalidation, optimistic updates, polling fallback.

## External Dependencies

### Third-Party Services

**Database:** Neon Serverless PostgreSQL.

**Session Storage:** `connect-pg-simple` for PostgreSQL-backed Express sessions.

**UI Component Libraries:** Radix UI, Shadcn UI, Embla Carousel, cmdk, Chart.js.

**Form Management:** React Hook Form, Zod, drizzle-zod.

**Utilities:** date-fns, class-variance-authority, clsx, tailwind-merge, nanoid.

### API Integration Points

**Internal APIs:**
- `/api/auth` (Authentication)
- `/api/user` (User information)
- `/api/tasks` (Task operations)
- `/api/aux` (AUX session management)
- `/api/admin` (Admin functions)
- `/api/analytics` (Reporting)
- `/api/notifications` (Notifications)
- `/api/profile` (Profile management)

**WebSocket Endpoints:** `/ws` (Real-time updates).

### Environment Configuration

**Required Environment Variables:** `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV`.

**Google Calendar OAuth (VPS-Compatible):** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`. Instructions for Google Cloud Console setup are available within the codebase.