import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Single browser-side Supabase client — handles auth, DB, and storage directly.
// Auth sessions are persisted automatically in localStorage under 'polish_auth'.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "polish_auth",
  },
})

/** Convenience: get the current session's user, or null if not signed in. */
export async function getSessionUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user ?? null
}

/** Sign out and clear local user cache. */
export async function signOut() {
  await supabase.auth.signOut()
  localStorage.removeItem("polish_user")
}
