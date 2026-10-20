import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * Django calls this on publish/update so ISR pages refresh immediately.
 * Authenticated with a shared secret (REVALIDATE_SECRET).
 */
export async function POST(req: NextRequest) {
  let body: { secret?: string; paths?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  if (!body.secret || body.secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const paths = Array.isArray(body.paths) ? body.paths : [];
  for (const path of paths) {
    revalidatePath(path);
  }
  return NextResponse.json({ ok: true, revalidated: paths });
}
