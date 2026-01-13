/**
 * Auth redirect controller
 * Handles Firebase email action links and redirects to the mobile app
 */

export default {
  /**
   * Handles Firebase email action links (verify email, reset password)
   * Redirects to the mobile app via deep link
   */
  async emailAction(ctx: any) {
    const { mode, oobCode, continueUrl, lang } = ctx.query;

    // Validate required parameter
    if (!oobCode) {
      ctx.type = 'text/html';
      ctx.status = 400;
      ctx.body = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enlace Invalido - Tifossi</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
    }
    .container { text-align: center; padding: 40px 20px; max-width: 400px; }
    .logo {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 24px;
      background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    h1 { font-size: 24px; margin-bottom: 12px; font-weight: 600; }
    p { color: #a0a0a0; margin-bottom: 32px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">TIFOSSI</div>
    <h1>Enlace Invalido</h1>
    <p>Este enlace no es valido o ha expirado. Por favor solicita un nuevo enlace desde la app.</p>
  </div>
</body>
</html>`;
      return;
    }

    // Build query string preserving all params
    const params = new URLSearchParams();
    if (mode) params.set('mode', mode);
    if (oobCode) params.set('oobCode', oobCode);
    if (continueUrl) params.set('continueUrl', continueUrl);
    if (lang) params.set('lang', lang);

    const queryString = params.toString();

    // Determine the deep link path based on mode
    let deepLinkPath = '/auth/verify-email';
    let actionTitle = 'Verificar Email';
    let actionDescription = 'Verificando tu cuenta...';

    if (mode === 'resetPassword') {
      deepLinkPath = '/auth/reset-password';
      actionTitle = 'Restablecer Contraseña';
      actionDescription = 'Redirigiendo para restablecer tu contraseña...';
    } else if (mode === 'recoverEmail') {
      deepLinkPath = '/auth/recover-email';
      actionTitle = 'Recuperar Email';
      actionDescription = 'Redirigiendo para recuperar tu email...';
    }

    const deepLink = `tifossi://${deepLinkPath}?${queryString}`;

    // Serve HTML page that redirects to the app
    ctx.type = 'text/html';
    ctx.body = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${actionTitle} - Tifossi</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
    }
    .container {
      text-align: center;
      padding: 40px 20px;
      max-width: 400px;
    }
    .logo {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 24px;
      background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(255, 107, 53, 0.2);
      border-top-color: #FF6B35;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 24px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h1 {
      font-size: 24px;
      margin-bottom: 12px;
      font-weight: 600;
    }
    p {
      color: #a0a0a0;
      margin-bottom: 32px;
      line-height: 1.5;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
      color: white;
      padding: 16px 32px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(255, 107, 53, 0.4);
    }
    .help {
      margin-top: 24px;
      font-size: 14px;
      color: #666;
    }
  </style>
  <script>
    // Try to redirect immediately
    window.location.href = '${deepLink}';

    // Fallback: try again after a short delay
    setTimeout(function() {
      window.location.href = '${deepLink}';
    }, 100);
  </script>
</head>
<body>
  <div class="container">
    <div class="logo">TIFOSSI</div>
    <div class="spinner"></div>
    <h1>${actionTitle}</h1>
    <p>${actionDescription}</p>
    <a href="${deepLink}" class="btn">Abrir en Tifossi</a>
    <p class="help">Si la app no se abre automaticamente, toca el boton de arriba.</p>
  </div>
</body>
</html>`;
  },
};
