// Local modules
import * as st from '../src/sun-tracker.js';
import dayjs from 'dayjs';

// dayjs extensions
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

const paris = {
  latitude: 48.85341,
  longitude: 2.3488,
  altitude: 42,
};

test('Paris sunset: 07-03-2023 07:21', () => {
  const date = new Date(2023, 2, 7, 11, 58, 0);
  const times = st.getTimes(date, paris);

  const sunrise = dayjs.tz(times.sunrise, 'Europe/Paris');

  const actualSunriseTime = dayjs(date).set('hour', 7).set('minute', 21);

  expect(sunrise.isSame(actualSunriseTime, 'minute')).toBe(true);
});


test('Paris shutters are opening: 07-02-2023 07:25', () => {
  const date = new Date(2023, 2, 7, 7, 25, 0);
  const shutterState = st.getSchedule(date, paris);

  expect(shutterState).toBe(st.ShutterSchedule.OpeningTime);
});

test('Paris shutters are open: 07-03-2023 11:58', () => {
  const date = new Date(2023, 2, 7, 11, 58, 0);
  const shutterState = st.getSchedule(date, paris);

  expect(shutterState).toBe(st.ShutterSchedule.Open);
});

test('Paris shutters are closing: 07-02-2023 19:15', () => {
  const date = new Date(2023, 2, 7, 19, 15, 0);
  const shutterState = st.getSchedule(date, paris);

  expect(shutterState).toBe(st.ShutterSchedule.ClosingTime);
});

test('Paris shutters are closed: 07-03-2023 20:30', () => {
  const date = new Date(2023, 2, 7, 20, 30, 0);
  const shutterState = st.getSchedule(date, paris);

  expect(shutterState).toBe(st.ShutterSchedule.Closed);
});

test('Paris shutters are not opened yet (Saturday): 11-03-2023 08:35', () => {
  const date = new Date(2023, 2, 11, 8, 35, 0);
  const shutterState = st.getSchedule(date, paris);

  expect(shutterState).toBe(st.ShutterSchedule.Closed);
});

test('Paris shutters are opening late (Saturday): 11-03-2023 09:07', () => {
  const date = new Date(2023, 2, 11, 9, 7, 0);
  const shutterState = st.getSchedule(date, paris);

  expect(shutterState).toBe(st.ShutterSchedule.OpeningTime);
});

test('Paris shutters are opening late (Sunday): 12-03-2023 09:08', () => {
  const date = new Date(2023, 2, 12, 9, 8, 0);
  const shutterState = st.getSchedule(date, paris);

  expect(shutterState).toBe(st.ShutterSchedule.OpeningTime);
});

test('Paris shutters are open late (Sunday): 12-03-2023 09:10', () => {
  const date = new Date(2023, 2, 12, 9, 10, 0);
  const shutterState = st.getSchedule(date, paris);

  expect(shutterState).toBe(st.ShutterSchedule.Open);
});

// console.log(st.getSchedule(new Date(2023, 2, 11, 20, 30, 0), paris));
// console.log(st.getTimes(new Date(2023, 2, 11, 20, 30, 0), paris));
