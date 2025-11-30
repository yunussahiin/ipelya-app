import { NextResponse, type NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  // Simply pass through - authentication is handled at the page level
  // using getUser() instead of getSession() for security
  return NextResponse.next({ request: { headers: req.headers } });
}

export const config = {
  matcher: ["/ops/:path*"],
};
