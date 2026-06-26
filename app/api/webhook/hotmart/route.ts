import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabaseAdmin";

export async function POST(req: NextRequest) {
  const token = req.headers.get("X-Hotmart-Hottoken");

  if (token !== process.env.HOTMART_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (body.event === "PURCHASE_APPROVED") {
    const email: string = body.data?.buyer?.email;
    const name: string = body.data?.buyer?.name;

    console.log("PURCHASE_APPROVED →", { email, name });

    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

    if (error) {
      console.error("Error inviting user:", error.message);
    }
  }

  // Always return 200 so Hotmart does not retry the webhook
  return NextResponse.json({ received: true }, { status: 200 });
}
