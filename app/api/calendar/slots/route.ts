import { NextRequest, NextResponse } from 'next/server';
import { getCalendar } from '@/lib/google';
import { addDays, eachDayOfInterval, startOfDay, endOfDay, eachMinuteOfInterval, addMinutes, isBefore, isValid } from 'date-fns';
import { calendar_v3 } from 'googleapis';
import { validateToken } from '@/lib/token';

const DEFAULT_WORK_HOURS = { start: 10, end: 17 };
const DEFAULT_TIMEZONE = 'GMT';
const DEFAULT_SLOT_DURATION_MINUTES = 30;

function getTimezoneOffset(timezone: string): number {
    const match = timezone.match(/GMT([+-]\d{1,2})/);
    if (match) {
        return parseInt(match[1], 10);
    }
    return 0;
}

export async function GET(req: NextRequest) {
    const parsedToken = await validateToken(req);
    if (!parsedToken) return;

    const days = req.nextUrl.searchParams.get('days') || '14';
    const slotDurationMinutes = parseInt(req.nextUrl.searchParams.get('duration') || DEFAULT_SLOT_DURATION_MINUTES.toString());
    const startHour = parseInt(req.nextUrl.searchParams.get('startHour') || DEFAULT_WORK_HOURS.start.toString());
    const endHour = parseInt(req.nextUrl.searchParams.get('endHour') || DEFAULT_WORK_HOURS.end.toString());
    const timezone = req.nextUrl.searchParams.get('timezone') || DEFAULT_TIMEZONE;
    const timezoneOffset = getTimezoneOffset(timezone);

    const calendar = await getCalendar(parsedToken);
    const today = new Date();
    const daysToCheck = eachDayOfInterval({
        start: today,
        end: addDays(today, parseInt(days)),
    });

    const slots: { start: Date; end: Date; timezone: string }[] = [];
    const busyTimes: { start: Date; end: Date; summary: string; description: string; creator: any; id: string; timezone: string }[] = [];

    for (const day of daysToCheck) {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const events = await calendar.events.list({
            calendarId: 'primary',
            timeMin: dayStart.toISOString(),
            timeMax: dayEnd.toISOString(),
            timeZone: `GMT${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`,
        });

        const eventsList = (events.data.items || []).map((event: calendar_v3.Schema$Event) => ({
            start: new Date(event.start?.dateTime || event.start?.date || ""),
            end: new Date(event.end?.dateTime || event.end?.date || ""),
            summary: event.summary || '',
            description: event.description || '',
            creator: event.creator || {},
            id: event.id || '',
            timezone: event.start?.timeZone || timezone
        })).filter(event => isValid(event.start) && isValid(event.end));

        busyTimes.push(...eventsList);

        const potentialSlots = eachMinuteOfInterval({
            start: addMinutes(startOfDay(day), startHour * 60),
            end: addMinutes(startOfDay(day), endHour * 60),
        }, { step: slotDurationMinutes });

        // if (day.getDate() === 24 && day.getMonth() === 4) {
        //     console.log('Day Start:', dayStart.toISOString());
        //     console.log('Day End:', dayEnd.toISOString());
        //     console.log('Potential Slots:', potentialSlots);
        //     console.log('Events:', eventsList);
        // }

        for (const slot of potentialSlots) {
            const slotEnd = addMinutes(slot, slotDurationMinutes);
            if (eventsList.every(({ start, end }) => isBefore(slotEnd, start) || isBefore(end, slot))) {
                // if (day.getDate() === 24 && day.getMonth() === 4) {
                //     console.log({ start: slot, end: slotEnd });
                // }
                slots.push({ start: slot, end: slotEnd, timezone });
            }
        }
    }

    return NextResponse.json({ slots, busyTimes });
}
