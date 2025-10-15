# Resumen de Funcionalidades de la App Tifossi

## Introducción

Tifossi es una aplicación móvil desarrollada con React Native y Expo para un e‑commerce de ropa deportiva. Se publicará en Apple App Store y Google Play Store. Este documento describe detalladamente el alcance funcional acordado para este desarrollo, establece claramente las funcionalidades incluidas y excluidas, y define las condiciones de entrega del proyecto.

## Supuestos Claves

- **Diseño UI cerrado**: se implementa exactamente el diseño aprobado en Figma. Cambios adicionales de diseño o flujo se cotizan aparte.
- **Datos iniciales**: el cliente cargará los productos y contenidos a través del panel administrativo de Strapi provisto. Se incluyen 10 productos de ejemplo para demostración.
- **Textos legales**: el cliente proporcionará Términos y Condiciones, Política de Privacidad y Políticas de Envío/Devolución antes de la publicación.
- **Infraestructura**: los costos de hosting y servicios externos (Render, Cloudinary, CFE) corren por cuenta del cliente según documento de costos adjunto.

## Funcionalidades Incluidas

### Pantalla de Inicio

- Carrusel de productos destacados gestionados desde Strapi
- Navegación por categorías configurables
- Sección de productos destacados y novedades (etiquetas gestionables)
- Pie de página con información de marca y tiendas físicas

### Catálogo y Descubrimiento

- Navegación por categorías sincronizadas con Strapi
- Vista en cuadrícula de productos con paginación
- Filtros por talla, color, precio y etiquetas
- Búsqueda textual con resultados instantáneos desde API
- Sincronización en tiempo real con inventario de Strapi

### Detalles del Producto

- Galería de imágenes servidas desde Cloudinary
- Selector visual de colores y tallas con disponibilidad en tiempo real
- Descripción expandible (corta y larga)
- Agregar al carrito con cantidad, talla y color
- Marcar como favorito y ver productos relacionados
- Stock disponible actualizado desde Strapi

### Carrito de Compras

- Lista completa con opción de ajustar cantidades y eliminar productos (con deshacer)
- Validación de stock antes del checkout
- Subtotal calculado dinámicamente
- Persistencia local con sincronización al servidor
- Vista personalizada para carrito vacío

### Favoritos

- Vista en cuadrícula de favoritos sincronizados con cuenta
- Navegación al producto y eliminación rápida
- Sincronización entre dispositivos (vinculado a cuenta)
- Vista para estado vacío

### Flujo de Compra

- **Dirección de envío**: formulario con validación completa
- **Opción entre envío o retiro**: selector con costos diferenciados
- **Selección de tienda para retiro**: lista de tiendas desde Strapi
- **Método de pago**: MercadoPago Checkout Pro integrado
- **Procesamiento de orden**: creación en Strapi y proceso de pago
- **Confirmación**: orden guardada con estado y factura CFE

### Sistema de Pagos - MercadoPago

- **Checkout Pro**: solución hosted de MercadoPago (sin manejo de tarjetas en la app)
- **Métodos soportados**: todas las tarjetas y medios de pago de MercadoPago Uruguay
- **Webhooks**: actualización automática de estado de pago
- **Datos para facturación**: se almacenan todos los datos necesarios para que el cliente emita facturas CFE
- **Seguridad PCI-DSS**: cumplimiento garantizado por MercadoPago

### Tiendas Físicas

- Buscador de tiendas gestionadas desde Strapi
- Navegación por ciudad/zona
- Información completa: dirección, horarios, teléfono
- Selección para retiro en tienda

### Cuenta de Usuario y Autenticación

- **Perfil**: foto, nombre, email y gestión de cuenta
- **Autenticación Firebase**: Google Sign-In y Apple Sign-In
- **Gestión de sesión**: tokens seguros y refresh automático
- **Datos del usuario**: almacenados en Strapi vinculados con Firebase UID
- **Historial de pedidos**: sincronizado desde Strapi

### Backend - Panel Administrativo Strapi

- **Gestión de Productos**:
  - Crear, editar y eliminar productos
  - Gestión de imágenes con Cloudinary
  - Control de stock y variantes (tallas/colores)
  - Etiquetas y categorías
  - Precios y descuentos
- **Gestión de Órdenes**:
  - Vista de todas las órdenes con filtros
  - Cambio de estado (pendiente, procesando, enviado, entregado)
  - Detalles de pago de MercadoPago
  - Información del cliente y dirección de envío
- **Gestión de Contenido**:
  - Tiendas físicas (ubicaciones, horarios)
  - Categorías y colecciones
  - Banners y contenido promocional
