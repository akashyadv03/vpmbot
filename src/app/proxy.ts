import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
    if (!req.nextUrl.pathname.startsWith("/admin")) {
        return NextResponse.next();
    }

    const secret = req.cookies.get("admin-secret")?.value; g

    if (secret !== process.env.ADMIN_SECRET) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
}
