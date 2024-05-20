'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Slot {
    start: Date;
    end: Date;
}

export default function Home(): JSX.Element {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchSlots = async () => {
            try {
                const { data } = await axios.get('/api/calendar/slots');
                setSlots(data);
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

    const bookSlot = async (slot: Slot) => {
        // Add booking logic here
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-4">Available Time Slots</h1>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {slots.map((slot, index) => (
                        <div
                            key={index}
                            className="p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700"
                            onClick={() => bookSlot(slot)}
                        >
                            <p>{new Date(slot.start).toLocaleTimeString()} - {new Date(slot.end).toLocaleTimeString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
