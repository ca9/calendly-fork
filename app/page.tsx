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
        const term = searchTerm.toLowerCase().replace(/[:\s]/g, ''); // Remove colons and spaces
        const filteredFreeSlots = slots.filter(slot => {
            const startStr = format(slot.start, 'PPPPp').toLowerCase().replace(/[:\s]/g, '');
            const endStr = format(slot.end, 'PPPPp').toLowerCase().replace(/[:\s]/g, '');
            return startStr.includes(term) || endStr.includes(term);
        });
        const filteredEvents = busyTimes.filter(event => {
            const startStr = format(event.start, 'PPPPp').toLowerCase().replace(/[:\s]/g, '');
            const endStr = format(event.end, 'PPPPp').toLowerCase().replace(/[:\s]/g, '');
            return (
                event.summary?.toLowerCase().includes(term) ||
                event.creator.email?.toLowerCase().includes(term) ||
                startStr.includes(term) ||
                endStr.includes(term)
            );
        });

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
                <div className="space-y-4">
                    {groupedData.map((group, index) => (
                        <div key={index}>
                            <h2 className="text-xl font-bold mb-2">{format(group.date, 'EEEE, MMMM do yyyy')}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                {group.items.map((item, idx) => (
                                    'summary' in item ? (
                                        <div key={idx} className="p-2 bg-gray-700 rounded-lg border-l-4 border-red-500 flex flex-col justify-between items-start">
                                            <div className="w-full">
                                                <p><strong>Summary:</strong> {item.summary?.length > 50 ? `${item.summary.substring(0, 50)}...` : item.summary}</p>
                                                <p><strong>Time:</strong> {format(item.start, 'p')} - {format(item.end, 'p')}</p>
                                                <p><strong>Creator:</strong> {item.creator.email}</p>
                                                <p><strong>Description:</strong> {item.description?.length > 50 ? `${item.description.substring(0, 50)}...` : item.description}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={idx} className="p-2 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 flex flex-col justify-between items-start">
                                            <div className="w-full">
                                                <p>{format(item.start, 'p')} - {format(item.end, 'p')}</p>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
