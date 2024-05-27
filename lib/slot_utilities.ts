import { format, parseISO, isBefore } from 'date-fns';
import moment from 'moment-timezone';

export interface Event {
    id?: string;
    summary: string;
    description?: string;
    calendar?: string;
    color: 'green' | 'red' | 'blue' | 'yellow' | 'orange';
    start: Date;
    end: Date;
    attendees?: string[];
}

export interface Slot {
    start: Date;
    end: Date;
}

export interface BusyTime {
    start: Date;
    end: Date;
    summary: string;
    description: string;
    creator: any;
    id: string;
}

export const validateWorkingHours = (start: number, end: number) => {
    return start < end;
};


export const groupByDay = (slots: Slot[], busyTimes: BusyTime[]) => {
    const now = new Date();
    const grouped: { [key: string]: { date: Date; items: (Slot | BusyTime)[] } } = {};

    slots.forEach(slot => {
        if (isBefore(now, slot.start)) {
            const dayKey = format(slot.start, 'yyyy-MM-dd');
            if (!grouped[dayKey]) {
                grouped[dayKey] = { date: slot.start, items: [] };
            }
            grouped[dayKey].items.push(slot);
        }
    });

    busyTimes.forEach(event => {
        if (isBefore(now, event.start)) {
            const dayKey = format(event.start, 'yyyy-MM-dd');
            if (!grouped[dayKey]) {
                grouped[dayKey] = { date: event.start, items: [] };
            }
            grouped[dayKey].items.push(event);
        }
    });

    // Sort items within each day
    Object.values(grouped).forEach(group => {
        group.items.sort((a, b) => a.start.getTime() - b.start.getTime());
    });

    // Sort the grouped dates
    const sortedGrouped = Object.values(grouped).sort((a, b) => a.date.getTime() - b.date.getTime());

    return sortedGrouped;
};



export interface TimezoneOption {
    value: string;
    label: string;
    offset: string;
    locations: string;
}


export function getTimezones(): TimezoneOption[] {
    const timezones = moment.tz.names();
    const timezoneMap: { [key: string]: string[] } = {};

    timezones.forEach(tz => {
        const offset = moment.tz(tz).format('Z');
        if (!timezoneMap[offset]) {
            timezoneMap[offset] = [];
        }
        timezoneMap[offset].push(tz);
    });

    const formattedTimezones: TimezoneOption[] = Object.entries(timezoneMap).map(([offset, locations]) => ({
        value: offset,
        label: `${offset} - ${locations.join(', ')}`,
        offset,
        locations: locations.join(', ')
    }));

    return formattedTimezones;
}
