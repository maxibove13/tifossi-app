# Propuesta: Configuración y Testing Android - Tifossi

## Contexto

Esta propuesta cubre el trabajo necesario para habilitar la aplicación Tifossi en Android, incluyendo configuración del codebase, testing en emulador, corrección de bugs y publicación en Google Play Store.

El objetivo es lograr una experiencia Android equivalente a la versión iOS, asegurando que la UI sea responsive en dispositivos de gama alta (equivalentes a iPhone 16). No se crearán diseños nuevos, pero se garantizará que los existentes funcionen correctamente.

---

## Alcance Incluido

### Configuración del Codebase

- Registro de app Android en Firebase Console
- Configuración de `google-services.json` con credenciales reales
- Ajustes de UI específicos de plataforma (safe areas, elevations, shadows)
- Configuración de reglas ProGuard para Firebase, Google Services y Expo
- Configuración de `assetlinks.json` para deep linking en Android

### Testing en Emulador

- Setup de entorno Android (emulador configurado y build exitoso)
- Testing sistemático de flujos críticos:
  - Autenticación (registro, login, Google Sign-In)
  - Navegación y UI responsive
  - Carrito y flujo de compra
  - Pagos (entorno sandbox MercadoPago)
  - Deep linking
- Corrección de bugs encontrados durante el testing
- Documentación de issues con clasificación de severidad

### Publicación en Google Play

- Generación de build de producción con EAS Build
- Configuración de Google Play App Signing
- Subida del AAB a Google Play Console
- Gestión del proceso de revisión inicial

---

## Alcance Excluido

- Cuenta de Google Play Developer (responsabilidad del cliente, costo $25 USD)
- Creación de listing en Google Play Store (capturas, descripciones, metadatos)
- Testing en dispositivos físicos Android

---

## Entregables

| Entregable | Descripción |
|------------|-------------|
| Build Android funcional | Aplicación corriendo exitosamente en emulador Android |
| Configuración Firebase | App Android registrada y autenticación operativa |
| Código actualizado | Repositorio con ajustes de plataforma Android |
| Reporte de testing | Documento con bugs encontrados, severidad y estado de resolución |
| App publicada | Aplicación subida a Google Play Store |

---

## Criterio de Aceptación

La entrega se considera completa cuando:

1. La aplicación compila sin errores para Android
2. Los flujos de autenticación funcionan en emulador
3. El flujo de compra completo funciona en entorno sandbox
4. La aplicación está subida a Google Play Store
5. Se entrega documentación de cualquier bug pendiente

---

## Estimación

| Tarea | Horas |
|-------|-------|
| Configuración Firebase Android | 1h |
| Ajustes de código y UI (platform checks, safe areas) | 5h |
| Reglas ProGuard | 2h |
| Deep linking (assetlinks.json) | 2h |
| Setup emulador + build exitoso | 3h |
| Testing sistemático de flujos | 10h |
| Publicación en Google Play | 3h |
| Contingencia | 4h |
| **Total** | **30h** |

---

## Inversión

| Concepto | Valor |
|----------|-------|
| Horas estimadas | 30 horas |
| Tarifa por hora | $20 USD |
| **Total** | **$600 USD** |

---

## Notas Importantes

1. Esta propuesta asume que la versión iOS está estable y funcional
2. El cliente debe proporcionar acceso a Firebase Console y Google Play Console
3. El cliente es responsable de crear el listing de la app (capturas, descripciones, categoría)
