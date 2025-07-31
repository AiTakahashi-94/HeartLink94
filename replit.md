# CoupleFinance - Receipt Expense Tracking App

## Overview

CoupleFinance is a full-stack web application designed for couples to track their monthly expenses by uploading receipts. The app features OCR (Optical Character Recognition) processing to automatically extract expense amounts from receipt images, combined with emotional categorization to help couples understand their spending patterns and habits.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with custom theming
- **Build Tool**: Vite for development and bundling
- **Mobile-First**: Responsive design with dedicated mobile navigation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API endpoints
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Storage**: PostgreSQL-based sessions with connect-pg-simple
- **File Processing**: Mock OCR endpoint for receipt processing

### Development Environment
- **Dev Server**: Vite development server with HMR
- **TypeScript**: Strict mode with path mapping
- **Code Organization**: Monorepo structure with shared schemas

## Key Components

### Database Schema
- **Users Table**: Stores user credentials (id, username, password)
- **Expenses Table**: Stores expense records with:
  - Amount (decimal precision)
  - Category (predefined categories like 食費, 交通費, etc.)
  - Emotion (6 emotional states: happy, necessary, guilty, excited, worried, satisfied)
  - Store name and notes
  - Receipt URL (for future image storage)
  - Created timestamp

### Core Features
1. **Receipt Upload**: Camera/file upload with mock OCR processing
2. **Expense Form**: Auto-populated amount with manual category and emotion selection
3. **Dashboard**: Visual spending analysis with category and emotion breakdowns
4. **Monthly Comparison**: Compare current vs previous month metrics
5. **Expense History**: Searchable and filterable expense records

### UI Architecture
- **Mobile Navigation**: Bottom tab bar for mobile devices
- **Desktop Sidebar**: Left sidebar navigation for desktop
- **Responsive Components**: All components adapt to screen size
- **Emotion System**: Color-coded emotional categories with icons
- **Japanese UI**: Primary interface language is Japanese

## Data Flow

1. **Receipt Processing**:
   - User uploads receipt image → Mock OCR endpoint → Extracted amount returned
   - User completes expense form with emotion and category
   - Expense saved to database via POST /api/expenses

2. **Data Visualization**:
   - Dashboard fetches all expenses via GET /api/expenses
   - Client-side calculations for totals, averages, and breakdowns
   - Real-time updates using React Query cache invalidation

3. **State Management**:
   - Server state managed by TanStack Query
   - Local UI state managed by React hooks
   - Form state handled by native React form handling

## External Dependencies

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **@tanstack/react-query**: Server state management
- **lucide-react**: Icon library
- **tailwindcss**: CSS framework
- **class-variance-authority**: Component variant management

### Backend Dependencies
- **drizzle-orm**: Type-safe SQL ORM
- **@neondatabase/serverless**: Neon database driver
- **express**: Web framework
- **zod**: Runtime type validation
- **drizzle-zod**: Zod schema generation from Drizzle schemas

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type system
- **@replit/vite-plugin-***: Replit-specific development tools

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Database**: Drizzle Kit handles schema migrations

### Environment Configuration
- **Development**: Uses tsx for server execution with hot reload
- **Production**: Node.js serves built Express server
- **Database**: Requires DATABASE_URL environment variable for PostgreSQL connection

### Storage Strategy
- **Current**: In-memory storage with mock data for development
- **Planned**: Full PostgreSQL integration with Drizzle ORM
- **Images**: Receipt URLs stored in database (storage implementation pending)

### Key Architectural Decisions

1. **Monorepo Structure**: Shared schema between client and server ensures type safety
2. **Mock OCR**: Simulates real OCR processing for development without external API costs
3. **Emotional Categorization**: Unique approach to expense tracking focused on spending psychology
4. **Mobile-First Design**: Primary target is mobile users (couples on-the-go)
5. **Japanese Localization**: Interface designed for Japanese-speaking users
6. **Serverless Database**: Neon provides scalable PostgreSQL without infrastructure management