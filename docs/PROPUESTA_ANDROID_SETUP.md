# Propuesta: Configuración y Testing Android - Tifossi

## Contexto

En el documento "Resumen de Funcionalidades de la App Tifossi" se estableció explícitamente como **excluido**:

> "Pruebas en dispositivos físicos Android"

La presente propuesta cubre el trabajo necesario para habilitar la aplicación en Android, incluyendo configuración del codebase, testing en emulador y corrección de bugs identificados durante el proceso.

---

## Alcance Incluido

### Configuración del Codebase

- Registro de app Android en Firebase Console
- Configuración de `google-services.json` con credenciales reales
- Ajuste de código específico de plataforma (botón Google Sign-In para Android)
- Configuración de reglas ProGuard para Firebase y Google Services
- Configuración de `assetlinks.json` para deep linking en Android

### Testing en Emulador

- Setup de entorno Android (emulador configurado y build exitoso)
- Testing sistemático de flujos críticos:
  - Autenticación (registro, login, Google Sign-In)
  - Navegación y UI
  - Carrito y flujo de compra
  - Pagos (entorno sandbox)
  - Deep linking
- Documentación de bugs encontrados con clasificación de severidad

### Corrección de Bugs

- Corrección de bugs descubiertos durante el testing (hasta 6 horas incluidas)
- Bugs que excedan este tiempo serán reportados y presupuestados por separado

---

## Alcance Excluido

- Cuenta de Google Play Developer (responsabilidad del cliente, costo $25 USD)
- Creación de listing en Google Play Store (capturas, descripciones, metadatos)
- Subida y gestión de revisión en Google Play
- Generación de keystore de producción para firma
- Testing en dispositivos físicos Android
- Bugs o issues reportados post-entrega

---

## Entregables

| Entregable | Descripción |
|------------|-------------|
| Build Android funcional | Aplicación corriendo exitosamente en emulador Android |
| Configuración Firebase | App Android registrada y autenticación operativa |
| Código actualizado | Repositorio con ajustes de plataforma Android |
| Reporte de testing | Documento con bugs encontrados, severidad y estado de resolución |

---

## Criterio de Aceptación

La entrega se considera completa cuando:

1. La aplicación compila sin errores para Android
2. Los flujos de autenticación funcionan en emulador
3. El flujo de compra completo funciona en entorno sandbox
4. Se entrega documentación de cualquier bug pendiente (si excede las 6h de buffer)

---

## Estimación

| Tarea | Horas |
|-------|-------|
| Configuración Firebase Android | 1h |
| Ajustes de código (Google Sign-In, platform checks) | 2h |
| Reglas ProGuard | 2h |
| Deep linking (assetlinks.json) | 1h |
| Setup emulador + build exitoso | 2h |
| Testing sistemático de flujos | 4h |
| Documentación de bugs | 2h |
| Buffer para corrección de bugs | 6h |
| **Total** | **20h** |

---

## Inversión

| Concepto | Valor |
|----------|-------|
| Horas estimadas | 20 horas |
| Tarifa por hora | $20 USD |
| **Total** | **$400 USD** |

---

## Condiciones

- **Forma de pago**: 50% al inicio, 50% contra entrega
- **Plazo estimado**: 2 semanas desde el inicio
- **Validez de la propuesta**: 30 días

---

## Notas Importantes

1. Esta propuesta asume que la versión iOS está estable y funcional
2. El cliente debe proporcionar acceso a Firebase Console si aún no está otorgado
3. Bugs críticos que excedan el buffer de 6 horas serán comunicados inmediatamente con estimación adicional
4. La publicación en Google Play Store no está incluida y puede cotizarse por separado

---

## Firma

**Proveedor**: _________________________ **Fecha**: _____________

**Cliente**: _________________________ **Fecha**: _____________
