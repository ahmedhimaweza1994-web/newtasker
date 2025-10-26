# GWT Task Management System

## Overview

GWT Task Management is a comprehensive Arabic-language task and employee management system designed for companies. It provides real-time employee activity tracking through AUX status monitoring, task management with Kanban boards, HR management features, and analytics reporting. Built as a full-stack web application, it supports role-based access control for employees, sub-admins, and administrators. The project aims to streamline company operations and enhance employee oversight with a focus on a modern, responsive user experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The application features a modern design with a focus on usability, responsiveness, and Arabic localization. It utilizes the Cairo font for improved readability and includes comprehensive RTL (Right-to-Left) support. Authentication pages have a modern aesthetic with gradient backgrounds and glassmorphism effects. Dark mode is fully supported with careful consideration for icon visibility and semantic color preservation. Animated components using Framer Motion are integrated for interactive elements, such as the AI Center page.

### Technical Implementations

The system is a full-stack web application. The frontend is built with React 18 (TypeScript), Vite, Wouter for routing, TanStack Query for server state management, and Shadcn UI/Radix UI for components, styled using Tailwind CSS. The backend utilizes Node.js with Express.js and TypeScript, employing Passport.js for session-based authentication and Drizzle ORM for database interactions. Real-time features are powered by Socket.IO WebSockets.

### Feature Specifications

Key features include:
- **Task Management:** Kanban boards, task creation, assignment, and real-time updates.
- **Employee Monitoring:** Real-time AUX status tracking.
- **HR Management:** Leave requests, salary advances, and a comprehensive salary deductions management system with CRUD operations for admins and read-only views for employees.
- **Authentication & Authorization:** Role-based access control (admin, sub-admin, employee) with secure session management.
- **Chat System:** Real-time chat with image pasting, image viewer, voice recording, and room image editing.
- **AI Center:** An internal page with animated AI models for image generation, video generation, marketing/SEO, text, and programming.
- **Notifications:** Real-time notifications for system events and deductions.
- **Analytics:** Reporting capabilities.

### System Design Choices

The architecture follows a component-based design for the frontend, with custom hooks and Context API for global state. The backend provides a RESTful API with middleware for authentication, authorization, and centralized error handling. PostgreSQL serves as the primary database, utilizing UUID primary keys, enum types, and soft-delete mechanisms. State management on the client-side leverages TanStack Query for server state and WebSockets for real-time data synchronization with optimistic updates and polling fallbacks.

## External Dependencies

### Third-Party Services

- **Database:** Neon Serverless PostgreSQL
- **Session Storage:** `connect-pg-simple` (for PostgreSQL-backed Express sessions)

### UI Component Libraries

- Radix UI
- Shadcn UI
- Embla Carousel
- cmdk
- Chart.js

### Form Management & Validation

- React Hook Form
- Zod
- drizzle-zod

### Utilities & Libraries

- date-fns
- class-variance-authority
- clsx
- tailwind-merge
- nanoid
- Framer Motion

### API Integration Points

- **Internal REST APIs:**
    - `/api/auth` (Authentication)
    - `/api/user` (User information)
    - `/api/tasks` (Task operations)
    - `/api/aux` (AUX session management)
    - `/api/admin` (Admin functions)
    - `/api/analytics` (Reporting)
    - `/api/notifications` (Notifications)
    - `/api/profile` (Profile management)
    - `/api/deductions` (Salary deductions management)
    - `/api/hr/payroll` (HR Payroll data)
- **WebSocket Endpoints:** `/ws` (Real-time updates)

### Environment Configuration

- **Required Environment Variables:** `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV`.
- **Google Calendar OAuth:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.