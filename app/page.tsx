'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Slot, BusyTime, groupByDay, getTimezones, validateWorkingHours } from '@/lib/slot_utilities';

const timezones = getTimezones();

export default function Home(): JSX.Element {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [busyTimes, setBusyTimes] = useState<BusyTime[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredSlots, setFilteredSlots] = useState<Slot[]>([]);
    const [filteredBusyTimes, setFilteredBusyTimes] = useState<BusyTime[]>([]);
    const [days, setDays] = useState(14);
    const [startHour, setStartHour] = useState(10);
    const [endHour, setEndHour] = useState(17);
    const [timezone, setTimezone] = useState('GMT+00:00');
    const router = useRouter();

    const fetchSlots = async () => {
        if (!validateWorkingHours(startHour, endHour)) {
            alert('Working Day Start Hour must be less than Working Day End Hour.');
            return;
        }

        try {
            const { data } = await axios.get('/api/calendar/slots', {
                params: {
                    days,
                    startHour,
                    endHour,
                    timezone,
                },
            });
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

    useEffect(() => {
        fetchSlots();
    }, [days, startHour, endHour, timezone]);

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

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDays(Number(e.target.value));
    };

    const handleStartHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStartHour(Number(e.target.value));
    };

    const handleEndHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEndHour(Number(e.target.value));
    };

    const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTimezone(e.target.value);
    };

    const groupedData = groupByDay(filteredSlots, filteredBusyTimes);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-4">Available Time Slots</h1>
            <div className="mb-4 flex flex-wrap space-x-4 items-end">
                <div>
                    <label className="block mb-2">Number of Days</label>
                    <input
                        type="number"
                        value={days}
                        onChange={handleDaysChange}
                        className="p-2 rounded bg-gray-800 text-white w-24"
                    />
                </div>
                <div>
                    <label className="block mb-2">Working Day Start Hour</label>
                    <input
                        type="number"
                        value={startHour}
                        onChange={handleStartHourChange}
                        className="p-2 rounded bg-gray-800 text-white w-24"
                    />
                </div>
                <div>
                    <label className="block mb-2">Working Day End Hour</label>
                    <input
                        type="number"
                        value={endHour}
                        onChange={handleEndHourChange}
                        className="p-2 rounded bg-gray-800 text-white w-24"
                    />
                </div>
                <div className="flex-1">
                    <label className="block mb-2">Timezone</label>
                    <select
                        value={timezone}
                        onChange={handleTimezoneChange}
                        className="p-2 rounded bg-gray-800 text-white w-full"
                    >
                        {timezones.map(({ offset, locations }) => (
                            <option key={offset} value={offset}>
                                {`${offset} - ${locations.split(',')[0]}...`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <input
                type="text"
                placeholder="Search slots or events..."
                className="mb-4 p-2 rounded bg-gray-800 text-white w-full"
                value={searchTerm}
                onChange={handleSearch}
            />
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="space-y-4">
                    {groupedData.map((group, index) => (
                        <div key={index} className="mb-8">
                            <h2 className="text-xl font-bold mb-2">{format(group.date, 'EEEE, MMMM do yyyy')}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 group">
                                {group.items.map((item, idx) => (
                                    'summary' in item ? (
                                        <div
                                            key={idx}
                                            className="relative p-2 bg-gray-700 rounded-lg border-l-4 border-red-500 flex flex-col justify-between items-start h-32 overflow-hidden group-hover:h-40 transition-all duration-300 ease-in-out hover:h-48 hover:scale-150 hover:z-10 hover:opacity-100"
                                        >
                                            <div className="w-full text-sm">
                                                <p><strong>Summary:</strong> {item.summary}</p>
                                                <p><strong>Time:</strong> {format(item.start, 'p')} - {format(item.end, 'p')}</p>
                                                <p><strong>Creator:</strong> {item.creator.email}</p>
                                                <p><strong>Description:</strong> {item.description}</p>
                                            </div>
                                            <div className="absolute inset-0 bg-gray-900 opacity-0 transition-opacity duration-300 ease-in-out"></div>
                                        </div>
                                    ) : (
                                        <div
                                            key={idx}
                                            className="relative p-2 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 flex flex-col justify-between items-start h-32 overflow-hidden group-hover:h-40 transition-all duration-300 ease-in-out hover:h-48 hover:scale-150 hover:z-10 hover:opacity-100"
                                        >
                                            <div className="w-full text-sm">
                                                <p>{format(item.start, 'p')} - {format(item.end, 'p')}</p>
                                            </div>
                                            <div className="absolute inset-0 bg-gray-900 opacity-0 transition-opacity duration-300 ease-in-out"></div>
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
