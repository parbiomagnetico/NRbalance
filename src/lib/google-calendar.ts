/**
 * Google Calendar API Client — NR Balance
 * Single Source of Truth for all appointment data.
 */
import { google, type calendar_v3 } from 'googleapis';

// ─── Clinic Schedule Constants ───
const CLINIC_HOURS: Record<number, { open: string; close: string } | null> = {
    0: null,                          // Domingo — cerrado
    1: { open: '09:00', close: '20:00' }, // Lunes
    2: { open: '09:00', close: '20:00' }, // Martes
    3: { open: '09:00', close: '20:00' }, // Miércoles
    4: { open: '09:00', close: '20:00' }, // Jueves
    5: { open: '09:00', close: '20:00' }, // Viernes
    6: { open: '10:00', close: '14:00' }, // Sábado
};

// Service durations in minutes
const SERVICE_DURATIONS: Record<string, number> = {
    'deep-tissue': 60,
    'descompresion-fisica': 60,
    'crio-recuperacion': 45,
    'cervico-mandibular': 45,
    'ansiedad-estres': 60,
    'estado-animo': 60,
    'trauma': 60,
    'terapia-pareja': 90,
};

// ─── Auth ───
function getAuthClient() {
    const email = import.meta.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = (import.meta.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    return new google.auth.JWT({
        email,
        key,
        scopes: ['https://www.googleapis.com/auth/calendar'],
    });
}

function getCalendarClient() {
    return google.calendar({ version: 'v3', auth: getAuthClient() });
}

// ─── FreeBusy Query ───
export async function getFreeBusy(
    timeMin: string,
    timeMax: string
): Promise<calendar_v3.Schema$TimePeriod[]> {
    const calendar = getCalendarClient();
    const calendarId = import.meta.env.GOOGLE_CALENDAR_ID;

    const res = await calendar.freebusy.query({
        requestBody: {
            timeMin,
            timeMax,
            timeZone: 'Europe/Madrid',
            items: [{ id: calendarId }],
        },
    });

    return res.data.calendars?.[calendarId]?.busy || [];
}

// ─── Slot Generation ───
export interface TimeSlot {
    start: string;   // ISO 8601
    end: string;     // ISO 8601
    display: string; // e.g. "10:30"
}

export function getServiceDuration(serviceId: string): number {
    return SERVICE_DURATIONS[serviceId] || 60;
}

export async function getAvailableSlots(
    dateStr: string,   // YYYY-MM-DD
    serviceId: string
): Promise<TimeSlot[]> {
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const hours = CLINIC_HOURS[dayOfWeek];

    // Clinic closed on this day
    if (!hours) return [];

    const duration = getServiceDuration(serviceId);
    const tz = 'Europe/Madrid';

    // Build day boundaries in ISO
    const dayStart = `${dateStr}T${hours.open}:00`;
    const dayEnd = `${dateStr}T${hours.close}:00`;

    const timeMin = new Date(dayStart + '+01:00').toISOString();
    const timeMax = new Date(dayEnd + '+01:00').toISOString();

    // Get busy blocks
    const busyBlocks = await getFreeBusy(timeMin, timeMax);

    // Generate all possible slots
    const slots: TimeSlot[] = [];
    const slotMs = duration * 60 * 1000;

    let cursor = new Date(dayStart + '+01:00');
    const end = new Date(dayEnd + '+01:00');

    while (cursor.getTime() + slotMs <= end.getTime()) {
        const slotStart = cursor.toISOString();
        const slotEnd = new Date(cursor.getTime() + slotMs).toISOString();

        // Check if this slot overlaps with any busy block
        const isOccupied = busyBlocks.some((busy) => {
            const busyStart = new Date(busy.start!).getTime();
            const busyEnd = new Date(busy.end!).getTime();
            const sStart = cursor.getTime();
            const sEnd = sStart + slotMs;
            return sStart < busyEnd && sEnd > busyStart;
        });

        if (!isOccupied) {
            const hh = cursor.getUTCHours().toString().padStart(2, '0');
            const mm = cursor.getUTCMinutes().toString().padStart(2, '0');
            // Display time in local timezone
            const localTime = cursor.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: tz,
                hour12: false,
            });
            slots.push({ start: slotStart, end: slotEnd, display: localTime });
        }

        // Move cursor by 30-min intervals (standard scheduling grid)
        cursor = new Date(cursor.getTime() + 30 * 60 * 1000);
    }

    return slots;
}

// ─── Create Calendar Event ───
export interface BookingEventData {
    summary: string;
    description: string;
    start: string; // ISO
    end: string;   // ISO
    attendeeEmail?: string;
}

export async function createCalendarEvent(
    data: BookingEventData
): Promise<string> {
    const calendar = getCalendarClient();
    const calendarId = import.meta.env.GOOGLE_CALENDAR_ID;

    const res = await calendar.events.insert({
        calendarId,
        requestBody: {
            summary: data.summary,
            description: data.description,
            start: {
                dateTime: data.start,
                timeZone: 'Europe/Madrid',
            },
            end: {
                dateTime: data.end,
                timeZone: 'Europe/Madrid',
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 60 },
                    { method: 'popup', minutes: 15 },
                ],
            },
        },
    });

    return res.data.id || '';
}
