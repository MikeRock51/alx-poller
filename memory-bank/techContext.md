# Technical Context: Polling App Technology Stack

## Core Technology Stack

### Frontend Framework
- **Next.js 15.0.0**: React framework with App Router
  - Server Components for optimal performance
  - Client Components for interactivity
  - Built-in optimization and SEO features
  - File-based routing system

### Programming Language
- **TypeScript 5.x**: Strict type checking and modern JavaScript features
  - Comprehensive type definitions for all components
  - Enhanced developer experience with IntelliSense
  - Compile-time error detection

### Styling & UI
- **Tailwind CSS 4.x**: Utility-first CSS framework
  - Consistent design system
  - Responsive design utilities
  - Dark mode support built-in
- **Shadcn/ui**: High-quality React components
  - Accessible and customizable
  - Consistent with modern design trends
  - Built on Radix UI primitives

### Backend & Database
- **Supabase**: Backend-as-a-Service platform
  - PostgreSQL database with real-time capabilities
  - Built-in authentication and authorization
  - Row-Level Security (RLS) policies
  - Automatic API generation

### Development Tools
- **ESLint**: Code linting and quality enforcement
- **Prettier**: Code formatting consistency
- **TypeScript Compiler**: Type checking and compilation
- **Next.js Dev Server**: Hot reloading and development server

## Development Environment Setup

### Local Development Requirements
```bash
# Required software versions
Node.js: 18.17.0 or later
npm: 9.0.0 or later
Git: 2.30.0 or later

# Recommended IDE setup
VS Code with extensions:
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- ESLint
- Prettier - Code formatter
```

### Environment Variables
```bash
# .env.local (create this file)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_connection_string
```

### Project Structure
```
alx-poller/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard/home page
│   ├── polls/             # Poll-related pages
│   └── auth/              # Authentication pages
├── components/            # Reusable React components
│   ├── ui/               # Shadcn/ui components
│   ├── polls/            # Poll-specific components
│   └── dashboard/        # Dashboard components
├── lib/                   # Utility functions and configurations
│   ├── supabase/         # Database client setup
│   ├── actions/          # Server actions
│   └── utils.ts          # Helper functions
├── memory-bank/          # Project documentation
├── public/               # Static assets
└── styles/               # Global styles
```

## Key Technical Constraints

### Next.js App Router Limitations
1. **Server/Client Component Boundaries**
   - Server components cannot use browser APIs (useEffect, useState)
   - Client components cannot use server-only features
   - Must carefully plan component architecture

2. **Data Fetching Patterns**
   - Server components fetch data at build/request time
   - Client components use traditional React patterns
   - Server actions handle form submissions and mutations

### Supabase Constraints
1. **Row-Level Security (RLS)**
   - Must enable RLS on all tables
   - Policies must be carefully designed for security
   - Authentication required for most operations

2. **Real-time Limitations**
   - Subscription limits based on plan
   - Connection pooling considerations
   - Performance implications for large datasets

### TypeScript Requirements
1. **Strict Mode**
   - All variables must be typed
   - Null/undefined checking required
   - Interface definitions for all data structures

2. **Type Safety**
   - Database schema types must match TypeScript interfaces
   - API responses must be properly typed
   - Component props must be fully typed

## Database Schema

### Core Tables
```sql
-- Polls table
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    is_public BOOLEAN DEFAULT true
);

-- Poll options table
CREATE TABLE poll_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0
);

-- Votes table
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Security Policies
```sql
-- Enable RLS on all tables
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Public polls viewable by everyone
CREATE POLICY "Public polls are viewable by everyone"
    ON polls FOR SELECT USING (is_public = true);

-- Users can view their own polls
CREATE POLICY "Users can view their own polls"
    ON polls FOR SELECT USING (auth.uid() = created_by);
```

## Component Architecture

### Server Components (Data Fetching)
```typescript
// app/polls/page.tsx
export default async function PollsPage() {
  const polls = await getPolls(); // Server-side data fetching
  return <PollsClient polls={polls} />;
}
```

### Client Components (Interactivity)
```typescript
// components/polls/PollCard.tsx
"use client";
export function PollCard({ poll, onEdit, onDelete }: PollCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(poll.id);
    setIsDeleting(false);
  };

  return (
    <div>
      {/* Interactive UI elements */}
    </div>
  );
}
```

### Server Actions (Data Mutations)
```typescript
// lib/actions/polls.ts
"use server";
export async function deletePoll(pollId: string) {
  const supabase = await createClient();

  // Database operations
  await supabase.from("polls").delete().eq("id", pollId);

  revalidatePath("/polls");
}
```

## Performance Considerations

### Server-Side Rendering (SSR)
- **Benefits**: Better SEO, faster initial page loads
- **Usage**: Public pages, dashboard, poll listings
- **Implementation**: Server components with data fetching

### Client-Side Rendering (CSR)
- **Benefits**: Interactive UI, real-time updates
- **Usage**: Forms, dropdowns, dynamic interactions
- **Implementation**: Client components with state management

### Static Generation
- **Benefits**: Fastest loading, CDN caching
- **Usage**: Marketing pages, documentation
- **Implementation**: Static export or ISR

## Deployment Configuration

### Vercel Deployment
```javascript
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

### Build Optimization
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
```

## Development Workflow

### Code Quality Tools
```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Build check
npm run build
```

### Git Workflow
```bash
# Feature branch workflow
git checkout -b feature/poll-management
git add .
git commit -m "feat: add poll edit/delete functionality"
git push origin feature/poll-management
```

### Testing Strategy
```bash
# Unit tests (future)
npm run test:unit

# E2E tests (future)
npm run test:e2e

# Performance tests
npm run test:perf
```

## Monitoring and Analytics

### Error Tracking
- **Vercel Analytics**: Performance monitoring
- **Console Logging**: Development debugging
- **Error Boundaries**: Production error handling

### Performance Metrics
- **Core Web Vitals**: LCP, FID, CLS
- **Bundle Size**: Monitor JavaScript bundle size
- **API Performance**: Response times and error rates

## Security Considerations

### Authentication
- **Supabase Auth**: Secure authentication flow
- **JWT Tokens**: Secure API communication
- **Session Management**: Proper session handling

### Data Protection
- **Row-Level Security**: Database-level access control
- **Input Validation**: Server-side validation
- **SQL Injection Prevention**: Parameterized queries

### Privacy
- **Data Minimization**: Only collect necessary data
- **User Consent**: Clear privacy policies
- **Data Retention**: Proper data lifecycle management

## Future Technology Considerations

### Potential Additions
- **Redis**: Caching layer for performance
- **CDN**: Global content delivery
- **WebSockets**: Real-time communication
- **GraphQL**: Flexible API layer

### Scalability Plans
- **Database Sharding**: Handle large datasets
- **Microservices**: Break down monolithic architecture
- **Edge Computing**: Global performance optimization

This technical foundation provides a solid, scalable, and maintainable platform for the polling application.
