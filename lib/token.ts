// lib/token.ts
import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'cookie';

export async function validateToken(req: NextRequest) {
    const cookieHeader = req.headers.get('cookie');
    const cookies = parse(cookieHeader || '');
    const token = cookies.google_token;

    if (!token) {
        console.error('Token is missing');
        return NextResponse.redirect('/api/google/auth');
    }

    const parsedToken = JSON.parse(token);

    if (!parsedToken.access_token) {
        console.error('Invalid token');
        return NextResponse.redirect('/api/google/auth');
    }

    return parsedToken;
}
