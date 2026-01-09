import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
    const { pathname, searchParams } = req.nextUrl;

    // Protect only /admin routes
    if (!pathname.startsWith("/admin")) {
        return NextResponse.next();
    }

    const cookieSecret = req.cookies.get("admin-secret")?.value;
    const urlSecret = searchParams.get("key");

    // ✅ Already authenticated via cookie
    if (cookieSecret === process.env.ADMIN_SECRET) {
        return NextResponse.next();
    }

    // ✅ First-time access using magic URL
    if (urlSecret === process.env.ADMIN_SECRET) {
        const res = NextResponse.redirect(new URL("/admin", req.url));

        res.cookies.set("admin-secret", process.env.ADMIN_SECRET!, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        return res;
    }

    // ❌ Unauthorized access
    return NextResponse.redirect(new URL("/", req.url));
}

/**
 * Apply middleware only to /admin routes
 */
export const config = {
    matcher: ["/admin/:path*"],
};
