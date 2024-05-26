'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast, ToastContainer } from 'react-toastify';
import Calendar from './calendar';
import { Event } from './calendar';
import moment from 'moment';
import { Slot, BusyTime, groupByDay, getTimezones, TimezoneOption } from '@/lib/slot_utilities';
import 'react-toastify/dist/ReactToastify.css';
import styles from './home.module.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const timezones = getTimezones().sort((a, b) => a.offset.localeCompare(b.offset));
const initialTimezone = timezones.find(tz => tz.locations.includes(Intl.DateTimeFormat().resolvedOptions().timeZone))?.offset || 'GMT';

export function Home(): JSX.Element {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [busyTimes, setBusyTimes] = useState<BusyTime[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredSlots, setFilteredSlots] = useState<Slot[]>([]);
    const [filteredBusyTimes, setFilteredBusyTimes] = useState<BusyTime[]>([]);
    const [days, setDays] = useState(14);
    const [startHour, setStartHour] = useState(10);
    const [endHour, setEndHour] = useState(17);
    const [timezone, setTimezone] = useState(initialTimezone);
    const [isFetching, setIsFetching] = useState(false);
    const [slotDuration, setSlotDuration] = useState(30);
    const [customDuration, setCustomDuration] = useState('');
    const [events, setEvents] = useState<Event[]>([]);
    const router = useRouter();

    const fetchSlots = async () => {
        setIsFetching(true);
        try {
            const { data } = await axios.get('/api/calendar/slots', {
                params: {
                    days,
                    startHour,
                    endHour,
                    timezone,
                    slotDuration
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
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchSlots();
    }, [days, startHour, endHour, timezone, slotDuration]);

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

    useEffect(() => {
        const newEvents: Event[] = [];
        slots?.forEach(slot => {
            newEvents.push({
                eventName: 'Free Slot',
                calendar: 'Free',
                color: 'green',
                date: moment(slot.start)
            });
        });
        busyTimes?.forEach(busy => {
            newEvents.push({
                eventName: busy.summary || 'Busy',
                calendar: 'Busy',
                color: 'red',
                date: moment(busy.start)
            });
        });
        setEvents(newEvents);
    }, [slots, busyTimes]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        if (value > 0 && value <= 30) {
            setDays(value);
        } else {
            toast.error('Number of Days must be between 1 and 30.');
        }
    };

    const handleStartHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        if (value < endHour) {
            setStartHour(value);
        } else {
            toast.error('Working Day Start Hour must be less than Working Day End Hour.');
        }
    };

    const handleEndHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        if (value > startHour) {
            setEndHour(value);
        } else {
            toast.error('Working Day End Hour must be greater than Working Day Start Hour.');
        }
    };

    const handleSlotDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === "custom") {
            setSlotDuration(-1);
        } else {
            setSlotDuration(Number(value));
        }
    };

    const handleCustomDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        if (value > 15 && value <= (endHour - startHour) * 60) {
            setCustomDuration(e.target.value);
            setSlotDuration(value);
        } else {
            toast.error('Custom duration must be over 15 minutes, and smaller than the working hours.');
        }
    };

    const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedTimezone = e.target.value;
        setTimezone(selectedTimezone);
        fetchSlots(); // Trigger fetch on timezone change
    };

    const groupedData = groupByDay(filteredSlots, filteredBusyTimes);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <ToastContainer />
            <h1 className="text-3xl font-bold mb-4">Available Time Slots</h1>
            {isFetching && <div className="absolute top-4 right-4"><FontAwesomeIcon icon={faSpinner} spin /></div>}
            <div className="mb-4 flex flex-wrap space-x-4 items-end">
                <div>
                    <label className="block mb-2">Number of Days</label>
                    <input
                        type="number"
                        value={days}
                        onChange={handleDaysChange}
                        className={`${styles.customInput} p-2 rounded bg-gray-800 text-white w-24 `}
                    />
                </div>
                <div>
                    <label className="block mb-2">Working Day Start Hour</label>
                    <input
                        type="number"
                        value={startHour}
                        onChange={handleStartHourChange}
                        className={`${styles.customInput} p-2 rounded bg-gray-800 text-white w-24 `}
                    />
                </div>
                <div>
                    <label className="block mb-2">Working Day End Hour</label>
                    <input
                        type="number"
                        value={endHour}
                        onChange={handleEndHourChange}
                        className={`${styles.customInput} p-2 rounded bg-gray-800 text-white w-24 `}
                    />
                </div>
                <div>
                    <label className="block mb-2">Time Slot Duration</label>
                    <select
                        value={slotDuration === -1 ? "custom" : slotDuration}
                        onChange={handleSlotDurationChange}
                        className={`${styles.customInput} ${styles.customSelect}`}
                    >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={90}>1 hour 30 minutes</option>
                        <option value={120}>2 hour slots</option>
                        <option value={180}>2 hour slots</option>
                    </select>
                </div>

                {slotDuration === -1 && (
                    <div>
                        <label className="block mb-2">Custom Duration (minutes)</label>
                        <input
                            type="number"
                            value={customDuration}
                            onChange={handleCustomDurationChange}
                            className={`${styles.customInput} p-2 rounded bg-gray-800 text-white w-24`}
                        />
                    </div>
                )}

                <div className="flex-1">
                    <label className={`${styles.label} block mb-2`}>Timezone</label>
                    <div className="relative">
                        <select
                            value={timezone}
                            onChange={handleTimezoneChange}
                            className={`${styles.customInput} ${styles.customSelect}`}
                        >
                            {timezones.map(({ offset, locations }) => (
                                <option key={offset} value={offset}>
                                    {`${offset} - ${locations.split(', ').slice(0, 2).join(', ')}${locations.split(', ').length > 2 ? '...' : ''}`}
                                </option>
                            ))}
                        </select>
                    </div>
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
                <p>Loading</p>
            ) : (
                <Calendar selector="#calendar" events={events} />
            )}
        </div>
    );
}

export default Home;
