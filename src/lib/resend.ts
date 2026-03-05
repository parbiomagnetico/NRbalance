/**
 * Resend Email Helper — NR Balance
 * Sends transactional emails for booking confirmations.
 */
import { Resend } from 'resend';

function getResendClient() {
    return new Resend(import.meta.env.RESEND_API_KEY);
}

export async function sendConfirmationEmail(
    to: string,
    clientName: string,
    serviceName: string,
    dateDisplay: string,
    timeDisplay: string
): Promise<string> {
    const resend = getResendClient();
    const fromAddress = import.meta.env.RESEND_FROM_EMAIL || 'NR Balance <reservas@nrbalance.es>';

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#F9F6F0; font-family:-apple-system, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9F6F0; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 16px rgba(0,0,0,0.04);">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#2C302B; padding:32px 40px; text-align:center;">
              <h1 style="margin:0; color:#F9F6F0; font-size:24px; font-weight:300; letter-spacing:4px;">NR BALANCE</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px; color:#BFA071; font-size:11px; text-transform:uppercase; letter-spacing:2px; font-weight:600;">Confirmación de cita</p>
              <h2 style="margin:0 0 24px; color:#2C302B; font-size:22px; font-weight:400;">Hola ${clientName}</h2>
              <p style="margin:0 0 32px; color:#666; font-size:15px; line-height:1.6;">Tu cita ha sido reservada con éxito. Aquí tienes los detalles:</p>

              <!-- Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9F6F0; border-radius:12px; margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:16px; border-bottom:1px solid #e8e4de;">
                          <p style="margin:0 0 4px; color:#999; font-size:11px; text-transform:uppercase; letter-spacing:1px;">Servicio</p>
                          <p style="margin:0; color:#2C302B; font-size:16px; font-weight:500;">${serviceName}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 0; border-bottom:1px solid #e8e4de;">
                          <p style="margin:0 0 4px; color:#999; font-size:11px; text-transform:uppercase; letter-spacing:1px;">Fecha</p>
                          <p style="margin:0; color:#2C302B; font-size:16px; font-weight:500;">${dateDisplay}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:16px;">
                          <p style="margin:0 0 4px; color:#999; font-size:11px; text-transform:uppercase; letter-spacing:1px;">Hora</p>
                          <p style="margin:0; color:#2C302B; font-size:16px; font-weight:500;">${timeDisplay}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Location -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td>
                    <p style="margin:0 0 4px; color:#999; font-size:11px; text-transform:uppercase; letter-spacing:1px;">📍 Ubicación</p>
                    <p style="margin:0; color:#2C302B; font-size:15px;">Av. de la Libertad 12, Local B</p>
                  </td>
                </tr>
              </table>

              <hr style="border:none; border-top:1px solid #eee; margin:0 0 24px;">

              <p style="margin:0; color:#999; font-size:13px; line-height:1.6;">
                Si necesitas cancelar o modificar tu cita, responde a este email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F9F6F0; padding:24px 40px; text-align:center; border-top:1px solid #e8e4de;">
              <p style="margin:0; color:#BFA071; font-size:12px; letter-spacing:1px;">NR BALANCE ✳</p>
              <p style="margin:8px 0 0; color:#aaa; font-size:11px;">Psicología Clínica & Masaje Terapéutico</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
        from: fromAddress,
        to,
        subject: `✅ Cita confirmada — ${serviceName} | NR Balance`,
        html,
    });

    if (error) {
        throw new Error(`Resend error: ${error.message}`);
    }

    return data?.id || '';
}
