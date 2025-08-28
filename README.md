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
│   ├── [id]/           # Individual poll view (dynamic route)
│   ├── create/         # Poll creation page
│   └── page.tsx        # Polls listing page
├── globals.css         # Global styles and Tailwind imports
├── layout.tsx          # Root layout
└── page.tsx            # Landing/home page

components/
├── ui/                 # Shadcn UI components
├── auth/               # Authentication-related components
└── polls/              # Poll-related components

types/
└── index.ts           # TypeScript type definitions

lib/
└── utils.ts           # Utility functions
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

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Key Routes

- `/` - Landing page with navigation
- `/auth/login` - User login
- `/auth/signup` - User registration
- `/auth/profile` - User profile
- `/polls` - Browse all polls
- `/polls/create` - Create new poll
- `/polls/[id]` - View specific poll

## Type Definitions

The app uses TypeScript with comprehensive type definitions:

- `User` - User account information
- `Poll` - Poll data structure
- `PollOption` - Individual poll options
- `Vote` - Vote records
- `AuthState` - Authentication state

## Next Steps

This scaffold provides the foundation for a complete polling application. Future enhancements could include:

- Database integration (PostgreSQL, MongoDB)
- Real-time updates with WebSockets
- User authentication with JWT/Auth0
- Poll analytics and insights
- Social features (sharing, comments)
- Admin dashboard
- API routes for CRUD operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
