import SunCalc from 'suncalc';
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

// local module
import * as cfg from './config.js';
const AppConfig = cfg.getConfig();

export const ShutterSchedule = {
  OpeningTime: 0,
  Open: 1,
  ClosingTime: 2,
  Closed: 3,
};

export function getTimes(date, location) {
  return SunCalc.getTimes(
    date,
    location.latitude,
    location.longitude,
    location.altitude
  );
}

export function getTodayTimes() {
  const today = new Date();

  return getTimes(today, AppConfig.location);
}

export function getSchedule(time, location) {
  const timeJS = dayjs(time);
  const dayEvents = getTimes(time, location);

  // Shutters cannot open earlier than these times
  // Please note that both of these times are compliant to the 7ime convention: https://corentin-humbert.fr/projects/seventime/
  const minOpenTime = timeJS.set('hour', 7).set('minute', 0).set('second', 0);
  const minOpenTimeWeekend = timeJS
    .set('hour', 9)
    .set('minute', 7)
    .set('second', 0);

  const dayOfWeek = timeJS.day();
  const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;

  let canShutterOpenFrom = dayjs(dayEvents?.sunriseEnd);

  // Custom opening time for the weekend
  if (isWeekend) {
    if (canShutterOpenFrom.isBefore(minOpenTimeWeekend))
      canShutterOpenFrom = minOpenTimeWeekend;

    // Alternative: add 90 minutes to initial time
    // canShutterOpenFrom = canShutterOpenFrom.add(90, 'minute');
  } else {
    // Even during the week, we don't want to wake too early.
    if (canShutterOpenFrom.isBefore(minOpenTime))
      canShutterOpenFrom = minOpenTime;
  }

  // It takes about 30 minutes to get full dark after the sunset
  const canShutterCloseFrom = dayjs(dayEvents?.sunset).add(15, 'minute');

  const canShutterOpenTo = canShutterOpenFrom.add(2, 'minute');
  const canShutterCloseTo = canShutterCloseFrom.add(2, 'minute');

  if (
    timeJS.isSameOrAfter(canShutterOpenFrom) &&
    timeJS.isBefore(canShutterOpenTo)
  )
    return ShutterSchedule.OpeningTime;
  if (
    timeJS.isSameOrAfter(canShutterCloseFrom) &&
    timeJS.isBefore(canShutterCloseTo)
  )
    return ShutterSchedule.ClosingTime;
  if (
    timeJS.isBefore(canShutterOpenFrom) ||
    timeJS.isSameOrAfter(canShutterCloseTo)
  )
    return ShutterSchedule.Closed;

  return ShutterSchedule.Open;
}

export function getTodaySchedule() {
  const now = new Date();

  return getSchedule(now, AppConfig.location);
}
