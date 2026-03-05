/**
 * POST /api/book
 * Creates a booking in Google Calendar with double-booking prevention.
 * Sends a confirmation email via Resend.
 * Embeds a WhatsApp "Magic Link" for post-session review in the event description.
 */
import type { APIRoute } from 'astro';
import {
    getFreeBusy,
    createCalendarEvent,
} from '../../lib/google-calendar';
import { sendConfirmationEmail } from '../../lib/resend';

interface BookingPayload {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    serviceId: string;
    serviceName: string;
    start: string; // ISO 8601
    end: string;   // ISO 8601
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const data: BookingPayload = await request.json();

        // ── Validate required fields ──
        const required: (keyof BookingPayload)[] = [
            'clientName', 'clientEmail', 'clientPhone',
            'serviceId', 'serviceName', 'start', 'end',
        ];
        for (const field of required) {
            if (!data[field]) {
                return new Response(
                    JSON.stringify({ error: `Campo obligatorio vacío: ${field}` }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        // ── ANTI DOUBLE-BOOKING: Last-millisecond freebusy check ──
        const busyBlocks = await getFreeBusy(data.start, data.end);
        if (busyBlocks.length > 0) {
            return new Response(
                JSON.stringify({
                    error: 'Este horario acaba de ser reservado. Por favor elige otro.',
                    code: 'SLOT_TAKEN',
                }),
                { status: 409, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // ── Build WhatsApp Magic Link for post-session review ──
        const reviewLink = import.meta.env.GOOGLE_REVIEW_LINK || 'https://g.page/r/nrbalance/review';

        // Clean phone number: remove spaces, ensure +34 prefix
        const cleanPhone = data.clientPhone.replace(/\s+/g, '').replace(/^(?!\+)/, '+34');
        // WhatsApp needs numbers without the leading +
        const waPhone = cleanPhone.replace(/^\+/, '');

        const waMessage = encodeURIComponent(
            `Hola ${data.clientName}, esperamos que hayas disfrutado tu sesión en NR BALANCE. ` +
            `Nos ayudaría muchísimo que nos dejaras una reseña aquí: ${reviewLink} 🙏`
        );
        const whatsappLink = `https://wa.me/${waPhone}?text=${waMessage}`;

        // ── Build event description ──
        const description = [
            `👤 Paciente: ${data.clientName}`,
            `📧 Email: ${data.clientEmail}`,
            `📱 Teléfono: ${data.clientPhone}`,
            `📋 Servicio: ${data.serviceName}`,
            ``,
            `─────────────────────────────`,
            `⭐ ENLACE RESEÑA (post-sesión):`,
            `Haz clic para enviar WhatsApp pidiendo reseña:`,
            whatsappLink,
            `─────────────────────────────`,
        ].join('\n');

        // ── Create Google Calendar event ──
        const eventId = await createCalendarEvent({
            summary: `[NR Balance] ${data.serviceName} — ${data.clientName}`,
            description,
            start: data.start,
            end: data.end,
            attendeeEmail: data.clientEmail,
        });

        // ── Send confirmation email via Resend ──
        const startDate = new Date(data.start);
        const dateDisplay = startDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            timeZone: 'Europe/Madrid',
        });
        const timeDisplay = startDate.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Madrid',
            hour12: false,
        });

        try {
            await sendConfirmationEmail(
                data.clientEmail,
                data.clientName,
                data.serviceName,
                dateDisplay,
                timeDisplay
            );
        } catch (emailError: any) {
            // Log but don't fail the booking if email fails
            console.error('[/api/book] Email send failed:', emailError.message);
        }

        return new Response(
            JSON.stringify({ success: true, eventId }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error: any) {
        console.error('[/api/book] Error:', error.message);
        return new Response(
            JSON.stringify({ error: 'Error interno al procesar la reserva.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
