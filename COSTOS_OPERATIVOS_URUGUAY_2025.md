# Tifossi E-commerce - Costos Operativos para Uruguay (Agosto 2025)

---

## 📊 Costos Anuales Totales

| Componente | Costo Mensual | Costo Anual | Notas |
|------------|---------------|-------------|--------|
| **Hosting (Render)** | $35 | $420 | Servidor web + Base de datos + Redis |
| **Almacenamiento Multimedia (Cloudinary)** | $0-89 | $0-1.068 | Inicia gratis, escala según uso |
| **Autenticación (Firebase)** | $0 | $0 | Inicio con Google/Apple |
| **Cuentas App Store** | - | $124 | Google Play (único) + Apple (anual) |
| **TOTAL** | **$35** | **$544** | Primer año |

---

## 1️⃣ Costos de Infraestructura

### Hosting - Render.com (Precios Fijos Mensuales)
- **Servidor Web Starter**: $7/mes (512MB RAM, 0.5 CPU)
- **Base de Datos PostgreSQL**: $7/mes (1GB almacenamiento)
- **Redis Cache**: $7/mes (caché para rendimiento)
- **Almacenamiento adicional**: $14/mes (buffer de crecimiento)
- **Total**: **$35/mes**

#### Cuando necesitará actualizar (crecimiento futuro):
- **Servidor Web Standard**: $25/mes (2GB RAM, 1 CPU)
- **PostgreSQL Standard**: $25/mes (10GB almacenamiento)
- **Total con crecimiento**: $57/mes

**Nota**: Render cobra precios fijos mensuales, no por uso. El costo es el mismo independientemente del tráfico.

### Almacenamiento Multimedia - Cloudinary

#### Plan Gratuito (Para empezar)
- **Límites**: 25GB almacenamiento, 25GB ancho de banda/mes
- **Suficiente para**: ~300 productos con 5-6 imágenes c/u
- **Costo**: **$0/mes**

#### Cuándo necesitará actualizar:
- Más de 300 productos activos
- Más de 10,000 visitas mensuales
- Videos promocionales pesados

#### Plan Plus (Cuando crezca)
- **Costo**: $89/mes
- **Incluye**: 225GB almacenamiento, 225GB ancho de banda
- **Suficiente para**: Miles de productos

---

## 2️⃣ Procesamiento de Pagos - MercadoPago

### Solo Comisiones por Transacción
| Período de Liquidación | Tasa de Comisión |
|------------------------|------------------|
| 14 días | 5,23% |
| 30 días | 4,01% |

- **Sin costos de configuración**
- **Sin cuotas mensuales**
- **Sin mínimo de transacciones**
- **Procesamiento de productos físicos (ropa)**

---

## 3️⃣ Cumplimiento y Operaciones

### Facturación Electrónica CFE
⚠️ **IMPORTANTE**: La facturación electrónica CFE es responsabilidad del cliente
- El cliente debe contratar y gestionar su propio proveedor CFE (Siigo, Memory, Factura.uy, etc.)
- La app almacena todos los datos de ventas necesarios para facturación
- El cliente puede exportar datos de ventas desde el panel Strapi para su sistema CFE
- Costo estimado CFE: $45/mes (NO incluido en este presupuesto)

### Notificaciones a Clientes
- **Confirmaciones de pago**: Enviadas automáticamente por MercadoPago
- **Facturas CFE**: El cliente las gestiona con su proveedor CFE
- **Push notifications**: No incluidas en este presupuesto

---

## 4️⃣ Publicación en App Stores

### Costos de Publicación
- **Google Play Store**: $25 (pago único, para siempre)
- **Apple App Store**: $99/año (renovación anual)
- **Total Primer Año**: $124
- **Años siguientes**: Solo $99 (Apple)

### Nota Importante
- **Sin comisiones de app stores**: Los productos físicos (ropa) se procesan externamente con MercadoPago
- **Las tiendas de apps NO cobran comisión** sobre ventas de productos físicos

---

## 💰 Resumen de Costos Totales

### Inversión Año 1 (Con plan gratuito Cloudinary)
```
Infraestructura:          $420  (Render config. recomendada)
Almacenamiento Media:       $0  (gratuito al inicio)
App Stores:               $124
--------------------------------
Costos Fijos Totales:     $544

Más: 5,23% de ingresos brutos (MercadoPago)
```

**Notas importantes**:
- Si excede límites de Cloudinary, agregar $89/mes ($1.068/año)
- CFE facturación electrónica NO incluida (responsabilidad del cliente, ~$45/mes con proveedores locales)

### Año 2+ (Recurrente)
```
Infraestructura:          $420  (config. recomendada)
Almacenamiento Media:   $0-1.068  (según crecimiento)
Apple App Store:           $99
--------------------------------
Costos Fijos Totales:     $519/año (mínimo)
                        $1.587/año (con Cloudinary Plus)

Más: 5,23% de ingresos brutos (MercadoPago)
```

**Recordatorio**: Facturación CFE gestionada independientemente por el cliente

---

---

*Todos los montos en USD. Precios vigentes a agosto 2025.*