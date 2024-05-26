'use client';

import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {format} from 'date-fns';
import {toast, ToastContainer} from 'react-toastify';
import Calendar from './Calendar/calendar';
import {Event} from './Calendar/calendar';
import {Slot, BusyTime, groupByDay, getTimezones} from '@/lib/slot_utilities';
import 'react-toastify/dist/ReactToastify.css';
import styles from './home.module.css';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSpinner} from '@fortawesome/free-solid-svg-icons';
import TimeRangeSelector from "@/app/home/TimeRangeSelector/TimeRangeSelector";

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

    const fetchSlots = async () => {
        setIsFetching(true);
        try {
            const {data} = await axios.get('/api/calendar/slots', {
                params: {
                    days,
                    startHour,
                    endHour,
                    timezone,
                    slotDuration
                },
            });
            const parsedSlots = data.slots.map((slot: Slot) => ({
                ...slot,
                start: new Date(slot.start),
                end: new Date(slot.end),
            }));
            const parsedBusyTimes = data.busyTimes.map((event: BusyTime) => ({
                ...event,
                start: new Date(event.start),
                end: new Date(event.end),
            }));
            setSlots(parsedSlots);
            setBusyTimes(parsedBusyTimes);
            setFilteredSlots(parsedSlots);
            setFilteredBusyTimes(parsedBusyTimes);

            // Update events state
            const newEvents: Event[] = [];
            parsedSlots.forEach((slot: Slot, index: number) => {
                newEvents.push({
                    id: `${format(new Date(slot.start), 'dd-MM-yyyy-HH-mm-ss')}-${index}`,
                    eventName: 'Free Slot',
                    calendar: 'Free',
                    color: 'green',
                    date: new Date(slot.start),
                    endTime: new Date(slot.end)
                });
            });
            parsedBusyTimes.forEach((busy: BusyTime, index: number) => {
                newEvents.push({
                    id: `${format(new Date(busy.start), 'dd-MM-yyyy-HH-mm-ss')}-${index}`,
                    eventName: busy.summary || 'Busy',
                    calendar: 'Busy',
                    color: 'red',
                    date: new Date(busy.start),
                    endTime: new Date(busy.end)
                });
            });

            // console.log("refetch complete: ", newEvents);
            setEvents(newEvents);

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

        // Update events state based on search results
        const newEvents: Event[] = [];
        filteredFreeSlots.forEach((slot, index) => {
            newEvents.push({
                id: `${format(new Date(slot.start), 'dd-MM-yyyy-HH-mm-ss')}-${index}`,
                eventName: 'Free Slot',
                calendar: 'Free',
                color: 'green',
                date: new Date(slot.start),
                endTime: new Date(slot.end)
            });
        });
        filteredEvents.forEach((busy, index) => {
            newEvents.push({
                id: `${format(new Date(busy.start), 'dd-MM-yyyy-HH-mm-ss')}-${index}`,
                eventName: busy.summary || 'Busy',
                calendar: 'Busy',
                color: 'red',
                date: new Date(busy.start),
                endTime: new Date(busy.end)
            });
        });
        setEvents(newEvents);
    }, [searchTerm, slots, busyTimes]);

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


    function handleTimeChange(start: number, end: number) {
        setStartHour(start);
        setEndHour(end);
    }

    // const handleStartHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const value = Number(e.target.value);
    //     if (value < endHour) {
    //         setStartHour(value);
    //     } else {
    //         toast.error('Working Day Start Hour must be less than Working Day End Hour.');
    //     }
    // };
    //
    // const handleEndHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const value = Number(e.target.value);
    //     if (value > startHour) {
    //         setEndHour(value);
    //     } else {
    //         toast.error('Working Day End Hour must be greater than Working Day Start Hour.');
    //     }
    // };

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
            <ToastContainer/>
            <div className={styles.container}>
                <h1 className="text-3xl font-bold mb-4">Available Time Slots</h1>
                {isFetching && <div className="absolute top-4 right-4"><FontAwesomeIcon icon={faSpinner} spin/></div>}
                <div className={styles.grid}>
                    <div className={styles.clockContainer}>
                        <TimeRangeSelector onTimeChange={handleTimeChange}/>
                    </div>
                    <div className={styles.infoContainer}>
                        <div className={styles.timeInfo}>
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
                                    <option value={180}>3 hour slots</option>
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
                                        {timezones.map(({offset, locations}) => (
                                            <option key={offset} value={offset}>
                                                {`${offset} - ${locations.split(', ').slice(0, 2).join(', ')}${locations.split(', ').length > 2 ? '...' : ''}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className={styles.searchContainer}>
                            <input
                                type="text"
                                placeholder="Search slots or events..."
                                className="mb-4 p-2 rounded bg-gray-800 text-white w-full"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                    </div>
                </div>
            </div>
            {loading ? (
                <p>Loading</p>
            ) : (
                <Calendar selector="#calendar" events={events}/>
            )}
        </div>
    );
}

export default Home;
