import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create a Supabase client with the request's cookies
  // This is necessary to ensure that the session is updated correctly
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  if (request.nextUrl.pathname === "/signin" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard"; // Redirect to dashboard if user is already signed in
    return NextResponse.redirect(url);
  }


  // if (!user && !request.nextUrl.pathname.startsWith("/signin")) {
  //   // no user, potentially respond by redirecting the user to the login page
  //   const url = request.nextUrl.clone();
  //   url.pathname = "/signin";
  //   return NextResponse.redirect(url);
  // }

  // if (
  //   user &&
  //   (request.nextUrl.pathname.startsWith("/select") ||
  //     request.nextUrl.pathname.startsWith("/dashboard"))
  // ) {
  //   try {
  //     const res = await fetch(
  //       new URL("/api/subscription-status", request.url),
  //       { headers: { cookie: request.headers.get("cookie") || "" } }
  //     );
  //     const { active } = await res.json();

  //     if (!active) {
  //       const url = request.nextUrl.clone();
  //       url.pathname = "/subscribe";
  //       return NextResponse.redirect(url);
  //     }
  //   } catch (error) {
  //     console.error("Subscription check failed:", error);
  //     const url = request.nextUrl.clone();
  //     url.pathname = "/subscribe";
  //     return NextResponse.redirect(url);
  //   }
  // }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}