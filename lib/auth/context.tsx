"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

/**
 * Represents an authentication error with a descriptive message.
 */
interface AuthError {
  message: string;
}

/**
 * Type definition for the authentication context.
 *
 * This interface defines all the authentication-related state and methods
 * that are available throughout the application via React Context.
 */
interface AuthContextType {
  /** Currently authenticated user object, or null if not authenticated */
  user: User | null;
  /** Current session object containing user and access tokens */
  session: Session | null;
  /** Loading state during authentication operations */
  loading: boolean;
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  /** Register a new user account */
  signUp: (email: string, password: string, name?: string) => Promise<{ error: AuthError | null }>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Initiate password reset for an email address */
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

/**
 * React Context for managing authentication state throughout the application.
 *
 * This context is created but not directly exported - components should use the
 * AuthProvider component and useAuth hook instead.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component.
 *
 * This component wraps the application and provides authentication state and methods
 * to all child components through React Context. It handles:
 * - Initial session loading and restoration
 * - Real-time authentication state updates
 * - Authentication method implementations
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {JSX.Element} Context provider wrapping children
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Authentication state management
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize authentication state on component mount
    // This handles page refreshes and direct URL access
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Set up real-time listener for authentication state changes
    // This handles login/logout events from other tabs/windows
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup subscription on component unmount
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Signs in a user with email and password.
   *
   * This method uses Supabase's built-in authentication to verify credentials
   * and establish a user session. On success, the auth state will automatically
   * update through the onAuthStateChange listener.
   *
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<{error: AuthError | null}>} Authentication result
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  /**
   * Registers a new user account with email, password, and optional name.
   *
   * Creates a new user account in Supabase Auth. If no name is provided,
   * it defaults to the part of the email before the @ symbol.
   * The user will need to verify their email before the account is active.
   *
   * @param {string} email - User's email address for registration
   * @param {string} password - User's chosen password
   * @param {string} [name] - Optional display name for the user
   * @returns {Promise<{error: AuthError | null}>} Registration result
   */
  const signUp = async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          // Use provided name or extract from email as fallback
          name: name || email.split('@')[0],
        },
      },
    });
    return { error };
  };

  /**
   * Signs out the currently authenticated user.
   *
   * This method clears the user's session and triggers the auth state change
   * listener to update the application state accordingly.
   *
   * @returns {Promise<void>} Completes when sign out is finished
   */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  /**
   * Initiates a password reset flow for the given email address.
   *
   * Sends a password reset email to the user with a link that redirects
   * back to the application's password reset page.
   *
   * @param {string} email - Email address to send reset link to
   * @returns {Promise<{error: AuthError | null}>} Password reset initiation result
   */
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  // Context value object containing all auth state and methods
  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook for accessing authentication context.
 *
 * This hook provides access to the authentication state and methods throughout
 * the application. It must be used within a component that is wrapped by
 * the AuthProvider component higher up in the component tree.
 *
 * @returns {AuthContextType} Authentication context with user state and methods
 * @throws {Error} If used outside of an AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, signIn, signOut } = useAuth();
 *
 *   if (user) {
 *     return <button onClick={signOut}>Sign Out</button>;
 *   }
 *
 *   return <button onClick={() => signIn(email, password)}>Sign In</button>;
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