- **Usuarios y Clientes**:
  - Lista de usuarios registrados
  - Historial de compras por cliente
  - Favoritos y preferencias

### API REST Strapi

- **Endpoints de productos**: listado, búsqueda, filtros, detalles
- **Gestión de órdenes**: crear, actualizar estado, historial
- **Autenticación**: integración con Firebase Auth
- **Webhooks MercadoPago**: recepción de notificaciones de pago
- **Sincronización**: favoritos y carrito del usuario

### Integración con Servicios Externos

- **Cloudinary**: almacenamiento y optimización de imágenes
- **MercadoPago**: procesamiento de pagos y webhooks
- **Firebase**: autenticación y gestión de usuarios
- **Nota CFE**: La app almacena todos los datos de ventas necesarios. El cliente gestiona la facturación electrónica CFE de forma independiente con su proveedor preferido

## Entregables y Criterios de Aceptación

| Entregable                    | Descripción                                                       | Criterio de aceptación                                                            |
| ----------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Código fuente**             | Repositorio Git completo con historial de commits y documentación | Compila sin errores, pasa linters y tests, completa todos los flujos acordados    |
| **Apps compiladas**           | Paquetes .ipa (iOS) y .aab (Android) firmados                     | Instalan correctamente, permiten registro/login y compra completa con MercadoPago |
| **Backend Strapi desplegado** | Instancia Strapi v4 operativa con base de datos PostgreSQL        | API responde correctamente, panel admin accesible, productos de ejemplo cargados  |
| **Panel Admin Strapi**        | Interfaz web completa para gestión de contenido                   | Permite CRUD completo de productos, gestión de órdenes, configuración de tiendas  |
| **Integración MercadoPago**   | Sistema de pagos configurado y probado                            | Procesa pagos, actualiza estados de orden, almacena datos para facturación        |
| **Documentación técnica**     | README, guías de configuración y variables de entorno             | Permite replicar el entorno de desarrollo y producción                            |
| **Publicación en tiendas**    | Apps publicadas en App Store y Google Play                        | Aprobadas y disponibles públicamente con listing completo                         |

## Arquitectura Técnica Implementada

### Frontend (React Native + Expo)

- **Framework**: Expo SDK 51+ con Expo Router para navegación
- **Estado**: 7 stores Zustand (auth, cart, favorites, product, payment, user, localStorage)
- **Persistencia**: MMKV para datos locales, SecureStore para tokens
- **UI**: Componentes optimizados con React.memo y lazy loading
- **Rendimiento**: Listas virtualizadas, caché de imágenes, búsqueda con debounce

### Backend (Strapi v4)

- **CMS**: Strapi v4.25+ con PostgreSQL
- **API**: REST con autenticación JWT
- **Schemas**: Products, Orders, Users, Categories, Stores, Colors, Sizes
- **Plugins**: Upload (Cloudinary), Email, i18n
- **Webhooks**: Integración con MercadoPago para actualización de pagos

### Servicios Integrados

- **Firebase Auth**: Google y Apple Sign-In únicamente
- **MercadoPago**: Checkout Pro con webhooks para pagos
- **Cloudinary**: CDN y transformación de imágenes
- **CFE**: Facturación electrónica (proveedor a definir por cliente)

### Infraestructura Recomendada

- **Hosting**: Render.com (servidor + base de datos)
- **CDN**: Cloudinary (plan gratuito inicial)
- **Costos estimados**: USD $35/mes + 5.23% comisión MercadoPago
- **CFE**: Cliente gestiona facturación con su proveedor actual o nuevo (no incluido)

## Publicación en Tiendas

- El cliente creará y financiará las cuentas en Apple Developer Program ($99/año) y Google Play Console ($25 único)
- El desarrollador gestionará la preparación inicial (capturas, metadatos) y la subida
- Re‑subidas ilimitadas hasta aprobación final sin costo adicional durante los primeros 30 días

## Soporte Post‑Entrega

- **Garantía de bugs**: 6 meses para corrección de errores críticos sin costo
- **Mantenimiento menor**: Ajustes menores incluidos por 3 meses
- **Actualizaciones de SDK**: No incluidas, se cotizan por separado
- **Nuevas funcionalidades**: Presupuesto adicional según alcance

## Responsabilidades del Cliente

