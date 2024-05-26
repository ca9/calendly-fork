import React, { useEffect, useState } from 'react';
import moment from 'moment';
import styles from './home.module.css';

export interface Event {
    id: string;
    eventName: string;
    calendar: string;
    color: 'green' | 'red';
    date: moment.Moment;
}

interface CalendarProps {
    selector: string;
    events: Event[];
}

const Calendar: React.FC<CalendarProps> = ({ selector, events }) => {
    const [current, setCurrent] = useState(moment().date(1));

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

            const weekContainer = document.createElement('div');
            weekContainer.className = 'week-container';
            month.appendChild(weekContainer);

            backFill(weekContainer);
            currentMonth(weekContainer);
            forwardFill(weekContainer);
        };

        const backFill = (weekContainer: Element) => {
            const clone = current.clone();
            const dayOfWeek = clone.day();

            if (!dayOfWeek) return;

            clone.subtract(dayOfWeek, 'days');

            for (let i = dayOfWeek; i > 0; i--) {
                drawDay(weekContainer, clone.add(1, 'days'));
            }
        };

        const forwardFill = (weekContainer: Element) => {
            const clone = current.clone().add(1, 'month').subtract(1, 'day');
            const dayOfWeek = clone.day();

            if (dayOfWeek === 6) return;

            for (let i = dayOfWeek; i < 6; i++) {
                drawDay(weekContainer, clone.add(1, 'days'));
            }
        };

        const currentMonth = (weekContainer: Element) => {
            const clone = current.clone();

            while (clone.month() === current.month()) {
                drawDay(weekContainer, clone);
                clone.add(1, 'days');
            }
        };

        const getWeek = (day: moment.Moment) => {
            const weekContainer = el.querySelector('.week-container');
            if (!weekContainer) return;

            let currentWeek = weekContainer.lastElementChild;
            if (!currentWeek || day.day() === 0) {
                currentWeek = document.createElement('div');
                currentWeek.className = styles.week;
                weekContainer.appendChild(currentWeek);
            }
            return currentWeek;
        };

        const drawDay = (weekContainer: Element, day: moment.Moment) => {
            const week = getWeek(day);

            if (!week) return;

            const dayEl = document.createElement('div');
            dayEl.className = styles.day;

            if (day.month() !== current.month()) {
                dayEl.classList.add(styles.other);
            } else if (moment().isSame(day, 'day')) {
                dayEl.classList.add(styles.today);
            }

            const name = document.createElement('div');
            name.className = styles.dayName;
            name.innerText = day.format('ddd');

            const number = document.createElement('div');
            number.className = styles.dayNumber;
            number.innerText = day.format('DD');

            const events = document.createElement('div');
            events.className = styles.dayEvents;
            drawEvents(day, events);

            dayEl.appendChild(name);
            dayEl.appendChild(number);
            dayEl.appendChild(events);
            week.appendChild(dayEl);
        };

        const drawEvents = (day: moment.Moment, element: HTMLElement) => {
            const todaysEvents = events.filter(ev => ev.date.isSame(day, 'day'));
            todaysEvents.forEach(ev => {
                const evSpan = document.createElement('span');
                // console.log(ev);
                evSpan.className = styles[ev.color];
                element.appendChild(evSpan);
            });
        };

        const nextMonth = () => {
            setCurrent(current.clone().add(1, 'month'));
        };

        const prevMonth = () => {
            setCurrent(current.clone().subtract(1, 'month'));
        };

        draw();
    }, [selector, events, current]);

    return <div id={selector.substring(1)}></div>;
};

export default Calendar;
