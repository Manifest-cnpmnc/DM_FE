# Document Management System (Frontend)

A modern document management system for internal use, built with React, TypeScript, and Vite.

## Overview

The Document Management System enables users to efficiently upload, organize, search, and download documents while providing administrators with comprehensive audit logging and system oversight capabilities.

### Key Features

**For Standard Users:**

- 📁 Upload and download documents (PDF, Word formats)
- 🔍 Search and filter documents by name or category
- 📋 View organized document list with metadata
- 🏷️ Organize documents into custom categories

**For Administrators:**

- ✅ Approve and manage document information
- 🗑️ Delete documents (soft delete)
- 📊 View statistical dashboard with system metrics
- 📜 Review complete audit logs of all user activities

## Tech Stack

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type-safe code
- **Vite 8** - Fast build tool & dev server
- **ESLint** - Code quality assurance
- **Oxc Parser** - High-performance JavaScript parser

### Supported Formats

- PDF documents
- Microsoft Word files (.doc, .docx)

## Project Structure

```
DocumentManagement/
├── src/
│   ├── components/        # Reusable React components
│   ├── pages/            # Page-level components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API communication layer
│   ├── types/            # TypeScript type definitions
│   ├── styles/           # CSS/styling
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Entry point
├── public/               # Static assets
├── dist/                 # Production build output
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── eslint.config.js      # ESLint configuration
└── package.json          # Project dependencies
```

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Starts the development server at `http://localhost:5173` with hot module reload (HMR).

### Production Build

```bash
npm run build
```

Compiles TypeScript and builds optimized production bundle to the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

Previews the production build locally.

### Code Quality

```bash
npm run lint
```

Runs ESLint to check code quality and TypeScript compliance.

## Sprint Plan (9 Hours Total)

### Sprint 1: Foundation Building & Territory Division (3 hours)

**Goal:** All 4 teams set up their respective parts independently.

- **Team 1 (Core & Auth):** Story 1 - Authorization and Login
  - Backend: Login API with role-based access (Admin/User)
  - Frontend: Login form with token persistence
  - Database: 2 sample user accounts

- **Team 2 (Storage):** Story 2 - Document Upload & Physical Storage
  - Backend: File upload logic, local storage handling
  - Frontend: File selection UI with progress indicator
  - Supported: PDF, Word documents

- **Team 3 (Metadata):** Story 3 - Document Categorization
  - Full CRUD operations for document categories
  - Independent module: Create, Read, Update, Delete categories

- **Team 4 (Log/Audit):** Story 4 - Audit Log (Activity History)
  - Log table schema design
  - Shared helper function for logging actions
  - Frontend: Activity history table display

### Sprint 2: Assembly & Feature Expansion (3 hours)

**Goal:** Teams integrate; uploaded files are viewable and downloadable.

- **Team 1:** Story 5 - Document List & Download
  - Query documents with category information
  - Download functionality with file retrieval

- **Team 2:** Story 6 - Delete Document (Soft Delete)
  - Mark documents as deleted (is_deleted = true)
  - Hide deleted documents from UI

- **Team 3:** Story 7 - Search & Filter
  - Full-text search by document name
  - Filter by category
  - Integrated search UI

### Sprint 3: Cross-Integration & Packaging (3 hours)

**Goal:** Integrate all features, fix bugs, prepare demo.

- **Teams 1 & 2:** Story 8 - UI/UX Integration & Error Handling
  - File size validation (max 50MB)
  - File format validation
  - Error messages and user feedback
  - Code merge to shared branch

- **Team 3:** Story 9 - Attach Logs to All Actions
  - Connect audit logging to upload/download/delete operations
  - Complete activity history tracking

- **Team 4:** Story 10 - Demo Data & Presentation
  - Create 10 sample categories
  - Upload 20-30 realistic sample documents
  - Prepare demo script and talking points

## User Roles & Permissions

### Admin

- Approve documents
- Manage document metadata
- Delete documents
- View system audit logs
- Access statistical dashboard

### Standard User

- Upload documents
- Download documents
- Search and filter documents
- View document list

## Authentication

The system uses token-based authentication with role-based access control (RBAC):

- Two roles: **Admin** and **User**
- Tokens stored securely in browser storage
- Role determines available features and permissions

## API Integration

The frontend communicates with the backend API for:

- User authentication and authorization
- Document upload and download
- Document metadata queries
- Category management
- Audit log retrieval
- System statistics

## Development Guidelines

- **Type Safety:** Leverage TypeScript for catching errors early
- **Component Structure:** Keep components focused and reusable
- **API Layer:** Centralize API calls in the services directory
- **Code Quality:** Run ESLint before committing code
- **Performance:** Use Vite's code splitting and lazy loading features

## Browser Support

Modern browsers with ES2020+ support:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

```

```
