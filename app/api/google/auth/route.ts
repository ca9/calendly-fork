// app/api/google/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google';

export async function GET(req: NextRequest) {
    return NextResponse.redirect(getAuthUrl());
}
