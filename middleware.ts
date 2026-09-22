import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const protectedPath = path.startsWith("/dashboard") || path.startsWith("/assistant") || path.startsWith("/owner");

  if (protectedPath && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (path.startsWith("/owner") && user) {
    const owners = [
      "danielngozi924@gmail.com",
      "dannyyoungofficial1@gmail.com",
      "zenixmindai@gmail.com",
      "dannyyoungofficail2@gmail.com",
    ];
    if (!owners.includes((user.email || "").toLowerCase())) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = { matcher: ["/dashboard/:path*", "/owner/:path*", "/assistant/:path*"] };
