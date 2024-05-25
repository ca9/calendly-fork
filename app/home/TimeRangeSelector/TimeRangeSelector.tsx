// TimeRangeSelector.tsx
import { useEffect, useRef } from 'react';
import styles from './TimeRangeSelector.module.scss';

const STEP = 0.25; // quarter: 0.25, half: 0.5, whole: 1
const DEFAULT_START = 10;
const DEFAULT_END = 17;
const ANIMATED = true;
const SIZE = 240;
const HOUR24 = false;

const onChange = (start: number, end: number) => {
    console.log('Time change', start, end);
};

const TimeRangeSelector: React.FC = () => {
    const clockRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!clockRef.current) return;

        const $el = clockRef.current;

        // Clear existing content
        $el.innerHTML = '';

        if (!ANIMATED) {
            $el.classList.add(styles.noAnimation);
        }

        $el.style.setProperty('--size', SIZE + 'px');

        const $clock = document.createElement('div');
        $clock.classList.add(styles.clock);

        const $output = document.createElement('output');
        const $startTime = document.createElement('time');
        const $endTime = document.createElement('time');
        const $dash = document.createElement('span');
        $startTime.classList.add(styles.start);
        $endTime.classList.add(styles.end);
        $dash.innerText = '-';
        $output.append($startTime);
        $output.append($dash);
        $output.append($endTime);

        const $ticks = document.createElement('div');
        $ticks.classList.add(styles.ticks);

        for (let tick = 0; tick < 12; tick += STEP) {
            const $tick = document.createElement('div');
            $tick.classList.add(styles.tick);
            $tick.style.setProperty('--tick', tick.toString());
            if (!(tick % 1)) {
                $tick.classList.add(styles.tickWhole);
            }
            $ticks.append($tick);
        }

        const $radials = document.createElement('div');
        $radials.classList.add(styles.radials);

        const $hands = document.createElement('div');
        $hands.classList.add(styles.hands);

        const hands = {
            start: {
                dragging: false,
                angle: 0,
                $el: null as HTMLDivElement | null,
            },
            end: {
                dragging: false,
                angle: 0,
                $el: null as HTMLDivElement | null,
            },
        };

        const updateRadial = () => {
            $radials.style.setProperty('--angle', Math.min(hands.end.angle, hands.start.angle) + 'rad');
            let diff = Math.abs(hands.end.angle - hands.start.angle);
            let index = 0;
            while (diff > 0) {
                let $radial = $radials.children[index] as HTMLDivElement;
                if (!$radial) {
                    $radial = document.createElement('div');
                    $radial.style.setProperty('--index', index.toString());
                    $radial.classList.add(styles.radial);
                    $radials.append($radial);
                }
                $radial.style.setProperty('--angle', Math.min(diff, Math.PI * 2) + 'rad');
                diff -= Math.PI * 2;
                index++;
            }

            for (let i = 0; i < $radials.children.length; i++) {
                if (i >= index) {
                    ($radials.children[i] as HTMLDivElement).style.setProperty('--angle', '0rad');
                }
            }
        };

        const updateOutput = () => {
            let startTime = (hands.start.angle / (Math.PI * 2)) * 12;
            let endTime = (hands.end.angle / (Math.PI * 2)) * 12;
            while (startTime < 0) {
                startTime += 24;
            }
            while (endTime < 0) {
                endTime += 24;
            }

            startTime = Math.round(startTime * (1 / STEP)) * STEP;
            endTime = Math.round(endTime * (1 / STEP)) * STEP;

            onChange(startTime, endTime);

            startTime %= 24;
            endTime %= 24;

            const parseTime = (time: number) =>
                Math.floor(HOUR24 ? time : time < 13 ? time : time % 12)
                    .toString()
                    .padStart(2, '0') +
                ':' +
                (Math.round((time % 1) * 60) % 60).toString().padStart(2, '0') +
                (HOUR24 ? '' : time >= 12 ? 'PM' : 'AM');

            $startTime.innerText = parseTime(startTime);
            $endTime.innerText = parseTime(endTime);
        };

        const onUp = () => {
            Object.keys(hands).forEach((key) => {
                hands[key as keyof typeof hands].dragging = false;
                hands[key as keyof typeof hands].$el?.classList.remove(styles.hover);
            });
        };

        const onMove = (e: MouseEvent | TouchEvent) => {
            Object.keys(hands).forEach((key) => {
                const hand = hands[key as keyof typeof hands];
                if (!hand.dragging) return;
                let clientX, clientY;
                if (e instanceof TouchEvent) {
                    ({ clientX, clientY } = e.touches[0]);
                } else {
                    ({ clientX, clientY } = e);
                }
                const { x, y, width, height } = $clock.getBoundingClientRect();
                const deltaX = x + width * 0.5 - clientX;
                const deltaY = y + height * 0.5 - clientY;
                const angle = -Math.atan2(deltaX, deltaY);
                let roundedAngle = Math.round((12 / STEP) * angle / (Math.PI * 2)) / (12 / STEP) * Math.PI * 2;

                let diff = roundedAngle - hand.angle;
                while (Math.abs(diff) > Math.PI) {
                    if (diff < 0) {
                        diff += Math.PI * 2;
                    } else {
                        diff -= Math.PI * 2;
                    }
                }
                const before = hand.angle;
                hand.angle += diff;

                if ('start' === key) {
                    hands.start.angle = Math.min(hands.start.angle, hands.end.angle);
                } else {
                    hands.end.angle = Math.max(hands.start.angle, hands.end.angle);
                }

                if (Math.abs(hands.end.angle - hands.start.angle) > Math.PI * 4) {
                    if (key === 'start') {
                        hands.start.angle = hands.end.angle - Math.PI * 2;
                    } else {
                        hands.end.angle = hands.start.angle + Math.PI * 2;
                    }
                }

                const realDiff = hands[key as keyof typeof hands].angle - before;

                if (Math.abs(realDiff) > 1e-5) {
                    updateOutput();
                    updateRadial();
                }
                hand.$el!.style.setProperty('--angle', hand.angle + 'rad');
            });
        };

        Object.keys(hands).forEach((hand) => {
            const $hand = document.createElement('div');
            $hand.classList.add(styles.hand);
            $hand.classList.add(styles[`hand${hand.charAt(0).toUpperCase() + hand.slice(1)}`]);
            hands[hand as keyof typeof hands].$el = $hand;

            if (hand === 'start') {
                hands.start.angle = (DEFAULT_START / 12) * Math.PI * 2;
                hands.start.$el?.style.setProperty('--angle', hands.start.angle + 'rad');
            } else {
                hands.end.angle = (DEFAULT_END / 12) * Math.PI * 2;
                hands.end.$el?.style.setProperty('--angle', hands.end.angle + 'rad');
            }
            updateOutput();
            updateRadial();

            const onDown = () => {
                if (hands.start.dragging && hand === 'end') return;
                hands[hand as keyof typeof hands].dragging = true;
                hands[hand as keyof typeof hands].$el!.classList.add(styles.hover);
            };

            $hand.addEventListener('mousedown', onDown);
            $hand.addEventListener('touchstart', onDown);
            $hands.append($hand);
        });

        document.body.addEventListener('mouseup', onUp);
        document.body.addEventListener('touchend', onUp);
        document.body.addEventListener('mousemove', onMove);
        document.body.addEventListener('touchmove', onMove);

        updateOutput();

        $clock.append($ticks);
        $clock.append($radials);
        $clock.append($hands);
        $el.append($clock);
        $el.append($output);

        return () => {
            document.body.removeEventListener('mouseup', onUp);
            document.body.removeEventListener('touchend', onUp);
            document.body.removeEventListener('mousemove', onMove);
            document.body.removeEventListener('touchmove', onMove);
        };
    }, [clockRef]);

    return <div ref={clockRef} className={styles.timeRangeSelector}></div>;
};

export default TimeRangeSelector;
