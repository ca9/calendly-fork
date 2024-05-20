import { format } from 'date-fns';

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

export const groupByDay = (slots: Slot[], busyTimes: BusyTime[]) => {
    const grouped: { [key: string]: { date: Date; slots: Slot[]; events: BusyTime[] } } = {};

    slots.forEach(slot => {
        const dayKey = format(slot.start, 'yyyy-MM-dd');
        if (!grouped[dayKey]) {
            grouped[dayKey] = { date: slot.start, slots: [], events: [] };
        }
        grouped[dayKey].slots.push(slot);
    });

    busyTimes.forEach(event => {
        const dayKey = format(event.start, 'yyyy-MM-dd');
        if (!grouped[dayKey]) {
            grouped[dayKey] = { date: event.start, slots: [], events: [] };
        }
        grouped[dayKey].events.push(event);
    });

    return Object.values(grouped);
};
