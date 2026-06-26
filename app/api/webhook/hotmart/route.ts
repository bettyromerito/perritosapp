import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabaseAdmin";

export async function POST(req: NextRequest) {
  // Headers are case-insensitive per HTTP spec; Next.js normalizes to lowercase
  const token =
    req.headers.get("x-hotmart-hottoken") ??
    req.headers.get("X-Hotmart-HotToken") ??
    req.headers.get("X-Hotmart-Hottoken");

  const expectedToken = process.env.HOTMART_TOKEN;

  if (!expectedToken) {
    console.error("[webhook] HOTMART_TOKEN env var is not defined — check Vercel environment variables");
  }

  console.log("[webhook] received token:", token ? "present" : "missing");
  console.log("[webhook] expected token:", expectedToken ? "defined" : "UNDEFINED");

  if (!expectedToken || token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  console.log("[webhook] event:", body.event);

  if (body.event === "PURCHASE_APPROVED") {
    const email: string = body.data?.buyer?.email;
    const name: string = body.data?.buyer?.name;

    console.log("[webhook] PURCHASE_APPROVED →", { email, name });

    try {
      const { error } = await getSupabaseAdmin().auth.admin.inviteUserByEmail(email);
      if (error) {
        console.error("[webhook] Error inviting user:", error.message);
      } else {
        console.log("[webhook] Invitation sent to:", email);
      }
    } catch (err) {
      console.error("[webhook] Unexpected error:", err);
    }
  }

  // Always return 200 so Hotmart does not retry the webhook
  return NextResponse.json({ received: true }, { status: 200 });
}
