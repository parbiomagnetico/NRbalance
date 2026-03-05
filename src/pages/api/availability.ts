/**
 * GET /api/availability
 * Returns available time slots for a given date and service.
 * Query params: ?date=YYYY-MM-DD&service=deep-tissue
 */
import type { APIRoute } from 'astro';
import { getAvailableSlots } from '../../lib/google-calendar';

export const GET: APIRoute = async ({ url }) => {
    try {
        const dateStr = url.searchParams.get('date');
        const serviceId = url.searchParams.get('service');

        if (!dateStr || !serviceId) {
            return new Response(
                JSON.stringify({ error: 'Parámetros "date" y "service" requeridos.' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return new Response(
                JSON.stringify({ error: 'Formato de fecha inválido. Usa YYYY-MM-DD.' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const slots = await getAvailableSlots(dateStr, serviceId);

        return new Response(
            JSON.stringify({ date: dateStr, service: serviceId, slots }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store, max-age=0',
                },
            }
        );
    } catch (error: any) {
        console.error('[/api/availability] Error:', error.message);
        return new Response(
            JSON.stringify({ error: 'Error al consultar disponibilidad.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
