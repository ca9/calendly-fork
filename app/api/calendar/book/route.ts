// app/api/calendar/route.ts
import { google } from 'googleapis';
import { validateToken } from '@/lib/token';
import { Event } from '@/lib/slot_utilities';
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const parsedToken = await validateToken(req);
    if (!parsedToken) {
        return new NextResponse(JSON.stringify({ message: 'Invalid token' }), { status: 401 });
    }

    const body = await req.json();
    console.log(body);

    const {
        summary,
        description,
        attendees = body.guests,
        start,
        end
    } = body as Event;

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(parsedToken);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event: Event = {
        summary,
        description,
        start: new Date(start),
        end: new Date(end),
        attendees: attendees || [],
        color: 'blue' // Default color, modify if needed
    };

    if (!event.attendees?.includes(body?.email)) {
        event.attendees?.push(body?.email);
    }

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary: event.summary,
                description: event.description,
                start: { dateTime: event.start.toISOString() },
                end: { dateTime: event.end.toISOString() },
                attendees: event.attendees?.filter(email => email).map(email => ({ email })),
            },
        });

        return new NextResponse(JSON.stringify(response.data), { status: 200 });
    } catch (error) {
        console.error('Error creating event:', error);
        return new NextResponse(JSON.stringify({ message: 'Error creating event', error }), { status: 500 });
    }
}
