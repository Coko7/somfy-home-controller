import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import { readCsv } from "./utils.js";

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const dayCycles = await readCsv("./data/local-daylight-cycles.csv");

function getTodayCycle() {
  const today = new Date();
  const todayStr = today.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return dayCycles.find((row) => row.date === todayStr);
}

export const DayState = {
  Sunrise: 0,
  Day: 1,
  Sunset: 2,
  Night: 3,
};

export function getTodayState() {
  const now = dayjs();
  const todayCycle = getTodayCycle();

  const dayOfWeek = now.day();
  const isWeekend = (dayOfWeek === 6) || (dayOfWeek  === 0);

  let sunrise = dayjs(todayCycle?.tsr, "HH:mm");
  if (isWeekend)
    sunrise = sunrise.add(30, "minute");

  const sunset = dayjs(todayCycle?.tss, "HH:mm");

  const sunrise2 = sunrise.add(1, "minute");
  const sunset2 = sunset.add(1, "minute");

  if (now.isSameOrAfter(sunrise) && now.isBefore(sunrise2))
    return DayState.Sunrise;
  if (now.isSameOrAfter(sunset) && now.isBefore(sunset2))
    return DayState.Sunset;
  if (now.isBefore(sunrise) || now.isSameOrAfter(sunset2))
    return DayState.Night;

  return DayState.Day;
}
