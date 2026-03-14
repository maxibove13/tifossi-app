# Guía de Configuración Backend - Tifossi App

## Cuentas Requeridas para el Backend y Servicios

### 1. **Render.com (Hosting del Backend)**

**Costo**: $35 USD/mes para el plan Production

**Pasos para crear la cuenta:**

1. Ir a https://render.com y crear una cuenta
2. Verificar el email
3. Agregar método de pago (tarjeta de crédito)
4. Crear un nuevo Web Service para Strapi

**Agregar desarrolladores al equipo:**

1. En el Dashboard de Render, ir a "Settings" → "Team"
2. Click en "Invite Team Member"
3. Invitar a los desarrolladores con rol "Admin" o "Developer"
4. Los desarrolladores recibirán un email para unirse al equipo

**Información que necesitamos:**

- Email de la cuenta
- Nombre del proyecto: `tifossi-backend`
- Region: Sao Paulo (más cercano a Uruguay)

**Credenciales a proporcionar:**

```
RENDER_API_KEY=
RENDER_SERVICE_ID=
DATABASE_URL= (será generado por Render)
```

---

### 2. **MercadoPago (Procesamiento de Pagos)**

**Costo**: 5.23% por transacción (sin costo mensual fijo)

**Pasos para crear la cuenta:**

1. Crear cuenta de MercadoPago Business en https://www.mercadopago.com.uy/hub/registration
2. Completar verificación de identidad y datos bancarios
3. Activar el modo producción (requiere documentación de la empresa)
4. Obtener las credenciales de producción

**Agregar desarrolladores:**

1. Ingresar a https://www.mercadopago.com.uy/developers/panel
2. Ir a "Configuración" → "Gestión de equipo"
3. Click en "Invitar colaborador"
4. Asignar permisos de "Desarrollador" o "Administrador"
5. El desarrollador recibirá una invitación por email

**Credenciales necesarias (PRODUCCIÓN):**

```
MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_CLIENT_ID=
MERCADOPAGO_CLIENT_SECRET=
```

**Credenciales de SANDBOX (para pruebas):**

```
MERCADOPAGO_SANDBOX_PUBLIC_KEY=
MERCADOPAGO_SANDBOX_ACCESS_TOKEN=
```

**Configuración importante:**

- Configurar URL de webhook: `https://tifossi-strapi-backend.onrender.com/api/webhooks/mercadopago`
- Activar notificaciones IPN (Instant Payment Notification)
- URLs de retorno: No configurar manualmente en el dashboard de MercadoPago.
  Las `back_urls` se configuran automáticamente en cada preferencia de pago y redirigen
  a través del backend (`/api/payment/redirect`) para evitar el error "Safari cannot
  open the page" con esquemas URL personalizados.

---

### 3. **Firebase (Autenticación)**

**Costo**: Gratis para hasta 50,000 autenticaciones/mes

**Pasos para crear el proyecto:**

1. Ir a https://console.firebase.google.com
2. Crear nuevo proyecto: "tifossi-production"
3. Habilitar Authentication
4. Configurar métodos de inicio de sesión:
   - Email/Password
   - Google Sign-In
   - Apple Sign-In (requiere cuenta de Apple Developer)

**Agregar desarrolladores al proyecto:**

1. En Firebase Console, ir a "Project Settings" → "Users and permissions"
2. Click en "Add member"
3. Ingresar el email del desarrollador
4. Asignar rol "Editor" o "Owner"
5. El desarrollador recibirá una invitación por email

**Archivos necesarios:**

- `google-services.json` (para Android)
- `GoogleService-Info.plist` (para iOS)

**Credenciales del proyecto:**

```
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_MEASUREMENT_ID=
```

---

### 4. **Cloudinary (Almacenamiento de Imágenes)**

**Costo**: Gratis hasta 25GB de almacenamiento y 25GB de ancho de banda/mes

**Pasos para crear la cuenta:**

1. Registrarse en https://cloudinary.com
2. Verificar email
3. Obtener credenciales del dashboard

**Agregar desarrolladores:**

