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
    const grouped: { [key: string]: { date: Date; items: (Slot | BusyTime)[] } } = {};

    slots.forEach(slot => {
        const dayKey = format(slot.start, 'yyyy-MM-dd');
        if (!grouped[dayKey]) {
            grouped[dayKey] = { date: slot.start, items: [] };
        }
        grouped[dayKey].items.push(slot);
    });

    busyTimes.forEach(event => {
        const dayKey = format(event.start, 'yyyy-MM-dd');
        if (!grouped[dayKey]) {
            grouped[dayKey] = { date: event.start, items: [] };
        }
        grouped[dayKey].items.push(event);
    });

    // Sort items within each day
    Object.values(grouped).forEach(group => {
        group.items.sort((a, b) => a.start.getTime() - b.start.getTime());
    });

    return Object.values(grouped);
};
