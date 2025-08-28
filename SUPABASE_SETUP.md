# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project" and fill in your project details
3. Wait for the project to be fully initialized

## 2. Get Your Project Credentials

1. Go to your project's dashboard
2. Navigate to "Settings" → "API"
3. Copy your project URL and anon key

## 3. Set Up Environment Variables

Create a `.env.local` file in your project root with the following:

```bash
# Your Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url-here

# Your Supabase anonymous key (safe to expose in client-side code)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

Replace `your-supabase-url-here` and `your-supabase-anon-key-here` with your actual values.

## 4. Configure Authentication

### Enable Email Authentication
1. In your Supabase dashboard, go to "Authentication" → "Providers"
2. Make sure "Email" is enabled
3. Configure the site URL (your development/production URL)
4. Set up any additional authentication methods if desired

### Configure Redirect URLs
1. In "Authentication" → "URL Configuration"
2. Add your development URL (e.g., `http://localhost:3000`)
3. Add your production URL when deploying

## 5. Test the Setup

1. Start your development server: `npm run dev`
2. Try signing up with a new account
3. Check your email for the verification link
4. Try signing in with existing credentials

## 6. Database Schema (Optional)

If you want to store additional user data, you can create tables in Supabase:

```sql
-- Example: User profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 7. Security Notes

- Never commit your `.env.local` file to version control
- The `NEXT_PUBLIC_` prefix makes variables available in the browser
- Keep your service role key (if used) server-side only
- Regularly rotate your keys if compromised

## Troubleshooting

### Common Issues:

1. **"Invalid API key" error**
   - Check that your environment variables are correctly set
   - Make sure you're using the correct project URL and anon key

2. **Email not being sent**
   - Check your Supabase email settings
   - Verify that email authentication is enabled

3. **CORS errors**
   - Add your development and production URLs to the allowed origins in Supabase

4. **Authentication not working**
   - Check browser console for errors
   - Verify middleware is configured correctly
   - Check that your Supabase URL includes the protocol (https://)

### Getting Help:

- Check the [Supabase documentation](https://supabase.com/docs)
- Look at the [Next.js with Supabase guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- Check the browser developer tools for detailed error messages
