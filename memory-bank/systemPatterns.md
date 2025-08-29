# System Patterns: Polling App Architecture

## Core Architecture Principles

### 1. **Server/Client Component Separation**
```
Server Components (Data Fetching)
├── app/page.tsx (Dashboard)
├── app/polls/page.tsx (Poll List)
├── components/dashboard/RecentPolls.tsx
└── components/dashboard/PollCardWrapper.tsx (Client Boundary)

Client Components (Interactive UI)
├── components/polls/PollCard.tsx (Main poll display)
├── components/polls/CreatePollForm.tsx (Form handling)
├── components/auth/* (Authentication)
└── components/ui/* (Reusable UI components)
```

### 2. **Data Flow Pattern**
```
User Action → Server Action → Database → UI Update → Toast Notification
```

### 3. **Component Composition Pattern**
```
PollCardWrapper (Server)
├── PollCard (Client)
│   ├── DropdownMenu (Client)
│   ├── Badge (Client)
│   └── Button (Client)
└── Data Transformation (Server)
```

## Key Technical Decisions

### 1. **Next.js App Router Architecture**

#### Server Components for Data Fetching
```typescript
// ✅ DO: Server components for initial data
export default async function PollsPage() {
  const result = await getPolls();
  return <PollCardWrapper polls={result.polls} />;
}
```

#### Client Components for Interactivity
```typescript
// ✅ DO: Client components with "use client" directive
"use client";
export function PollCard({ poll, onEdit, onDelete }: PollCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  // Interactive logic here
}
```

#### Server Actions for Mutations
```typescript
// ✅ DO: Server actions for data mutations
"use server";
export async function deletePoll(pollId: string) {
  // Database operations here
  revalidatePath("/polls");
}
```

### 2. **Component Variants Pattern**

#### Single Component, Multiple Displays
```typescript
type PollCardVariant = "default" | "compact" | "dashboard";

export function PollCard({ variant = "default" }: PollCardProps) {
  if (variant === "dashboard") {
    return <CompactLayout />;
  }
  return <FullLayout />;
}
```

#### Usage Across Pages
```typescript
// Dashboard - compact view
<PollCard variant="dashboard" showViewButton={false} />

// Polls page - full view
<PollCard variant="default" showViewButton={true} />
```

### 3. **Security Pattern: Owner-Only Actions**

#### Component-Level Authorization
```typescript
interface PollCardProps {
  poll: PollData;
  currentUserId?: string;
  onEdit?: (pollId: string) => void;
  onDelete?: (pollId: string) => void;
}

export function PollCard({ poll, currentUserId, onEdit, onDelete }: PollCardProps) {
  const isOwner = currentUserId && poll.created_by === currentUserId;

  if (!isOwner) return null; // Hide edit/delete options

  return (
    <DropdownMenu>
      <DropdownMenuItem onClick={() => onEdit?.(poll.id)}>
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onDelete?.(poll.id)}>
        Delete
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
```

#### Server-Level Authorization
```typescript
export async function deletePoll(pollId: string) {
  const { data: { user } } = await supabase.auth.getUser();

  // Verify ownership before deletion
  const { data: poll } = await supabase
    .from("polls")
    .select("created_by")
    .eq("id", pollId)
    .single();

  if (poll.created_by !== user.id) {
    throw new Error("Unauthorized");
  }

  // Proceed with deletion...
}
```

### 4. **Error Handling Pattern**

#### Toast Notification System
```typescript
// Client-side error handling
const { addToast } = useToast();

try {
  await deletePoll(pollId);
  addToast({
    title: "Success",
    description: "Poll deleted successfully",
    type: "success"
  });
} catch (error) {
  addToast({
    title: "Error",
    description: error.message,
    type: "error"
  });
}
```

#### Server Action Error Handling
```typescript
export async function deletePoll(pollId: string) {
  try {
    // Database operations...
    return { success: true };
  } catch (error) {
    console.error("Delete poll error:", error);
    return { error: "Failed to delete poll" };
  }
}
```

## Component Architecture Patterns

### 1. **Wrapper Component Pattern**

