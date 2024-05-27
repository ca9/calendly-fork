// app/api/email/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {parse} from 'cookie';

export async function GET(req: NextRequest) {
    const cookie = req.headers.get('cookie');

    if (!cookie) {
        return NextResponse.json({message: 'No cookie found'}, {status: 401});
    }

    const cookies = parse(cookie);
    const token = cookies.google_token ? JSON.parse(cookies.google_token) : null;

    if (!token) {
        return NextResponse.json({message: 'No token found in cookie'}, {status: 401});
    }

    try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${token.access_token}`,
            },
        });

        if (!userInfoResponse.ok) {
            if (userInfoResponse.status == 401) {
                return NextResponse.json({message: 'Failed fetch user info'}, {status: 401});
            }
            throw new Error('Failed to fetch user info');
        }

        const userInfo = await userInfoResponse.json();
        if (userInfo.email) {
            return NextResponse.json({email: userInfo.email}, {status: 200});
        } else {
            return NextResponse.json({message: 'No email found in user info'}, {status: 401});
        }

    } catch (error) {
        console.error('Error fetching user info:', error);
        return NextResponse.json({message: 'Error fetching user info'}, {status: 500});
    }
}
