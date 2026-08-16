const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DAY_ALIASES = new Map([
  ["sun", 0], ["sunday", 0],
  ["mon", 1], ["monday", 1],
  ["tue", 2], ["tues", 2], ["tuesday", 2],
  ["wed", 3], ["weds", 3], ["wednesday", 3],
  ["thu", 4], ["thur", 4], ["thurs", 4], ["thursday", 4],
  ["fri", 5], ["friday", 5],
  ["sat", 6], ["saturday", 6],
]);

const DAY_WORD = "Monday|Mon|Tuesday|Tues|Tue|Wednesday|Weds|Wed|Thursday|Thurs|Thur|Thu|Friday|Fri|Saturday|Sat|Sunday|Sun";
const DAY_RE = new RegExp(`\\b(${DAY_WORD})\\b(?:\\s*(?:-|–|—|to|through|thru|/)\\s*(${DAY_WORD})\\b)?`, "gi");
const TIME_RE = /\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\b/gi;

function normalizeDay(value) {
  return DAY_ALIASES.get(String(value || "").toLowerCase().replace(/\./g, ""));
}

function expandDays(start, end = start) {
  const output = [];
  let cursor = start;
  for (let guard = 0; guard < 7; guard += 1) {
    output.push(cursor);
    if (cursor === end) break;
    cursor = (cursor + 1) % 7;
  }
  return output;
}

function parseTimeToken(match) {
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3].toLowerCase().replace(/\./g, "");
  if (hour === 12) hour = 0;
  if (meridiem === "pm") hour += 12;
  return hour * 60 + minute;
}

function formatMinutes(value) {
  const normalized = ((value % 1440) + 1440) % 1440;
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function formatIntervals(intervals) {
  return intervals.map(({ start, end }) => `${formatMinutes(start)}–${formatMinutes(end)}`).join(" · ");
}

function emptySchedule() {
  return Array.from({ length: 7 }, () => null);
}

export function parseHours(rawValue) {
  const raw = String(rawValue || "").replace(/\u00a0/g, " ").trim();
  if (!raw) return { parsed: false, raw: "", days: emptySchedule() };

  let text = raw
    .replace(/\bweekdays?\b/gi, "Monday-Friday")
    .replace(/\bweekends?\b/gi, "Saturday-Sunday")
    .replace(/\bevery\s+day\b/gi, "Monday-Sunday")
    .replace(/\bdaily\b/gi, "Monday-Sunday")
    .replace(/\s+/g, " ")
    .trim();

  if (/\b24\s*\/\s*7\b|\b24\s*hours?(?:\s*a\s*day)?\b/i.test(text) && !DAY_RE.test(text)) {
    return {
      parsed: true,
      raw,
      days: Array.from({ length: 7 }, () => ({ open24: true, closed: false, intervals: [] })),
    };
  }

  DAY_RE.lastIndex = 0;
  const matches = [...text.matchAll(DAY_RE)];
  if (!matches.length) return { parsed: false, raw, days: emptySchedule() };

  const days = emptySchedule();
  let parsedAny = false;

  matches.forEach((match, index) => {
    const startDay = normalizeDay(match[1]);
    const endDay = normalizeDay(match[2] || match[1]);
    if (startDay === undefined || endDay === undefined) return;

    const segmentStart = match.index + match[0].length;
    const segmentEnd = index + 1 < matches.length ? matches[index + 1].index : text.length;
    const segment = text.slice(segmentStart, segmentEnd).replace(/^[\s:;,\-–—]+/, "").trim();

    let entry = null;

    if (/\bclosed\b|\bnot\s+open\b/i.test(segment)) {
      entry = { closed: true, open24: false, intervals: [] };
    } else if (/\b24\s*\/\s*7\b|\b24\s*hours?\b/i.test(segment)) {
      entry = { closed: false, open24: true, intervals: [] };
    } else {
      TIME_RE.lastIndex = 0;
      const timeMatches = [...segment.matchAll(TIME_RE)];
      const times = timeMatches.map(parseTimeToken);
      const intervals = [];
      for (let i = 0; i + 1 < times.length; i += 2) {
        intervals.push({ start: times[i], end: times[i + 1] });
      }
      if (intervals.length) entry = { closed: false, open24: false, intervals };
    }

    if (!entry) return;
    parsedAny = true;
    expandDays(startDay, endDay).forEach((day) => {
      days[day] = entry;
    });
  });

  return { parsed: parsedAny, raw, days };
}

export function nycClock(timestamp = Date.now()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date(timestamp)).map((part) => [part.type, part.value]));
  const day = DAY_NAMES.indexOf(parts.weekday);
  return {
    day,
    dayName: parts.weekday,
    minute: Number(parts.hour) * 60 + Number(parts.minute),
    displayTime: new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(timestamp)),
  };
}

export function openState(schedule, timestamp = Date.now()) {
  if (!schedule?.parsed) return { state: "unknown", label: "Hours not confirmed" };

  const now = nycClock(timestamp);
  const today = schedule.days[now.day];
  const previous = schedule.days[(now.day + 6) % 7];

  if (previous?.intervals?.some(({ start, end }) => end <= start && now.minute < end)) {
    return { state: "open", label: "Open now" };
  }

  if (!today) return { state: "unknown", label: "Today's hours not specified" };
  if (today.closed) return { state: "closed", label: "Closed now" };
  if (today.open24) return { state: "open", label: "Open now" };

  const isOpen = today.intervals.some(({ start, end }) => {
    if (end > start) return now.minute >= start && now.minute < end;
    return now.minute >= start || now.minute < end;
  });

  return { state: isOpen ? "open" : "closed", label: isOpen ? "Open now" : "Closed now" };
}

export function todayHours(schedule, timestamp = Date.now()) {
  const now = nycClock(timestamp);
  const entry = schedule?.days?.[now.day];
  if (!schedule?.parsed || !entry) {
    return { day: now.dayName, text: "Today's hours not specified by NYC" };
  }
  if (entry.closed) return { day: now.dayName, text: "Closed today" };
  if (entry.open24) return { day: now.dayName, text: "Open 24 hours" };
  return { day: now.dayName, text: formatIntervals(entry.intervals) };
}

export function weeklyHours(schedule) {
  if (!schedule?.parsed) return [];
  return DAY_NAMES.map((day, index) => {
    const entry = schedule.days[index];
    if (!entry) return { day, text: "Not specified" };
    if (entry.closed) return { day, text: "Closed" };
    if (entry.open24) return { day, text: "Open 24 hours" };
    return { day, text: formatIntervals(entry.intervals) };
  });
}

export function tidyRawHours(rawValue) {
  const raw = String(rawValue || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  if (!raw) return "Hours not provided by NYC";
  return raw
    .replace(/\b(am)\b/gi, "AM")
    .replace(/\b(pm)\b/gi, "PM")
    .replace(/\s*;\s*/g, " · ")
    .replace(/\s*\|\s*/g, " · ")
    .replace(/(\d)\s*-\s*(\d)/g, "$1–$2")
    .trim();
}
