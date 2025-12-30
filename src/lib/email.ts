import nodemailer from 'nodemailer';

/**
 * Configuración del transportador de Gmail
 */
function createTransporter() {
  let email = process.env.GMAIL_EMAIL;
  let password = process.env.GMAIL_APP_PASSWORD;

  if (!email || !password) {
    throw new Error('GMAIL_EMAIL y GMAIL_APP_PASSWORD deben estar configurados en las variables de entorno');
  }

  // Limpiar comillas y espacios en los extremos (por si vienen de Cloud Run con comillas)
  email = email.trim().replace(/^["']|["']$/g, '');
  password = password.trim().replace(/^["']|["']$/g, '');

  // Eliminar espacios de la contraseña (las contraseñas de aplicación de Gmail pueden tener espacios)
  // pero nodemailer necesita que estén sin espacios
  password = password.replace(/\s+/g, '');

  console.log('Configurando Gmail con email:', email);
  console.log('Longitud de contraseña:', password.length);

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: password, // Contraseña de aplicación de Gmail
    },
  });
}

/**
 * Enviar correo de recuperación de contraseña
 */
export async function sendPasswordResetEmail(to: string, resetToken: string, username: string) {
  const transporter = createTransporter();
  // Limpiar comillas y espacios de la URL base si los hay
  let baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').trim();
  baseUrl = baseUrl.replace(/^["']|["']$/g, ''); // Eliminar comillas al inicio y final
  // Asegurar que no termine con /
  baseUrl = baseUrl.replace(/\/$/, '');
  // Codificar el token en la URL para evitar problemas con caracteres especiales
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  
  console.log('URL de reset generada:', resetUrl);

  const mailOptions = {
    from: `"El Signo Amarillo" <${process.env.GMAIL_EMAIL}>`,
    to,
    subject: 'Recuperación de Contraseña - El Signo Amarillo',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #0A0E1A;
              color: #F4C430;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #121825;
              border: 2px solid #2D9B96;
              border-radius: 10px;
              padding: 30px;
            }
            .logo {
              text-align: center;
              margin-bottom: 20px;
            }
            h1 {
              color: #F4C430;
              text-align: center;
            }
            .content {
              color: #4ECDC4;
              line-height: 1.6;
            }
            .button {
              display: inline-block;
              background-color: #F4C430;
              color: #0A0E1A !important;
              padding: 12px 30px;
              text-decoration: none !important;
              border-radius: 5px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
              cursor: pointer;
            }
            .button:hover {
              background-color: #2D9B96;
              color: white !important;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #2D9B96;
              color: #4ECDC4;
              font-size: 12px;
              text-align: center;
            }
            .warning {
              background-color: #1A2332;
              border-left: 4px solid #F4C430;
              padding: 15px;
              margin: 20px 0;
              color: #4ECDC4;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <h1>⚜️ El Signo Amarillo</h1>
            </div>
            <h1>Recuperación de Contraseña</h1>
            <div class="content">
              <p>Hola <strong>${username}</strong>,</p>
              <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
              <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button" style="display: inline-block; background-color: #F4C430; color: #0A0E1A !important; padding: 12px 30px; text-decoration: none !important; border-radius: 5px; font-weight: bold; cursor: pointer;">Restablecer Contraseña</a>
              </div>
              <p>O copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; color: #2D9B96; margin: 10px 0;">
                <a href="${resetUrl}" style="color: #2D9B96; text-decoration: underline;">${resetUrl}</a>
              </p>
              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                  <li>Este enlace expirará en 1 hora</li>
                  <li>Si no solicitaste este cambio, ignora este correo</li>
                  <li>Tu contraseña actual seguirá siendo válida hasta que la cambies</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>Este es un correo automático, por favor no respondas.</p>
              <p>© El Signo Amarillo - Constructor de Mazos</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Recuperación de Contraseña - El Signo Amarillo
      
      Hola ${username},
      
      Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
      
      Haz clic en el siguiente enlace para crear una nueva contraseña:
      ${resetUrl}
      
      Este enlace expirará en 1 hora.
      
      Si no solicitaste este cambio, ignora este correo.
      
      Este es un correo automático, por favor no respondas.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Correo de recuperación enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error enviando correo de recuperación:', error);
    throw error;
  }
}

/**
 * Verificar que la configuración de email esté disponible
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD);
}

