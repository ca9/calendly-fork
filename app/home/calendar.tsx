import React, { useEffect, useState } from 'react';
import moment from 'moment';
import styles from './calendar.module.css';

export interface Event {
    id: string;
    eventName: string;
    calendar: string;
    color: 'green' | 'red' | 'blue' | 'yellow' | 'orange';
    date: moment.Moment;
    startTime: string;
    endTime: string;
}

interface CalendarProps {
    selector: string;
    events: Event[];
}

const Calendar: React.FC<CalendarProps> = ({ selector, events }) => {
    const [current, setCurrent] = useState(moment().startOf('month'));
    const [selectedDay, setSelectedDay] = useState<moment.Moment | null>(null);
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
            title.innerText = current.format('MMMM YYYY');
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

            let startOfMonth = current.clone().startOf('month').startOf('isoWeek'); // Ensure week starts on Monday
            let endOfMonth = current.clone().endOf('month').endOf('isoWeek'); // Ensure week ends on Sunday

            let day = startOfMonth.clone().subtract(1, 'day');

            while (day.isBefore(endOfMonth, 'day')) {
                day.add(1, 'day');
                if (day.isoWeekday() === 1) {
                    const week = document.createElement('div');
                    week.className = styles.week;
                    month.appendChild(week);
                }
                drawDay(day, month.lastChild as HTMLElement);
            }
        };

        const drawDay = (day: moment.Moment, week: Element) => {
            const dayEl = document.createElement('div');
            const isSelected = selectedDay && selectedDay.isSame(day, 'day');
            dayEl.className = `${styles.day} ${isSelected ? styles.selectedDay : ''}`;

            // Closure to capture the current `day` value
            (function(day) {
                dayEl.addEventListener('click', () => {
                    console.log(`Day clicked: ${day.format('YYYY-MM-DD')}`);
                    handleDayClick(day.clone());
                });
            })(day.clone());

            if (day.month() !== current.month()) {
                dayEl.classList.add(styles.other);
            } else if (moment().isSame(day, 'day')) {
                dayEl.classList.add(styles.today);
            }

            if (!events.some(ev => ev.date.isSame(day, 'day'))) {
                dayEl.classList.add(styles.noEvents);
            }

            const name = document.createElement('div');
            name.className = styles.dayName;
            name.innerText = day.format('ddd');

            const number = document.createElement('div');
            number.className = styles.dayNumber;
            number.innerText = day.format('DD');

            const eventsEl = document.createElement('div');
            eventsEl.className = styles.dayEvents;
            drawEvents(day, eventsEl);

            dayEl.appendChild(name);
            dayEl.appendChild(number);
            dayEl.appendChild(eventsEl);
            week.appendChild(dayEl);
        };

        const drawEvents = (day: moment.Moment, element: HTMLElement) => {
            const todaysEvents = events.filter(ev => ev.date.isSame(day, 'day'));
            todaysEvents.forEach(ev => {
                const evSpan = document.createElement('span');
                evSpan.className = styles[ev.color];
                element.appendChild(evSpan);
            });
        };

        const nextMonth = () => {
            console.log('Next month clicked');
            setCurrent(current.clone().add(1, 'month'));
            setSelectedDay(null); // Unselect the day when navigating
            setDayEvents([]); // Clear events when navigating
        };

        const prevMonth = () => {
            console.log('Previous month clicked');
            setCurrent(current.clone().subtract(1, 'month'));
            setSelectedDay(null); // Unselect the day when navigating
            setDayEvents([]); // Clear events when navigating
        };

        const handleDayClick = (day: moment.Moment) => {
            if (selectedDay && selectedDay.isSame(day, 'day')) {
                setSelectedDay(null); // Unselect if the same day is clicked
                setDayEvents([]); // Clear events
            } else {
                setSelectedDay(day);
                const todaysEvents = events.filter(ev => ev.date.isSame(day, 'day'));
                setDayEvents(todaysEvents);
                // console.log(`Selected day events:`, todaysEvents);
            }
        };

        draw();
    }, [selector, events, current, selectedDay]);

    const totalFreeSlots = dayEvents.filter(event => event.calendar === 'Free Slot').length;

    return (
        <div className={styles.calendarContainer}>
            <div id={selector.substring(1)}></div>
            {selectedDay && (
                <div className={styles.details}>
                    <div className={styles.arrow}></div>
                    <div className={styles.selectedDayDetails}>
                        <h2>{selectedDay.format('MMMM Do YYYY')}</h2>
                        <p>Total Free Slots: {totalFreeSlots}</p>
                    </div>
                    <div className={styles.events}>
                        {dayEvents.length > 0 ? (
                            dayEvents.map(event => (
                                <div key={event.id} className={styles.event}>
                                    <div className={`${styles.eventCategory} ${styles[event.color]}`}></div>
                                    <span>{event.eventName}</span>
                                    <span className={styles.eventTime}>{event.startTime} - {event.endTime}</span>
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
