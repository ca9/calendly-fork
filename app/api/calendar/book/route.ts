import { NextRequest, NextResponse } from 'next/server';
import { getCalendar } from '../../../../lib/google';
import {validateToken} from "@/lib/token";

export async function POST(req: NextRequest) {
    const parsedToken = await validateToken(req);
    if (!parsedToken) return;
    const calendar = await getCalendar(parsedToken);

    console.log(parsedToken);
    console.log(calendar);

    const { start, end, title, description, invitees } = await req.json();
    console.log(title);

    // const calendar = await getCalendar(JSON.parse(token));

    const event = {
        summary: title,
        description,
        start: {
            dateTime: start,
            // timeZone: 'America/Los_Angeles', // Configurable timezone
        },
        end: {
            dateTime: end,
            // timeZone: 'America/Los_Angeles',
        },
        attendees: invitees?.split(',').map((email: string) => ({ email: email.trim() })),
    };

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
        });
        return NextResponse.json({ message: 'Event created successfully', event: response.data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
    }
}
