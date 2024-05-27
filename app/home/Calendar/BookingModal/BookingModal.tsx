import React, {useState} from 'react';
import styles from './../calendar.module.css';
import { toast } from 'react-toastify';
import { format } from 'date-fns';


import { Event } from '@/lib/slot_utilities';

interface BookingModalProps {
    event: Event;
    defaultEmail: string;
    onClose: (refresh: boolean) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
                                                       event,
                                                       defaultEmail,
                                                       onClose = () => {}
}) => {
    const [summary, setSummary] = useState(event.description || '');
    const [description, setDescription] = useState('');
    const [guests, setGuests] = useState('');

    const formatDate = (date: Date) => {
        const dayOfWeek = format(date, 'ccc');
        const day = format(date, 'do');
        const month = format(date, 'MMMM');
        const year = format(date, 'yyyy');
        return `${dayOfWeek}, ${day} ${month}, ${year}`;
    };

    const formatTime = (date: Date) => {
        return format(date, 'h:mmaaa').toLowerCase();
    };

    const handleSubmit = async () => {
        const guestList = guests.split(',').map(email => email.trim());

        if (!guestList.includes(defaultEmail)) {
            guestList.push(defaultEmail);
        }

        const eventDetails = {
            summary,
            description,
            guests: guestList,
            start: event.start,
            end: event.end,
        };

        try {
            const response = await fetch('/api/calendar/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventDetails),
            });

            if (!response.ok) {
                throw new Error('Failed to create event');
            }

            const result = await response.json();
            console.log('Event created:', result);
            toast.success('Event created successfully!');
            onClose(true);
        } catch (error) {
            console.error('Error creating event:', error);
            toast.error('Failed to create event');
        }
    };

    return (
        <>
            <div className={styles.overlay} onClick={() => onClose(false)}></div>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2>Create Event on {formatDate(event.start)} </h2>
                    <button onClick={() => onClose(false)}>X</button>
                </div>
                <div className={styles.modalBody}>
                    <label className="text-xl">{formatTime(event.start)} to {formatTime(event.end)}</label>
                    <label htmlFor="summary">Summary:</label>
                    <input
                        type="text"
                        id="summary"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className={styles.inputField}
                    />
                    <label htmlFor="description">Agenda:</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={styles.textareaField}
                    />
                    <label htmlFor="guests">Invited Guests:</label>
                    <input
                        readOnly={true}
                        type="email"
                        id="email"
                        value={defaultEmail}
                        className={styles.inputField}
                    />
                    <label htmlFor="guests">Additional Guests:</label>
                    <input
                        type="text"
                        id="guests"
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        className={styles.inputField}
                        placeholder="Comma separated emails"
                    />
                </div>
                <div className={styles.modalFooter}>
                    <button onClick={() => onClose(false)} className={`${styles.button} ${styles.cancelButton}`}>
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className={`${styles.button} ${styles.submitButton}`}>
                        Submit
                    </button>
                </div>
            </div>
        </>
    );
};

export default BookingModal;
