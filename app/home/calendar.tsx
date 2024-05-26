import React, { useEffect, useState } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameDay, isSameMonth, parseISO } from 'date-fns';
import styles from './calendar.module.css';

export interface Event {
    id: string;
    eventName: string;
    calendar: string;
    color: 'green' | 'red' | 'blue' | 'yellow' | 'orange';
    date: Date;
    endTime: Date;
}

interface CalendarProps {
    selector: string;
    events: Event[];
}

const Calendar: React.FC<CalendarProps> = ({ selector, events }) => {
    const [current, setCurrent] = useState(startOfMonth(new Date()));
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [dayEvents, setDayEvents] = useState<Event[]>([]);

    useEffect(() => {
        const el = document.querySelector(selector);
        if (!el) return;

        const draw = () => {
            clearCalendar(el);
            drawHeader(el);
            drawMonth(el);
        };

        const clearCalendar = (el: Element) => {
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }
        };

        const drawHeader = (el: Element) => {
            const header = document.createElement('div');
            header.className = styles.calendarHeader;

            const title = document.createElement('h1');
            title.innerText = format(current, 'MMMM yyyy');
            header.appendChild(title);

            const right = document.createElement('div');
            right.className = `${styles.calendarNavButton} ${styles.right}`;
            right.addEventListener('click', () => nextMonth());

            const left = document.createElement('div');
            left.className = `${styles.calendarNavButton} ${styles.left}`;
            left.addEventListener('click', () => prevMonth());

            header.appendChild(right);
            header.appendChild(left);
            el.appendChild(header);
        };

        const drawMonth = (el: Element) => {
            const month = document.createElement('div');
            month.className = `${styles.month} ${styles.new}`;
            el.appendChild(month);

            let startOfMonthDate = startOfMonth(current);
            let endOfMonthDate = endOfMonth(current);
            let startDate = startOfWeek(startOfMonthDate, { weekStartsOn: 1 });
            let endDate = endOfWeek(endOfMonthDate, { weekStartsOn: 1 });

            let day = startDate;

            while (day <= endDate) {
                if (day.getDay() === 1) {
                    const week = document.createElement('div');
                    week.className = styles.week;
                    month.appendChild(week);
                }
                drawDay(day, month.lastChild as HTMLElement);
                day = addDays(day, 1);
            }
        };

        const drawDay = (day: Date, week: Element) => {
            const dayEl = document.createElement('div');
            const isSelected = selectedDay && isSameDay(selectedDay, day);
            dayEl.className = `${styles.day} ${isSelected ? styles.selectedDay : ''}`;

            (function(day) {
                dayEl.addEventListener('click', () => {
                    console.log(`Day clicked: ${format(day, 'yyyy-MM-dd')}`);
                    handleDayClick(day);
                });
            })(day);

            if (!isSameMonth(day, current)) {
                dayEl.classList.add(styles.other);
            } else if (isSameDay(day, new Date())) {
                dayEl.classList.add(styles.today);
            }

            if (!events.some(ev => isSameDay(ev.date, day))) {
                dayEl.classList.add(styles.noEvents);
            }

            const name = document.createElement('div');
            name.className = styles.dayName;
            name.innerText = format(day, 'EEE');

            const number = document.createElement('div');
            number.className = styles.dayNumber;
            number.innerText = format(day, 'dd');

            const eventsEl = document.createElement('div');
            eventsEl.className = styles.dayEvents;
            drawEvents(day, eventsEl);

            dayEl.appendChild(name);
            dayEl.appendChild(number);
            dayEl.appendChild(eventsEl);
            week.appendChild(dayEl);
        };

        const drawEvents = (day: Date, element: HTMLElement) => {
            const todaysEvents = events.filter(ev => isSameDay(ev.date, day));
            todaysEvents.forEach(ev => {
                const evSpan = document.createElement('span');
                evSpan.className = styles[ev.color];
                element.appendChild(evSpan);
            });
        };

        const nextMonth = () => {
            console.log('Next month clicked');
            setCurrent(addDays(current, 30)); // Adjust as needed for month
            setSelectedDay(null); // Unselect the day when navigating
            setDayEvents([]); // Clear events when navigating
        };

        const prevMonth = () => {
            console.log('Previous month clicked');
            setCurrent(addDays(current, -30)); // Adjust as needed for month
            setSelectedDay(null); // Unselect the day when navigating
            setDayEvents([]); // Clear events when navigating
        };

        const handleDayClick = (day: Date) => {
            console.log(`Handling day click: ${format(day, 'yyyy-MM-dd')}`);
            if (selectedDay && isSameDay(selectedDay, day)) {
                setSelectedDay(null); // Unselect if the same day is clicked
                setDayEvents([]); // Clear events
            } else {
                setSelectedDay(day);
                const todaysEvents = events.filter(ev => isSameDay(ev.date, day));
                setDayEvents(todaysEvents);
                console.log(`Selected day events:`, todaysEvents);
            }
        };

        draw();
    }, [selector, events, current, selectedDay]);

    const totalFreeSlots = dayEvents.filter(event => event.calendar === 'Free').length;

    return (
        <div className={styles.calendarContainer}>
            <div id={selector.substring(1)} className="calendarBox"></div>
            {selectedDay && (
                <div className={styles.details}>
                    <div className={styles.selectedDayDetails}>
                        <h2>{format(selectedDay, 'MMMM do yyyy')}</h2>
                        <p>Total Free Slots: {totalFreeSlots}</p>
                    </div>
                    <div className={styles.events}>
                        {dayEvents.length > 0 ? (
                            dayEvents.map(event => (
                                <div key={event.id} className={styles.event}>
                                    <div className={`${styles.eventCategory} ${styles[event.color]}`}></div>
                                    <span>{event.eventName}</span>
                                    <span className={styles.eventTime}>
                                        {format(new Date(event.date), 'p')} - {format(new Date(event.endTime), 'p')}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className={styles.event}>
                                <span>No Events</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