- **Cuentas y pagos**: Developer accounts, MercadoPago, hosting
- **Contenido**: Productos, descripciones, imágenes, textos legales
- **Facturación CFE**: ⚠️ **IMPORTANTE** - El cliente debe contratar y gestionar su propio proveedor de facturación electrónica CFE (obligatorio en Uruguay). La app proporciona todos los datos de ventas necesarios pero NO realiza la integración con sistemas CFE
- **Configuración fiscal**: Cuentas de comerciante, impuestos
- **Operaciones**: Logística, envíos, devoluciones, atención al cliente
- **Marketing**: Promoción, SEO/ASO, campañas publicitarias

## Funcionalidades Explícitamente Excluidas

### Funciones Generales

- Accesibilidad avanzada (lector de pantalla, tamaño de texto dinámico)
- Notificaciones push (preparado para futura implementación)
- Analytics avanzado (solo eventos básicos)
- Deep linking diferido para campañas
- Recomendaciones con IA
- Soporte multiidioma (solo español)
- Progressive Web App o versión web
- Modo oscuro/claro (cambio de tema)
- Autenticación biométrica (Face ID/Touch ID)
- Búsqueda por voz, imagen o código de barras
- Comparación lado a lado de productos
- Historial de productos vistos recientemente

### Experiencia de Usuario y Personalización

- Onboarding interactivo o tutorial guiado
- Tips y ayuda contextual
- Múltiples listas de deseos
- Exportación de datos personales (GDPR)
- Eliminación automática de cuenta
- Configuración de privacidad granular
- Historial de navegación detallado
- Sincronización con calendario del dispositivo
- Integración con contactos del teléfono

### Engagement y Social

- Chat en vivo o chatbot
- Sistema de reseñas y ratings
- Compartir en redes sociales
- Wishlist compartida
- Programa de referidos
- Gamificación

### Promociones y Marketing

- Sistema de cupones complejos
- Tarjetas de regalo digitales
- Programa de puntos/fidelidad
- Ventas flash con contador
- Bundles dinámicos
- Descuentos por volumen
- Carritos abandonados con recuperación automática
- Descuentos automáticos primera compra
- Remarketing basado en comportamiento
- Segmentación automática de clientes

### Gestión Avanzada de Pedidos

- Tracking GPS de envíos en tiempo real
- Devoluciones automáticas en app
- Modificación de pedidos post-compra
- Cancelación automática por tiempo límite
- Suscripciones recurrentes
- Reserva de productos sin stock
- Pre-órdenes o backorders
- Gestión de tallas agotadas con notificación
- Múltiples métodos de pago por pedido
- Pedidos parciales con múltiples envíos

### Integraciones No Incluidas

- ERP/Odoo (se cotiza por separado)
- WhatsApp Business API
- Email marketing automatizado
- SMS transaccionales
- Otros procesadores de pago (PayPal, Stripe, etc.)
- Sistemas de inventario externos
- Servicios de courier (DAC, UES, etc.)
- Cálculo dinámico de envío por API
- Plataformas de atención al cliente (Zendesk, etc.)
- Herramientas de Business Intelligence

### Infraestructura y Backend Avanzado

- Dashboard de analytics personalizado
- Reportes automáticos y exportables
- A/B testing
- Gestión multi-tienda compleja
- API GraphQL
- Microservicios
- Actualizaciones en tiempo real (WebSockets)
- Cache avanzado con Redis
- Auto-scaling y balanceo de carga
- Backups automáticos programados
- API rate limiting avanzado
- Monitoreo y alertas automáticas

### Logística y Envíos

- Cálculo de envío en tiempo real por ubicación
- Múltiples opciones de envío (express, programado)
- Gestión de zonas de envío con restricciones
- Integración directa con empresas de logística
- Alertas automáticas de stock bajo
- Sistema de inventario predictivo

### Pagos y Facturación

- Wallets digitales nativos (Apple Pay, Google Pay)
- Pagos diferidos o planes de cuotas propios
- Sistema de crédito o monedero interno
- Multi-factor authentication (2FA con SMS)
- Facturación automática CFE integrada

## Gestión de Cambios

Cualquier funcionalidad no listada explícitamente en "Funcionalidades Incluidas" requerirá:

1. Evaluación de factibilidad técnica
2. Estimación de tiempo y costo
3. Aprobación formal antes de proceder
4. Ajuste de cronograma si corresponde

## Cierre

La entrega se considera completa cuando:

1. Todas las funcionalidades incluidas están operativas
2. El backend Strapi está desplegado y funcional
3. La integración con MercadoPago procesa pagos correctamente
4. Las apps están publicadas y aprobadas en ambas tiendas

Modificaciones posteriores se gestionarán mediante presupuesto adicional y proceso formal de control de cambios.

---

_Versión: 2.1 - Con exclusiones ampliadas basadas en análisis del código_
