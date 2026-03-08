import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify the calling user is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.error("getClaims failed:", claimsError?.message || "no sub claim");
      // Fallback to getUser with token
      const { data: { user: fallbackUser }, error: userError } = await userClient.auth.getUser(token);
      if (userError || !fallbackUser) {
        console.error("getUser fallback also failed:", userError?.message);
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      var callingUserId = fallbackUser.id;
    } else {
      var callingUserId = claimsData.claims.sub as string;
    }

    console.log("Authenticated user:", callingUserId);

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUserId)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Only admins can manage staff" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action, email, password, full_name, staff_user_id, phone, company } = await req.json();
    console.log("Action:", action);

    if (action === "create") {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await supabaseAdmin
        .from("user_roles")
        .update({ role: "staff", admin_id: callingUserId })
        .eq("user_id", newUser.user!.id);

      await supabaseAdmin
        .from("profiles")
        .update({ full_name: full_name || "" })
        .eq("id", newUser.user!.id);

      return new Response(JSON.stringify({ success: true, user_id: newUser.user!.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update") {
      if (!staff_user_id) {
        return new Response(JSON.stringify({ error: "staff_user_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: staffRole } = await supabaseAdmin
        .from("user_roles")
        .select("*")
        .eq("user_id", staff_user_id)
        .eq("admin_id", callingUserId)
        .eq("role", "staff")
        .single();

      if (!staffRole) {
        return new Response(JSON.stringify({ error: "Staff not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const profileUpdates: Record<string, string> = {};
      if (full_name !== undefined) profileUpdates.full_name = full_name;
      if (phone !== undefined) profileUpdates.phone = phone;
      if (company !== undefined) profileUpdates.company = company;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update(profileUpdates)
          .eq("id", staff_user_id);

        if (profileError) {
          return new Response(JSON.stringify({ error: profileError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }

      if (email) {
        const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(staff_user_id, { email });
        if (emailError) {
          return new Response(JSON.stringify({ error: emailError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        await supabaseAdmin.from("profiles").update({ email }).eq("id", staff_user_id);
      }

      if (password) {
        const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(staff_user_id, { password });
        if (pwError) {
          return new Response(JSON.stringify({ error: pwError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "delete") {
      const { data: staffRole } = await supabaseAdmin
        .from("user_roles")
        .select("*")
        .eq("user_id", staff_user_id)
        .eq("admin_id", callingUserId)
        .eq("role", "staff")
        .single();

      if (!staffRole) {
        return new Response(JSON.stringify({ error: "Staff not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(staff_user_id);
      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Unhandled error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
