# Poller - Next.js Polling App

A modern, full-featured polling application built with Next.js 15, TypeScript, and Shadcn/UI components. Create polls, gather votes, and engage your community with beautiful, interactive experiences.

## Features

### 🔐 Authentication (Supabase)
- **User Registration**: Sign up with email and password verification
- **User Login**: Secure authentication with form validation
- **Profile Management**: Update user information and account settings
- **Protected Routes**: Automatic redirects for authenticated/unauthenticated users
- **Session Management**: Persistent login sessions across browser refreshes

### 🗳️ Poll Management
- **Create Polls**: Build custom polls with multiple options
- **View Polls**: Browse and participate in community polls
- **Vote System**: Cast votes and see real-time results
- **Poll Details**: View individual poll results with visual breakdowns

### 🎨 Modern UI/UX
- **Shadcn/UI Components**: Beautiful, accessible component library
- **Responsive Design**: Works perfectly on all device sizes
- **Tailwind CSS**: Modern styling with utility-first approach
- **Dark/Light Mode Ready**: Built-in theme support

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/UI
- **Form Handling**: React Hook Form + Zod
- **Icons**: Lucide React (via Shadcn)
- **Development**: ESLint, Prettier

## Project Structure

```
app/
├── auth/
│   ├── login/          # Login page
│   ├── signup/         # Registration page
│   └── profile/        # User profile management
├── polls/
│   ├── [id]/
│   │   ├── edit/       # Poll editing page (dynamic route)
│   │   └── page.tsx    # Individual poll view (dynamic route)
│   ├── create/         # Poll creation page
│   └── page.tsx        # Polls listing page
├── favicon.ico         # App favicon
├── globals.css         # Global styles and Tailwind imports
├── layout.tsx          # Root layout with navigation
└── page.tsx            # Landing/home page

components/
├── ui/                 # Shadcn UI reusable components
├── auth/               # Authentication-related components
├── polls/              # Poll-related components
├── dashboard/
│   └── RecentPolls.tsx # Dashboard poll components
└── layout/
    └── Header.tsx      # Navigation header

types/
└── index.ts           # TypeScript type definitions

lib/
├── actions/
│   └── polls.ts       # Server actions for poll operations
├── auth/
│   └── context.tsx    # Authentication context and provider
├── supabase/
│   ├── client.ts      # Client-side Supabase client
│   └── server.ts      # Server-side Supabase client
├── toast.tsx          # Toast notification system
└── utils.ts           # Shared utility functions

__tests__/              # Test files directory
├── integration/        # Integration tests
└── lib/actions/        # Unit tests for server actions

memory-bank/            # Project documentation and context
├── activeContext.md    # Current work focus
├── productContext.md   # Product vision and goals
├── progress.md         # Development progress tracking
├── projectbrief.md     # Core project requirements
├── systemPatterns.md   # Architecture patterns
└── techContext.md      # Technology stack details
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun
- A Supabase account and project

### Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create an account
   - Click "New Project" and fill in your project details
   - Wait for the project to be fully initialized

2. **Get Your Project Credentials**
   - Go to your project's dashboard
   - Navigate to "Settings" → "API"
   - Copy your project URL and anon key

3. **Set Up Environment Variables**
   - Create a `.env.local` file in your project root
   - Add your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url-here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   ```

4. **Configure Authentication**
   - In your Supabase dashboard, go to "Authentication" → "Providers"
   - Make sure "Email" is enabled
   - Configure the site URL (your development/production URL)
   - Set up any additional authentication methods if desired

5. **Configure Redirect URLs**
   - In "Authentication" → "URL Configuration"
   - Add your development URL (e.g., `http://localhost:3000`)
   - Add your production URL when deploying

### Database Setup

1. **Initialize Supabase Database Schema**
   - The database schema is defined in `supabase-schema.sql`
   - Execute this file in your Supabase SQL editor to create all necessary tables, triggers, and policies
   - For detailed schema documentation, see `DATABASE_SCHEMA_README.md`

2. **Configure Environment Variables**
   - Copy the environment variables from your Supabase project dashboard
   - Create a `.env.local` file in the project root with the following variables:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd alx-poller
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables (see Database Setup section above)

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

The application includes comprehensive test coverage using Jest and React Testing Library.

### Running Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with coverage report
npm run test -- --coverage
```

### Test Structure

- **Unit Tests**: Located in `__tests__/` directory
  - `lib/actions/` - Server action tests
  - `integration/` - End-to-end workflow tests
- **Test Setup**: Configuration in `jest.config.js` and `jest.setup.js`
- **Mocking**: Supabase client mocking for isolated testing

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode

## Key Routes

### Authentication Routes
- `/` - Landing page with navigation
- `/auth/login` - User login page
- `/auth/signup` - User registration page
- `/auth/profile` - User profile management

### Poll Routes
- `/polls` - Browse all accessible polls
- `/polls/create` - Create new poll form
- `/polls/[id]` - View specific poll and vote
- `/polls/[id]/edit` - Edit existing poll (owner only)

### API Routes
All data operations are handled through Next.js Server Actions rather than traditional API routes for improved security and performance.

## Type Definitions

The app uses TypeScript with comprehensive type definitions:

- `User` - User account information
- `Poll` - Poll data structure
- `PollOption` - Individual poll options
- `Vote` - Vote records
- `AuthState` - Authentication state

## Architecture Overview

### Core Architecture Patterns

- **Server Components**: Data fetching and rendering on the server for optimal performance
- **Server Actions**: Form submissions and mutations handled server-side for security
- **Context-based Auth**: React Context manages authentication state across the application
- **Type Safety**: Comprehensive TypeScript types ensure runtime safety

### Key Libraries and Their Roles

- **Next.js 15**: React framework with App Router for modern web development
- **Supabase**: Backend-as-a-Service providing database, auth, and real-time features
- **React Hook Form + Zod**: Client-side form validation with type-safe schemas
- **Shadcn/UI + Tailwind**: Modern, accessible component library with utility-first styling

## Future Enhancements

The application provides a solid foundation for polling functionality. Potential enhancements include:

- **Real-time Updates**: Live vote counting using Supabase real-time subscriptions
- **QR Code Generation**: Generate QR codes for easy poll sharing (library already included)
- **Poll Analytics**: Detailed voting patterns and user engagement metrics
- **Social Features**: Poll sharing, comments, and user interactions
- **Admin Dashboard**: Poll management and user administration tools
- **Advanced Poll Types**: Multiple choice, ranked choice, and conditional questions
- **Email Notifications**: Poll creation and result notifications
- **Poll Templates**: Pre-built poll structures for common use cases

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
