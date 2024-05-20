import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '../../../../lib/google';
import { serialize } from 'cookie';

export async function GET(req: NextRequest) {
    const client = getClient();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    console.log('Received code from Google:', code);

    const { tokens } = await client.getToken(code as string);

    console.log('Received tokens from Google:', tokens);

    const cookie = serialize('google_token', JSON.stringify(tokens), {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600 * 24 * 30,
    });

    console.log('Setting cookie:', cookie);

    return new NextResponse(null, {
        headers: {
            'Set-Cookie': cookie,
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            Location: '/'
        },
        status: 302,
    });
}
