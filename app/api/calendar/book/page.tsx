'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function Book(): JSX.Element {
    const router = useRouter();
    const { searchParams } = new URL(window.location.href);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [invitees, setInvitees] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            await axios.post('/api/calendar/book', {
                start,
                end,
                title,
                description,
                invitees,
                token: localStorage.getItem('google_token'),
            });

            router.push('/');
        } catch (error) {
            console.error('Error booking slot', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-4">Book a Meeting</h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-400">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 bg-gray-800 rounded-lg text-white"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-400">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 bg-gray-800 rounded-lg text-white"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-400">Invitees (comma-separated emails)</label>
                    <input
                        type="text"
                        value={invitees}
                        onChange={(e) => setInvitees(e.target.value)}
                        className="w-full p-2 bg-gray-800 rounded-lg text-white"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full p-2 bg-blue-600 rounded-lg hover:bg-blue-500"
                >
                    Book
                </button>
            </form>
        </div>
    );
}
