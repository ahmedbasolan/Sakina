/**
 * Edge Function: delete-account
 *
 * Called by the authenticated user from within the app when they want to
 * permanently delete their account. This cannot be done from the client
 * directly — admin.deleteUser() requires the service_role key, which must
 * never leave the server.
 *
 * Security model:
 * - The incoming JWT (Authorization header) proves who the caller is.
 * - We extract their user ID from the verified token — NOT from a request body.
 * - We only delete the caller's own account, nothing else.
 * - Supabase CASCADE handles all child rows automatically.
 *
 * Deploy: supabase functions deploy delete-account
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // 1. Verify the caller's JWT and extract their user ID.
  //    We use the anon key client here so JWT verification is automatic.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Missing authorization header', { status: 401 });
  }

  const supabaseUserClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
  if (userError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Delete the account using the service_role admin client.
  //    This cascades to user_profiles, user_history, and user_path_progress.
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('[delete-account] Failed to delete user:', deleteError.message);
    return new Response('Failed to delete account', { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