1. En el Dashboard de Cloudinary, ir a "Settings" → "Users"
2. Click en "Invite users"
3. Ingresar email del desarrollador
4. Asignar rol "Developer" o "Admin"
5. El desarrollador recibirá invitación por email

**Credenciales necesarias:**

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_URL=
```

---

## Credenciales de Desarrollo/Testing

### MercadoPago Sandbox

**IMPORTANTE**: Las credenciales de prueba deben obtenerse desde el panel de MercadoPago:

1. **Crear usuarios de prueba:**
   - Ingresar a https://www.mercadopago.com.uy/developers/panel
   - Ir a "Usuarios de prueba"
   - Crear un usuario VENDEDOR (para recibir pagos)
   - Crear un usuario COMPRADOR (para hacer pagos de prueba)
   - MercadoPago generará automáticamente emails y contraseñas únicos

2. **Tarjetas de prueba para Uruguay:**
   - Consultar tarjetas oficiales en: https://www.mercadopago.com.uy/developers/es/docs/checkout-api/additional-content/your-integrations/test/cards
   - Usar tarjetas específicas para simular:
     - Pagos aprobados
     - Pagos rechazados
     - Pagos pendientes
3. **Credenciales Sandbox del vendedor:**
   - Access Token de prueba
   - Public Key de prueba
   - Se obtienen del panel usando el usuario VENDEDOR de prueba

### Firebase (Desarrollo)

Proyecto: `tifossi-development`

- Ya configurado en el código actual

---

## Orden de Configuración Recomendado

1. **Primero**: Crear cuenta de Render.com (necesario para el backend)
2. **Segundo**: Configurar MercadoPago (al menos sandbox para pruebas)
3. **Tercero**: Firebase en producción
4. **Cuarto**: Cloudinary

---

## Información de Contacto para Soporte

- **Render**: support@render.com
- **MercadoPago Uruguay**: https://www.mercadopago.com.uy/ayuda
- **Firebase**: https://firebase.google.com/support
- **Cloudinary**: support@cloudinary.com

---

## Checklist de Información a Proporcionar

Por favor, proporcione la siguiente información una vez creadas las cuentas:

### Credenciales Requeridas:

- [ ] Acceso a Render.com (invitación al equipo enviada)
- [ ] Credenciales de MercadoPago (público y privado)
- [ ] Proyecto de Firebase creado con nombre "tifossi-production"
- [ ] Credenciales de Cloudinary
- [ ] Dominio personalizado (si desea uno diferente a .onrender.com)

### Acceso para Desarrolladores:

- [ ] Invitación enviada en Render.com al email del desarrollador
- [ ] Invitación enviada en MercadoPago Developers al email del desarrollador
- [ ] Invitación enviada en Firebase Console al email del desarrollador
- [ ] Invitación enviada en Cloudinary al email del desarrollador

### Configuración Inicial:

- [ ] Variables de entorno configuradas en Render
- [ ] Webhook de MercadoPago configurado
- [ ] Firebase Authentication habilitado
- [ ] Cloudinary Upload Presets configurados

---

## Notas Importantes

1. **MercadoPago**: La activación del modo producción puede demorar 2-3 días hábiles después de enviar la documentación.

2. **Render.com**: El plan gratuito tiene limitaciones (spin down después de 15 minutos de inactividad). Recomendamos el plan de $35/mes para producción.

3. **Firebase**: Las credenciales de producción deben mantenerse seguras y no compartirse públicamente.

4. **Backup**: Recomendamos configurar backups automáticos en Render para la base de datos PostgreSQL.

5. **Acceso de Desarrolladores**: Es importante invitar a los desarrolladores con los permisos adecuados para que puedan configurar y mantener los servicios.

---

## Email del Desarrollador para Invitaciones

Por favor, enviar las invitaciones de acceso a las plataformas al siguiente email:

- **Email**: <your-developer-email>

Una vez recibidas las invitaciones, procederemos con:

1. Configuración del backend en Render
2. Setup de base de datos PostgreSQL
3. Configuración de webhooks de MercadoPago
4. Integración con Firebase Authentication
5. Setup de Cloudinary para imágenes
6. Pruebas de integración completas
