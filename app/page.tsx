'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Slot, BusyTime, groupByDay } from '@/lib/slot_utilities';

export default function Home(): JSX.Element {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [busyTimes, setBusyTimes] = useState<BusyTime[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredSlots, setFilteredSlots] = useState<Slot[]>([]);
    const [filteredBusyTimes, setFilteredBusyTimes] = useState<BusyTime[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchSlots = async () => {
            try {
                const { data } = await axios.get('/api/calendar/slots');
                const parsedSlots = data.slots.map((slot: any) => ({
                    ...slot,
                    start: new Date(slot.start),
                    end: new Date(slot.end),
                }));
                const parsedBusyTimes = data.busyTimes.map((event: any) => ({
                    ...event,
                    start: new Date(event.start),
                    end: new Date(event.end),
                }));
                setSlots(parsedSlots);
                setBusyTimes(parsedBusyTimes);
                setFilteredSlots(parsedSlots);
                setFilteredBusyTimes(parsedBusyTimes);
                setLoading(false);
            } catch (error: any) {
                console.error('Error fetching slots', error);
                if (error.response && error.response.status === 401) {
                    window.location.href = '/api/google/auth';
                }
            }
        };

        fetchSlots();
    }, []);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        const filteredFreeSlots = slots.filter(slot =>
            format(slot.start, 'PPPP').toLowerCase().includes(term) ||
            format(slot.end, 'PPPP').toLowerCase().includes(term)
        );
        const filteredEvents = busyTimes.filter(event =>
            event.summary.toLowerCase().includes(term) ||
            event.creator.email.toLowerCase().includes(term)
        );

        setFilteredSlots(filteredFreeSlots);
        setFilteredBusyTimes(filteredEvents);
    }, [searchTerm, slots, busyTimes]);

    const bookSlot = async (slot: Slot) => {
        // Add booking logic here
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const groupedData = groupByDay(filteredSlots, filteredBusyTimes);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-4">Available Time Slots</h1>
            <input
                type="text"
                placeholder="Search slots or events..."
                className="mb-4 p-2 rounded bg-gray-800 text-white"
                value={searchTerm}
                onChange={handleSearch}
            />
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="space-y-8">
                    {groupedData.map((group, index) => (
                        <div key={index}>
                            <h2 className="text-2xl font-bold mb-2">{format(group.date, 'EEEE, MMMM do yyyy')}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {group.slots.map((slot, index) => (
                                    <div
                                        key={index}
                                        className="p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700"
                                        onClick={() => bookSlot(slot)}
                                    >
                                        <p>{format(slot.start, 'p')} - {format(slot.end, 'p')}</p>
                                    </div>
                                ))}
                                {group.events.map((event, index) => (
                                    <div
                                        key={index}
                                        className="p-4 bg-gray-700 rounded-lg border-l-4 border-red-500"
                                    >
                                        <p><strong>Summary:</strong> {event.summary}</p>
                                        <p><strong>Time:</strong> {format(event.start, 'p')} - {format(event.end, 'p')}</p>
                                        <p><strong>Creator:</strong> {event.creator.email}</p>
                                        <p><strong>Description:</strong> {event.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
