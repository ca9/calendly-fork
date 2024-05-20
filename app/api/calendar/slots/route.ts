import { NextRequest, NextResponse } from 'next/server';
import { getCalendar } from '@/lib/google';
import { addDays, eachDayOfInterval, startOfDay, endOfDay, eachMinuteOfInterval, addMinutes, isBefore, format } from 'date-fns';
import { calendar_v3 } from 'googleapis';
import { parse } from 'cookie';
// import { zonedTimeToUtc } from 'date-fns-tz';

const WORK_HOURS = { start: 10, end: 17 }; // Configurable work hours
const TIMEZONE = 'GMT'; // Default to GMT if not specified
const SLOT_DURATION_MINUTES = 30; // Configurable slot duration in minutes

function getTimezoneOffset(timezone: string): number {
    const match = timezone.match(/GMT([+-]\d{1,2})/);
    if (match) {
        return parseInt(match[1], 10);
    }
    return 0; // Default to GMT
}

export async function GET(req: NextRequest) {
    const cookieHeader = req.headers.get('cookie');
    // console.log('Cookie header:', cookieHeader);

    const cookies = parse(cookieHeader || '');
    // console.log('Parsed cookies:', cookies);

    const token = cookies.google_token;
    // console.log('Retrieved token from cookies:', token);

    const days = req.nextUrl.searchParams.get('days') || '14';
    const slot_duration_minutes = req.nextUrl.searchParams.get('duration') || SLOT_DURATION_MINUTES.toString();
    const startHour = req.nextUrl.searchParams.get('startHour') || WORK_HOURS.start.toString();
    const endHour = req.nextUrl.searchParams.get('endHour') || WORK_HOURS.end.toString();
    const timezone = req.nextUrl.searchParams.get('timezone') || TIMEZONE;

    const timezoneOffset = getTimezoneOffset(timezone);
    console.log(`Using timezone offset: GMT${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`);

    if (!token) {
        console.error('Token is missing');
        return NextResponse.redirect('/api/google/auth');
    }

    const parsedToken = JSON.parse(token);
    // console.log('Parsed token:', parsedToken);

    if (!parsedToken.access_token) {
        console.error('Invalid token');
        return NextResponse.redirect('/api/google/auth');
    }

    const calendar = await getCalendar(parsedToken);

    const today = new Date();
    const daysToCheck = eachDayOfInterval({
        start: today,
        end: addDays(today, parseInt(days)),
    });

    const slots: { start: Date; end: Date }[] = [];

    for (const day of daysToCheck) {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const events = await calendar.events.list({
            calendarId: 'primary',
            timeMin: dayStart.toISOString(),
            timeMax: dayEnd.toISOString(),
            timeZone: `GMT${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`,
        });

        const busyTimes = (events.data.items || []).map((event: calendar_v3.Schema$Event) => ({
            start: new Date(event.start?.dateTime || event.start?.date || ""),
            end: new Date(event.end?.dateTime || event.end?.date || ""),
            summary: event.summary,
            creator: event.creator,
            id: event.id
        }));

        // console.log("------------------------------------------------------------------------");
        // console.log("day")
        // console.log(day);
        // console.log("busy times")
        // console.log(busyTimes);

        const potentialSlots = eachMinuteOfInterval({
            start: addMinutes(startOfDay(day), parseInt(startHour) * 60),
            end: addMinutes(startOfDay(day), parseInt(endHour) * 60),
        }, { step: parseInt(slot_duration_minutes) });

        // console.log("possible slots");
        // console.log(potentialSlots);
        for (const slot of potentialSlots) {
            const slotEnd = addMinutes(slot, parseInt(slot_duration_minutes));

            if (busyTimes.every(({ start, end }) => isBefore(slotEnd, start) || isBefore(end, slot))) {
                slots.push({ start: slot, end: slotEnd });
            }
        }
        // console.log("filtered slots");
        // console.log(slots);
    }

    return NextResponse.json(slots);
}
