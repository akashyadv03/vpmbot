import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Protect only /admin routes
    if (!pathname.startsWith("/admin")) {
        return NextResponse.next();
    }

    const secret = req.cookies.get("admin-secret")?.value;
    console.log("Admin secret from cookie:", secret);

    // Redirect when the cookie is missing or doesn't match the server secret
    if (!secret || secret !== process.env.ADMIN_SECRET) {
        console.log("Unauthorized access attempt");
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
}
