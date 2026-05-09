import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service_role key
// This bypasses RLS and has full access to all tables
// ONLY use in API routes (server-side), NEVER expose to client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default supabaseAdmin
