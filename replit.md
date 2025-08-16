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
- **OCR Processing**: OCR.space API with Japanese language support for enhanced accuracy

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
- **Budgets Table**: Stores monthly budget records with:
  - Amount (decimal precision)
  - Year and month
  - User ID
  - Created/updated timestamps

### Core Features
1. **Receipt Upload**: Camera/file upload with Google Vision API OCR processing
2. **Expense Form**: Auto-populated amount with manual category and emotion selection
3. **Dashboard**: Visual spending analysis with category and emotion breakdowns
4. **Budget Management**: Monthly budget setting with usage tracking and alerts
5. **Monthly Comparison**: Compare current vs previous month metrics
6. **Expense History**: Searchable and filterable expense records

### UI Architecture
- **Mobile Navigation**: Bottom tab bar for mobile devices
- **Desktop Sidebar**: Left sidebar navigation for desktop
- **Responsive Components**: All components adapt to screen size
- **Emotion System**: Color-coded emotional categories with icons
- **Japanese UI**: Primary interface language is Japanese

## Data Flow

1. **Enhanced Receipt Processing**:
   - User uploads receipt image → OCR.space API processing with Japanese language support
   - Advanced pattern matching extracts amount, store name, and date from Japanese receipts
   - Auto-population of form fields with extracted data and OCR text display
   - User completes expense form with emotion and category selection
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
- **OCR.space API**: Cloud-based OCR service with Japanese language support

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
2. **Cloud OCR**: OCR.space API provides high-accuracy Japanese text recognition
3. **Advanced Receipt Parsing**: Sophisticated text extraction targeting Japanese receipt formats
4. **Emotional Categorization**: Unique approach to expense tracking focused on spending psychology
5. **Mobile-First Design**: Primary target is mobile users (couples on-the-go)
6. **Japanese Localization**: Interface designed for Japanese-speaking users with OCR support
7. **Serverless Database**: Neon provides scalable PostgreSQL without infrastructure management
8. **Couple-Centric Architecture**: Built specifically for two-person financial management with invitation system
9. **Secure Partner Linking**: Invite code system ensures only intended partners can connect
10. **Real-time Collaboration**: Partner expenses and budgets shared in real-time for joint financial planning

## Recent Changes

### 2025-08-16: Category Icon Color Unification 
- **統一カテゴリカラー** - お金の管理画面と履歴画面で統一されたカテゴリ色を使用：
  - わんちゃん = 紫 (#8B5CF6)
  - 食費 = 赤 (#EF4444)
  - 医療費 = 緑 (#10B981)
  - 交通費 = オレンジ (#F97316)
  - 日用品 = 青 (#3B82F6)
  - 娯楽 = 黄色 (#F59E0B)
  - その他 = グレー (#9CA3AF)
- **視覚的一貫性の向上** - 履歴画面のカテゴリ表示を青色背景から色付きアイコンに変更

### 2025-08-14: UI Color Consistency Improvements
- **Unified category icon colors** - All expense category icons now use consistent green color (#1AB676)
- **Standardized navigation icon colors** - Both mobile and desktop navigation icons use the same green theme
- **Enhanced monthly expense visualization** - Added interactive charts showing spending trends and frequency over 6 months
- **Improved visual consistency** across all expense-related UI components

### 2025-01-31: Couple Features & Profile Management System
- **Added comprehensive couple functionality** with partner invitation and linking system
- **Implemented profile management UI** with display name editing and account settings
- **Created invite code system** for secure partner connections with 8-character unique codes
- **Enhanced user schema** with partner relationships, display names, and invite codes
- **Added user management API endpoints** for profile updates and partner linking
- **Updated navigation systems** with new profile tab in both mobile and desktop interfaces
- **Fixed 1-day average spending calculation** to show daily spending rate instead of per-transaction average
- **Implemented partner status display** with connected/disconnected states and visual indicators
- **Created secure invitation flow** with code generation, sharing, and joining functionality

### 2025-01-31: Monthly Budget Management System
- **Added budget management database schema** with budgets table for storing monthly budget limits
- **Implemented comprehensive budget API endpoints** for creating, reading, and updating monthly budgets
- **Created BudgetManager component** with real-time spending progress tracking and visual alerts
- **Integrated budget status in dashboard** showing current month usage, remaining budget, and percentage consumed
- **Added alert system** with three levels: safe (green), warning at 80% (yellow), and over-budget at 100% (red)
- **Enhanced navigation** with new budget tab in both mobile and desktop interfaces
- **Implemented budget setting modal** with form validation and user-friendly interface
- **Added automatic budget calculations** including total spent, remaining amount, and usage percentage
- **Created sample budget data** for demonstration (¥100,000 current month, ¥90,000 previous month)

### 2025-01-31: Enhanced OCR Implementation  
- **Replaced Tesseract.js** with Google Vision API for improved Japanese text accuracy
- **Integrated cloud-based OCR** with specialized Japanese language processing
- **Implemented advanced extraction logic** with keyword-based amount detection (合計, 決済金額, etc.)
- **Enhanced store name extraction** from first 3 lines of receipt text
- **Improved date parsing** for Japanese date formats with flexible spacing
- **Added OCR result visualization** for transparency and debugging
- **Enhanced form auto-population** with extracted receipt data