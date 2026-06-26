import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabaseAdmin";

export async function POST(req: NextRequest) {
  // Log every header so we can see the exact name Hotmart uses in Vercel logs
  const allHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    allHeaders[key] = value;
  });
  console.log("[webhook] incoming headers:", JSON.stringify(allHeaders));

  const expectedToken = process.env.HOTMART_TOKEN;
  if (!expectedToken) {
    console.error("[webhook] HOTMART_TOKEN is not defined in environment variables");
  }

  // Try every known variation of the Hotmart token header
  const token =
    req.headers.get("x-hotmart-hottok") ??
    req.headers.get("x-hotmart-hottoken") ??
    req.headers.get("hottok") ??
    null;

  console.log("[webhook] token received:", token ?? "NONE");
  console.log("[webhook] token expected:", expectedToken ? "SET" : "NOT SET");

  if (!expectedToken || token !== expectedToken) {
    console.error("[webhook] 401 — token mismatch or missing");
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
      console.error("[webhook] Unexpected error calling Supabase:", err);
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
