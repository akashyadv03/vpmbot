import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
    const { pathname, searchParams } = req.nextUrl;

    // Protect only /admin routes
    if (!pathname.startsWith("/admin")) {
        return NextResponse.next();
    }

    const cookieSecret = req.cookies.get("admin-secret")?.value;
    const urlSecret = searchParams.get("key");
    const ADMIN_SECRET = process.env.ADMIN_SECRET;
    console.log("Admin secret from cookie:", cookieSecret);
    if (cookieSecret === ADMIN_SECRET) {
        return NextResponse.next();
    }

    // Magic URL login
    if (urlSecret === ADMIN_SECRET) {
        const res = NextResponse.redirect(new URL("/admin", req.url));

        res.cookies.set("admin-secret", ADMIN_SECRET!, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24, // 30 days
        });

        return res;
    }

    // Unauthorized
    return NextResponse.redirect(new URL("/", req.url));

}
