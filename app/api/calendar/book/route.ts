import { NextRequest, NextResponse } from 'next/server';
import { getCalendar } from '../../../../lib/google';

export async function POST(req: NextRequest) {
    const { start, end, title, description, invitees, token } = await req.json();
    const calendar = await getCalendar(JSON.parse(token));

    const event = {
        summary: title,
        description,
        start: {
            dateTime: start,
            timeZone: 'America/Los_Angeles', // Configurable timezone
        },
        end: {
            dateTime: end,
            timeZone: 'America/Los_Angeles',
        },
        attendees: invitees.split(',').map((email: string) => ({ email: email.trim() })),
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
