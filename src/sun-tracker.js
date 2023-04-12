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

// export const ScheduledActions = {
//   ShouldOpen: 0,
//   DoNothingOpen: 1,
//   ShouldClose: 2,
//   DoNothingClose: 3
// }

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

function getEvents(date, location) {
  const dateJS = dayjs(date);
  const times = getTimes(date, location);

  // Shutters cannot open earlier than these times
  // Please note that both of these times are compliant to the 7ime convention: https://corentin-humbert.fr/projects/seventime/
  const minOpenTime = dateJS.set('hour', 7).set('minute', 0).set('second', 0);
  const minOpenTimeWeekend = dateJS
    .set('hour', 9)
    .set('minute', 7)
    .set('second', 0);

  const dayOfWeek = dateJS.day();
  const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;

  let shutterCanOpenFrom = dayjs(times?.sunriseEnd);

  // Custom opening time for the weekend
  if (isWeekend) {
    if (shutterCanOpenFrom.isBefore(minOpenTimeWeekend))
      shutterCanOpenFrom = minOpenTimeWeekend;

    // Alternative: add 90 minutes to initial time
    // canShutterOpenFrom = canShutterOpenFrom.add(90, 'minute');
  } else {
    // Even during the week, we don't want to wake too early.
    if (shutterCanOpenFrom.isBefore(minOpenTime))
      shutterCanOpenFrom = minOpenTime;
  }

  // It takes about 30 minutes to get full dark after the sunset
  const shutterCanCloseFrom = dayjs(times?.sunset).add(15, 'minute');

  const shutterCanOpenUntil = shutterCanOpenFrom.add(2, 'minute');
  const shutterCanCloseUntil = shutterCanCloseFrom.add(2, 'minute');

  return {
    opening: [shutterCanOpenFrom, shutterCanOpenUntil],
    closing: [shutterCanCloseFrom, shutterCanCloseUntil],
  };
}

export function getSchedule(date, location) {
  const today = dayjs(date);
  const tomorrow = today.add(1, 'day');

  const todayEvents = getEvents(today, location);
  const tomorrowEvents = getEvents(tomorrow, location);

  return {
    today: {
      opening: todayEvents.opening,
      closing: todayEvents.closing,
    },
    tomorrow: {
      opening: tomorrowEvents.opening,
      closing: tomorrowEvents.closing,
    },
  };
}

export function getAction(time, location) {
  const timeJS = dayjs(time);

  const dayEvents = getEvents(time, location);
  const opening = dayEvents.opening;
  const closing = dayEvents.closing;

  if (timeJS.isSameOrAfter(opening[0]) && timeJS.isBefore(opening[1])) {
    return ShutterSchedule.OpeningTime;
  }

  if (timeJS.isSameOrAfter(closing[0]) && timeJS.isBefore(closing[1])) {
    return ShutterSchedule.ClosingTime;
  }

  if (timeJS.isBefore(opening[0]) || timeJS.isSameOrAfter(closing[1])) {
    return ShutterSchedule.Closed;
  }

  return ShutterSchedule.Open;
}

export function getCurrentAction() {
  const now = new Date();

  return getAction(now, AppConfig.location);
}
