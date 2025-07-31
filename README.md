# Time Tracking App

A modern time tracking application built with Next.js, Prisma, SQLite, and Shadcn/UI that allows you to track time on JIRA tasks and internal activities.

## Features

- **JIRA Integration**: Search and select JIRA tasks with automatic fetching of task details
- **Internal Activities**: Track time on non-JIRA activities like meetings, code reviews, etc.
- **Modular Architecture**: Clean separation of concerns with reusable components
- **Type Safety**: Full TypeScript support throughout the application
- **Modern UI**: Beautiful interface built with Shadcn/UI and Tailwind CSS
- **Database**: SQLite database with Prisma ORM for data persistence

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: SQLite with Prisma ORM
- **UI**: Shadcn/UI components with Tailwind CSS
- **Language**: TypeScript
- **Validation**: Zod with React Hook Form

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up the database**:
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Create and migrate database
   npx prisma db push
   
   # Seed with default categories (optional)
   npx tsx prisma/seed.ts
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── time-entries/   # Time entry API routes
│   │   └── categories/     # Categories API routes
│   ├── globals.css         # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/
│   ├── ui/                # Shadcn/UI components
│   ├── jira-search.tsx    # JIRA task search component
│   ├── category-selector.tsx # Category selection component
│   └── time-entry-form.tsx   # Main time entry form
├── lib/
│   ├── prisma.ts          # Prisma client setup
│   └── utils.ts           # Utility functions
├── services/
│   └── jira.service.ts    # JIRA API service (mocked)
└── types/
    └── jira.ts            # JIRA-related type definitions
```

## Usage

### Time Entry Types

1. **JIRA Tasks**: 
   - Use the search input to find JIRA tasks by key or summary
   - Tasks include key, summary, and billing package information
   - Currently uses mock data (5 sample tasks)

2. **Internal Activities**:
   - Select from predefined categories like meetings, code reviews, etc.
   - Each category has a color and description

### Form Fields

- **Hours**: Required, supports decimal values (e.g., 2.5)
- **Date**: Required, defaults to today
- **Description**: Optional additional notes

## Database Schema

### Models

- **TimeEntry**: Core time tracking records
- **JiraTask**: JIRA task information with customfield_10040 (billing package)
- **Category**: Internal activity categories

### Key Features

- Either JIRA task OR category per entry (enforced at application level)
- Automatic upserting of JIRA tasks and categories
- Timestamps for all records

## API Endpoints

### Time Entries
- `GET /api/time-entries` - Fetch all time entries
- `POST /api/time-entries` - Create new time entry

### Categories
- `GET /api/categories` - Fetch all categories with usage counts

## JIRA Integration

The JIRA service is currently mocked with sample data. To integrate with a real JIRA instance:

1. Update `src/services/jira.service.ts`
2. Add environment variables for JIRA credentials
3. Implement actual REST API calls

### Mock Data

The app includes 5 sample JIRA tasks:
- PROJ-123: User authentication system
- PROJ-124: Database connection issues  
- PROJ-125: API documentation
- DEV-456: Dashboard performance optimization
- BUG-789: Memory leak fix

## Testing

Testing framework setup is planned but not yet implemented. The architecture supports:
- Unit tests for services and utilities
- Component tests with React Testing Library
- Integration tests for API routes

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npx prisma studio` - Open Prisma database viewer

### Code Style

- TypeScript strict mode enabled
- Modular component architecture
- Clean separation of concerns
- Consistent naming conventions

## Contributing

1. Follow the existing code style and patterns
2. Write type-safe code with proper TypeScript types
3. Create reusable, modular components
4. Test your changes thoroughly

## License

This project is for internal use and development purposes.