#### Server Wrapper for Data Fetching
```typescript
// RecentPolls.tsx (Server Component)
export async function RecentPolls() {
  const polls = await getPolls();
  return <PollCardWrapper polls={polls} />;
}

// PollCardWrapper.tsx (Client Component)
export function PollCardWrapper({ polls }: Props) {
  return (
    <div className="grid">
      {polls.map(poll => (
        <PollCard key={poll.id} poll={poll} />
      ))}
    </div>
  );
}
```

### 2. **Props Interface Pattern**

#### Consistent Data Structures
```typescript
interface PollData {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  is_public: boolean;
  created_by?: string;
  poll_options: PollOption[];
}

interface PollCardProps extends PollData {
  variant?: PollCardVariant;
  currentUserId?: string;
  onEdit?: (pollId: string) => void;
  onDelete?: (pollId: string) => void;
}
```

### 3. **Conditional Rendering Pattern**

#### Owner-Only Features
```typescript
{isOwner && (
  <DropdownMenu>
    <DropdownMenuItem onClick={handleEdit}>
      <Edit className="h-4 w-4 mr-2" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleDelete}>
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </DropdownMenuItem>
  </DropdownMenu>
)}
```

## Data Management Patterns

### 1. **Server State Pattern**

#### Server Components Fetch Data
```typescript
export default async function Dashboard() {
  const user = await getCurrentUser();
  const polls = await getRecentPolls();

  return (
    <div>
      <UserProfile user={user} />
      <RecentPolls polls={polls} />
    </div>
  );
}
```

### 2. **Optimistic Updates Pattern**

#### Immediate UI Feedback
```typescript
const [polls, setPolls] = useState(initialPolls);

const handleDelete = async (pollId: string) => {
  // Optimistic update
  setPolls(prev => prev.filter(p => p.id !== pollId));

  try {
    await deletePoll(pollId);
  } catch (error) {
    // Revert on error
    setPolls(initialPolls);
    addToast({ title: "Error", type: "error" });
  }
};
```

## UI/UX Patterns

### 1. **Loading States Pattern**

#### Skeleton Loading
```typescript
{isLoading ? (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
  </div>
) : (
  <div>Content loaded</div>
)}
```

### 2. **Responsive Design Pattern**

#### Mobile-First Grid
```typescript
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Cards adapt to screen size */}
</div>
```

### 3. **Accessibility Pattern**

#### Semantic HTML and ARIA
```typescript
<button
  aria-label="Delete poll"
  onClick={handleDelete}
  disabled={isDeleting}
>
  {isDeleting ? "Deleting..." : "Delete"}
</button>
```

## Testing Patterns

### 1. **Component Testing Pattern**

#### Test Component Behavior
```typescript
describe("PollCard", () => {
  it("shows edit button for poll owner", () => {
    render(<PollCard poll={poll} currentUserId={ownerId} />);
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("hides edit button for non-owner", () => {
    render(<PollCard poll={poll} currentUserId={otherUserId} />);
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });
});
```

## Performance Patterns

### 1. **Server-Side Rendering Pattern**

#### Static Generation Where Possible
```typescript
// Use static generation for public pages
export const dynamic = 'force-static';

export default function PublicPollsPage() {
  // This page can be statically generated
}
```

### 2. **Image Optimization Pattern**

#### Next.js Image Component
```typescript
import Image from 'next/image';

<Image
  src={pollImage}
  alt={poll.title}
  width={400}
  height={300}
  className="rounded-lg"
/>
```

## Deployment Patterns

### 1. **Environment Configuration Pattern**

#### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
```

### 2. **Build Optimization Pattern**

#### Bundle Analysis
```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Next.js config
});
```

## Monitoring Patterns

### 1. **Error Tracking Pattern**

#### Global Error Boundary
```typescript
// app/error.tsx
export default function Error({ error, reset }: ErrorProps) {
  // Log error to monitoring service
  console.error(error);

  return (
    <div>
      <h1>Something went wrong</h1>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### 2. **Performance Monitoring Pattern**

#### Web Vitals Tracking
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

This comprehensive pattern library ensures consistent, maintainable, and scalable code across the entire polling application.
