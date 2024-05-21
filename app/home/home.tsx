import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Select from 'react-select';
import { toast, ToastContainer } from 'react-toastify';
import { Slot, BusyTime, groupByDay, getTimezones, TimezoneOption } from '@/lib/slot_utilities';
import 'react-toastify/dist/ReactToastify.css';
import styles from './home.module.css';

const timezones = getTimezones().sort((a, b) => a.offset.localeCompare(b.offset));

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
    const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const router = useRouter();

    const fetchSlots = async () => {
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

    const handleTimezoneChange = (selectedOption: TimezoneOption | null) => {
        if (selectedOption) {
            setTimezone(selectedOption.value);
        }
    };

    const groupedData = groupByDay(filteredSlots, filteredBusyTimes);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <ToastContainer />
            <h1 className="text-3xl font-bold mb-4">Available Time Slots</h1>
            <div className="mb-4 flex flex-wrap space-x-4 items-end">
                <div>
                    <label className="block mb-2">Number of Days</label>
                    <input
                        type="number"
                        value={days}
                        onChange={handleDaysChange}
                        className={`${styles.customInput} p-2 rounded bg-gray-800 text-white w-24`}
                    />
                </div>
                <div>
                    <label className="block mb-2">Working Day Start Hour</label>
                    <input
                        type="number"
                        value={startHour}
                        onChange={handleStartHourChange}
                        className={`${styles.customInput} p-2 rounded bg-gray-800 text-white w-24`}
                    />
                </div>
                <div>
                    <label className="block mb-2">Working Day End Hour</label>
                    <input
                        type="number"
                        value={endHour}
                        onChange={handleEndHourChange}
                        className={`${styles.customInput} p-2 rounded bg-gray-800 text-white w-24`}
                    />
                </div>
                <div className="flex-1">
                    <label className="block mb-2">Timezone</label>
                    <Select
                        value={{ value: timezone, label: `${timezone}` }}
                        onChange={handleTimezoneChange}
                        options={timezones.map(({ offset, locations }) => ({
                            value: offset,
                            label: `${offset} - ${locations.split(', ').slice(0, 2).join(', ')}${locations.split(', ').length > 2 ? '...' : ''}`,
                        }))}
                        className="bg-gray-800 text-white rounded"
                        classNamePrefix="react-select"
                        styles={{
                            control: (base) => ({
                                ...base,
                                backgroundColor: '#1F2937', // Tailwind gray-800
                                borderColor: '#374151', // Tailwind gray-700
                                color: '#D1D5DB', // Tailwind gray-300
                            }),
                            menu: (base) => ({
                                ...base,
                                backgroundColor: '#1F2937',
                                color: '#D1D5DB',
                            }),
                            singleValue: (base) => ({
                                ...base,
                                color: '#D1D5DB',
                            }),
                            option: (base, { isFocused }) => ({
                                ...base,
                                backgroundColor: isFocused ? '#374151' : '#1F2937',
                                color: '#D1D5DB',
                            }),
                        }}
                    />
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
