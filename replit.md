# GWT Task Management System

## Overview

GWT Task Management is a comprehensive Arabic-language task and employee management system designed for companies. It provides real-time employee activity tracking through AUX status monitoring, task management with Kanban boards, HR management features, and analytics reporting. Built as a full-stack web application, it supports role-based access control for employees, sub-admins, and administrators. The project aims to streamline company operations and enhance employee oversight.

## Recent Changes

**October 24, 2025 - UI/UX Fixes for Deductions and HR Pages (v1.2.1)**

Fixed layout and data display issues in deductions and HR management pages to ensure consistent user experience across the application.

**Fixes Applied:**
- Deductions pages (both user and admin views) restructured from MotionPageShell pattern to standard Navigation + Sidebar + main layout
- Resolved sidebar and header alignment issues on deductions pages for proper responsive behavior
- Fixed HR payroll API endpoint to return correct field names (`fullName`, `salary`, `netSalary`) instead of incorrect mappings
- Both deduction pages now properly integrate with sidebar collapse functionality and maintain consistent spacing

**Technical Details:**
- Removed MotionPageShell wrapper usage and replaced with `<div className="min-h-screen">` containing Navigation, Sidebar, and main content
- Updated `/api/hr/payroll` route to map user data correctly to PayrollEntry interface
- Employee distribution section already correctly displays all active users via department aggregation
- All changes maintain existing animation components (MotionSection, MotionMetricCard) for visual consistency

**October 24, 2025 - Salary Deductions Management Feature (v1.2.0)**

Implemented comprehensive salary deductions management system with role-based access control, providing employees with read-only views of their deductions while enabling administrators to perform full CRUD operations.

**Features Implemented:**
- Database schema with `salary_deductions` table (UUID relations, decimal amounts, optional days deducted)
- Secure API routes with Zod validation preventing unauthorized field modifications
- User deductions page (`/my-deductions`) - read-only view of personal deductions with reason, days, amount, and date
- Admin deductions page (`/admin/deductions`) - full CRUD with user filtering, search, and real-time updates
- Socket.IO real-time broadcasts for create/update/delete operations
- Automatic notifications sent to employees when deductions are added, updated, or removed
- Navigation links added to sidebar for both user and admin roles (TrendingDown icons)

**Security Enhancements:**
- Zod validation schemas enforce data integrity (insertSalaryDeductionSchema, updateSalaryDeductionSchema)
- Protected fields (userId, addedBy, createdAt, updatedAt) are server-controlled and cannot be modified via API
- Update operations whitelist only allowed fields: reason, daysDeducted, amount
- Validation errors return helpful 400 responses with detailed error information

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

**Schema Design:** Tables for users, AUX sessions, tasks, task collaborators, task notes, leave requests, notifications, shifts, and salary deductions. UUID primary keys, enum types for status fields, soft delete (`isActive`), timestamp tracking.

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
- `/api/deductions` (Salary deductions management)

**WebSocket Endpoints:** `/ws` (Real-time updates).

### Environment Configuration

**Required Environment Variables:** `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV`.

**Google Calendar OAuth (VPS-Compatible):** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`. Instructions for Google Cloud Console setup are available within the codebase.
---

## 📦 Production Deployment

### Socket.IO & WebSocket Configuration

The application uses **Socket.IO** for real-time communication with the following features:

✅ **WebSocket** and **HTTP polling** fallback support
✅ **CORS** configured for production (use `ALLOWED_ORIGINS` environment variable)
✅ **Service Worker** for push notifications
✅ **Automatic reconnection** on network failures

### Deployment Files

- **DEPLOYMENT.md** - Complete deployment guide for cPanel/VPS with Apache
- **.env.example** - Environment variable template
- **public/service-worker.js** - Service worker for push notifications

### Quick Deploy to Production

1. Set environment variables (see `.env.example`)
2. Build: `npm run build`
3. Copy service worker: `cp public/service-worker.js dist/public/service-worker.js`
4. Start with PM2: `pm2 start npm --name "gwt-tasks" -- run start`
5. Configure Apache proxy (see `DEPLOYMENT.md`)

**Important:** After building, always copy `public/service-worker.js` to `dist/public/service-worker.js`

### Environment Variables for Production

Required for production deployment:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your-secure-random-secret
ALLOWED_ORIGINS=https://hub.greenweb-tech.com
```

See `DEPLOYMENT.md` for complete deployment instructions.
