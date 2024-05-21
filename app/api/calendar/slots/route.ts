import { NextRequest, NextResponse } from 'next/server';
import { getCalendar } from '@/lib/google';
import { addDays, eachDayOfInterval, startOfDay, endOfDay, eachMinuteOfInterval, addMinutes, isBefore, isAfter, isValid } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { calendar_v3 } from 'googleapis';
import { validateToken } from '@/lib/token';

const SLOT_DURATION_MINUTES = 30; // Default slot duration

export async function GET(req: NextRequest) {
    const parsedToken = await validateToken(req);
    if (!parsedToken) return;

    const days = parseInt(req.nextUrl.searchParams.get('days') || '14');
    const slotDurationMinutes = parseInt(req.nextUrl.searchParams.get('duration') || SLOT_DURATION_MINUTES.toString());
    const startHour = parseInt(req.nextUrl.searchParams.get('startHour') || '10');
    const endHour = parseInt(req.nextUrl.searchParams.get('endHour') || '17');
    const timezone = req.nextUrl.searchParams.get('timezone') || '+00:00';

    const calendar = await getCalendar(parsedToken);
    const today = new Date();
    const daysToCheck = eachDayOfInterval({
        start: today,
        end: addDays(today, days),
    });

    const slots: { start: Date; end: Date }[] = [];
    const busyTimes: { start: Date; end: Date; summary: string; description: string; creator: any; id: string; }[] = [];

    for (const day of daysToCheck) {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const zonedDayStart = toZonedTime(dayStart, timezone);
        const zonedDayEnd = toZonedTime(dayEnd, timezone);

        // console.log(`Day Start: ${zonedDayStart}`);
        // console.log(`Day End: ${zonedDayEnd}`);

        try {
            const events = await calendar.events.list({
                calendarId: 'primary',
                timeMin: zonedDayStart.toISOString(),
                timeMax: zonedDayEnd.toISOString(),
                timeZone: timezone,
            });

            const eventsList = (events.data.items || []).map((event: calendar_v3.Schema$Event) => ({
                start: toZonedTime(new Date(event.start?.dateTime || event.start?.date || ""), timezone),
                end: toZonedTime(new Date(event.end?.dateTime || event.end?.date || ""), timezone),
                summary: event.summary || '',
                description: event.description || '',
                creator: event.creator || {},
                id: event.id || ''
            })).filter(event => isValid(event.start) && isValid(event.end));

            busyTimes.push(...eventsList);

            const potentialSlots = eachMinuteOfInterval({
                start: addMinutes(startOfDay(day), startHour * 60),
                end: addMinutes(startOfDay(day), endHour * 60),
            }, { step: slotDurationMinutes }).map(slot => ({
                start: toZonedTime(slot, timezone),
                end: toZonedTime(addMinutes(slot, slotDurationMinutes), timezone),
            }));

            for (const slot of potentialSlots) {
                const slotEnd = addMinutes(slot.start, slotDurationMinutes);
                if (eventsList.every(({ start, end }) => isBefore(slotEnd, start) || isAfter(slot.start, end))) {
                    slots.push({ start: slot.start, end: slot.end });
                }
            }
        } catch (error) {
            console.error('Error fetching events', error);
        }
    }

    return NextResponse.json({ slots, busyTimes });
}
