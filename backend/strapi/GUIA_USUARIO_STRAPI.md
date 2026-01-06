# Guía de Usuario - Strapi CMS para Tifossi

Bienvenido a la guía de usuario de Strapi para gestionar el contenido de la aplicación móvil Tifossi. Esta guía te ayudará a administrar productos, ubicaciones de tiendas, pedidos y más.

## Tabla de Contenidos

1. [Introducción a Strapi](#1-introducción-a-strapi)
2. [Acceso y Navegación Básica](#2-acceso-y-navegación-básica)
3. [Gestión de Productos](#3-gestión-de-productos)
4. [Gestión de Medios](#4-gestión-de-medios)
5. [Gestión de Categorías](#5-gestión-de-categorías)
6. [Gestión de Modelos de Producto](#6-gestión-de-modelos-de-producto)
7. [Gestión de Estados de Producto](#7-gestión-de-estados-de-producto)
8. [Gestión de Ubicaciones de Tienda](#8-gestión-de-ubicaciones-de-tienda)
9. [Gestión de Pedidos](#9-gestión-de-pedidos)
10. [Configuración de la Aplicación](#10-configuración-de-la-aplicación)
11. [Gestión de Usuarios](#11-gestión-de-usuarios)
12. [Consejos y Buenas Prácticas](#12-consejos-y-buenas-prácticas)

---

## 1. Introducción a Strapi

### ¿Qué es Strapi?

Strapi es el sistema de gestión de contenidos (CMS) que alimenta la aplicación móvil de Tifossi. A través de Strapi, puedes:

- Crear y editar productos con variantes de color y talla
- Gestionar imágenes específicas por color de producto
- Configurar ubicaciones de tiendas con horarios detallados
- Visualizar y gestionar pedidos de clientes
- Controlar configuraciones globales de la aplicación
- Administrar usuarios y sus perfiles

### ¿Cómo acceder?

1. Abre tu navegador web (Chrome, Firefox, Safari, etc.)
2. Ingresa la URL del panel de administración de Strapi
3. Introduce tu usuario y contraseña
4. Haz clic en "Iniciar sesión"

**Importante**: Guarda tus credenciales en un lugar seguro. Si olvidas tu contraseña, contacta al administrador del sistema.

---

## 2. Acceso y Navegación Básica

### El Panel de Administración

Una vez que inicies sesión, verás el panel de administración dividido en varias secciones:

#### Menú Principal (Barra Lateral Izquierda)

- **Content Manager**: Donde administrarás todos tus contenidos
- **Media Library**: Biblioteca de imágenes y archivos
- **Settings**: Configuraciones del sistema

#### Sección Content Manager

Dentro de Content Manager encontrarás todos los tipos de contenido:

**Collection Types (Colecciones)**:
- **Products** (Productos)
- **Categories** (Categorías)
- **Product Models** (Modelos de Producto)
- **Product Statuses** (Estados de Producto)
- **Store Locations** (Ubicaciones de Tienda)
- **Orders** (Pedidos)
- **Users** (Usuarios)

**Single Types (Tipos Únicos)**:
- **App Settings** (Configuración de la App)

### Estados de Publicación

Todos los contenidos tienen dos estados importantes:

- **Draft** (Borrador): El contenido existe pero NO es visible en la aplicación
- **Published** (Publicado): El contenido ES visible en la aplicación

Siempre verifica el estado antes de guardar.

---

## 3. Gestión de Productos

Los productos son el corazón de tu catálogo. Aquí aprenderás a crearlos y gestionarlos.

### 3.1 Crear un Nuevo Producto

1. En el menú lateral, haz clic en **Content Manager**
2. Selecciona **Products** en la lista
3. Haz clic en el botón **+ Create new entry** (arriba a la derecha)
4. Completa el formulario con la información del producto

### 3.2 Campos del Producto

#### Información Básica

**Title** (Título) - OBLIGATORIO
- El nombre del producto que verán los usuarios
- Ejemplo: "Camiseta Peñarol Titular 2025"
- Máximo 255 caracteres
- Se muestra en tarjetas de producto y pantalla de detalle

**Slug** - OBLIGATORIO
- Se genera automáticamente a partir del título
- Es el identificador único del producto
- Ejemplo: "camiseta-penarol-titular-2025"
- Generalmente no necesitas modificarlo manualmente

**Price** (Precio) - OBLIGATORIO
- El precio regular del producto
- Ingresa solo números (ejemplo: 2500)
- No uses símbolos de moneda ($)
- Debe ser mayor o igual a 0

**Discounted Price** (Precio con Descuento) - OPCIONAL
- Usa este campo si el producto está en oferta
- Debe ser menor que el precio regular
- Si no hay descuento, déjalo vacío
- Cuando está presente, la app muestra el precio original tachado

#### Descripciones

**Short Description** (Descripción Corta) - OPCIONAL
Compuesto por dos campos:
- **Line 1** (OBLIGATORIO si usas descripción corta): Primera línea, máximo 100 caracteres
- **Line 2** (OPCIONAL): Segunda línea, máximo 100 caracteres

La app usa principalmente Line 1 para mostrar en las tarjetas de producto.

Ejemplo:
- Line 1: "Camiseta oficial Peñarol"
- Line 2: "Temporada 2025 - Material premium"

**Long Description** (Descripción Larga) - OPCIONAL
- Descripción detallada del producto
- Usa formato enriquecido (negrita, cursiva, listas)
- Se muestra en la sección de información del producto
- Si no hay descripción corta, se usa la primera parte de esta

#### Imágenes y Videos

**Front Image** (Imagen Principal) - OBLIGATORIO
- La imagen principal que aparece en tarjetas y como primera imagen en el detalle
- Solo se permite UNA imagen
- Recomendación: Mínimo 800x800 px, ideal 1200x1200 px
- Esta imagen se usa como fallback cuando un color no tiene imagen propia

**Images** (Imágenes Adicionales) - OPCIONAL
- Galería secundaria de imágenes del producto
- Puedes agregar múltiples imágenes
- Se muestran en el carrusel de la pantalla de detalle

**Video Source** (Video) - OPCIONAL
- Video del producto
- Se muestra en la galería del producto junto con las imágenes
- Formatos soportados: MP4, MOV

#### Relaciones y Clasificación

**Category** (Categoría) - OPCIONAL
- Selecciona la categoría a la que pertenece el producto
- Se usa para filtrado en la app
- Ejemplos: "Camisetas", "Accesorios", "Calzado"

> **Nota Técnica**: Actualmente la app usa una lista de categorías predefinida internamente. Las categorías de Strapi se sincronizan vía el campo `slug` de la categoría con el `categoryId` del producto.

**Model** (Modelo) - OPCIONAL
- El modelo específico dentro de la categoría
- Ejemplo: Si la categoría es "Camisetas", el modelo podría ser "Titular" o "Suplente"

> **Nota Técnica**: Similar a categorías, los modelos se sincronizan vía el campo `slug`.

**Statuses** (Estados) - OPCIONAL
- Puedes asignar múltiples estados al producto
- Estos estados afectan cómo se muestra y filtra el producto en la app:
  - **new**: Muestra badge "Nuevo" en la tarjeta
  - **sale**: Indica que está en oferta (combina con discountedPrice)
  - **featured**: Aparece en sección "Destacados"
  - **popular**: Aparece en sección "Populares"
  - **recommended**: Se muestra en productos relacionados
  - **opportunity**: Ofertas especiales
  - **app_exclusive**: Exclusivo de la app
  - **highlighted**: Máxima visibilidad
- Haz clic en "Add relation" para agregar estados

#### Configuraciones del Producto

**Is Customizable** (Es Personalizable) - OPCIONAL
- Marca esta casilla si el producto puede personalizarse (ejemplo: con nombre y número)
- Por defecto está desmarcada
- Cuando está activo, la app muestra un badge "Personalizable"

**Warranty** (Garantía) - OPCIONAL
- Información sobre la garantía del producto
- Se muestra en la sección de detalles del producto
- Ejemplo: "30 días de garantía contra defectos de fabricación"

**Return Policy** (Política de Devolución) - OPCIONAL
- Condiciones para devoluciones
- Ejemplo: "Acepta devoluciones dentro de los 15 días con etiquetas originales"

> **Nota**: Actualmente la app muestra una política de devolución estándar independientemente de este campo.

**Dimensions** (Dimensiones) - OPCIONAL
Compuesto por los siguientes campos:
- **Length** (Largo): En la unidad seleccionada
- **Width** (Ancho): En la unidad seleccionada
- **Height** (Alto): En la unidad seleccionada
- **Weight** (Peso): En la unidad de peso seleccionada
- **Unit**: Unidad de medida (cm, in, mm) - por defecto "cm"
- **Weight Unit**: Unidad de peso (g, kg, lb, oz) - por defecto "g"

Las dimensiones se muestran en la pantalla de detalle del producto.

#### Variantes del Producto - COLORES

**Colors** (Colores) - OBLIGATORIO (mínimo 1)
Todo producto DEBE tener al menos UN color. Esta es la funcionalidad más importante para variantes.

Para cada color, completa:

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| **Color Name** | Sí | Nombre del color (ej: "Amarillo", "Negro") - máx 50 chars |
| **Hex** | Sí | Código hexadecimal (ej: #FFFF00) - se muestra como círculo de color |
| **Main Image** | No | Imagen principal ESPECÍFICA de este color |
| **Additional Images** | No | Galería adicional ESPECÍFICA de este color |
| **Quantity** | No | Stock disponible de este color (default: 0) |
| **Is Active** | Sí | Si está activo se muestra en la app (default: true) |
| **Display Order** | No | Orden de visualización (default: 0) |

**Importante sobre imágenes por color**:
- Si un color tiene `Main Image`, esa imagen se muestra cuando el usuario selecciona ese color
- Si no tiene `Main Image`, se usa la `Front Image` del producto
- Los `Additional Images` del color se agregan a la galería cuando ese color está seleccionado

**Ejemplo práctico**:
```
Color 1: Amarillo
- Hex: #FFFF00
- Main Image: camiseta-amarilla-frente.jpg
- Additional Images: camiseta-amarilla-espalda.jpg, camiseta-amarilla-detalle.jpg
- Quantity: 50
- Is Active: true

Color 2: Negro
- Hex: #000000
- Main Image: camiseta-negra-frente.jpg
- Quantity: 30
- Is Active: true
```

#### Variantes del Producto - TALLAS

**Sizes** (Tallas) - OPCIONAL
Si el producto tiene tallas, agrégalas aquí.

Para cada talla, completa:

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| **Name** | Sí | Nombre de la talla (ej: "S", "M", "L", "XL") - máx 20 chars |
| **Code** | No | Código interno de la talla (ej: "SML", "MED") - máx 10 chars |
| **Stock** | No | Cantidad disponible de esta talla (default: 0) |
| **Is Active** | Sí | Si está activa se muestra como opción (default: true) |
| **Display Order** | No | Orden de visualización (default: 0) |

**Ejemplo**:
```
Talla 1: S - Stock: 10 - Active: true
Talla 2: M - Stock: 25 - Active: true
Talla 3: L - Stock: 15 - Active: true
Talla 4: XL - Stock: 5 - Active: true
Talla 5: XXL - Stock: 0 - Active: false (sin stock, no mostrar)
```

#### Inventario y Control

**Total Stock** (Stock Total) - OPCIONAL
- Cantidad total disponible del producto
- Por defecto es 0
- Este es un campo agregado; para control detallado usa el stock por color y talla

**Is Active** (Está Activo) - OPCIONAL
- Controla si el producto está activo en el sistema
- Por defecto está marcado (true)
- Desmarca para desactivar temporalmente sin eliminar

**View Count** / **Favorite Count** - NO USAR
- Campos para métricas internas
- Se actualizan automáticamente
- No modificar manualmente

#### SEO (Opcional)

Campos para optimización en motores de búsqueda:
- **Meta Title**: Título para SEO (máx 70 chars)
- **Meta Description**: Descripción para SEO (máx 160 chars)
- **Keywords**: Palabras clave separadas por comas
- **Meta Image**: Imagen para compartir en redes
- **No Index** / **No Follow**: Opciones de indexación

> **Nota**: Los campos SEO son para uso web futuro y no afectan la app móvil.

### 3.3 Publicar un Producto

Una vez completados todos los campos obligatorios:

1. Revisa que toda la información sea correcta
2. Verifica que las imágenes se vean bien
3. Asegúrate de tener al menos un color con hex válido
4. En la parte superior derecha, haz clic en **Save**
5. Haz clic en **Publish** para que sea visible en la app

**Lista de verificación antes de publicar**:
- [ ] Título completo
- [ ] Precio establecido
- [ ] Front Image subida
- [ ] Al menos 1 color con nombre y código hex
- [ ] Tallas configuradas (si aplica)
- [ ] Categoría seleccionada
- [ ] Estados asignados (si aplica)

### 3.4 Editar un Producto Existente

1. Ve a **Content Manager** > **Products**
2. Busca el producto (usa el buscador o navega la lista)
3. Haz clic sobre el producto
4. Realiza los cambios necesarios
5. Haz clic en **Save**
6. Si el producto ya estaba publicado, haz clic en **Publish** para actualizar

### 3.5 Despublicar / Eliminar

**Despublicar** (recomendado para ocultar temporalmente):
1. Abre el producto
2. Haz clic en **Unpublish**
3. El producto sigue existiendo pero no es visible en la app

**Eliminar** (permanente):
1. En la lista de productos, haz clic en los tres puntos (⋮)
2. Selecciona **Delete**
3. Confirma la eliminación

---

## 4. Gestión de Medios

La biblioteca de medios almacena todas las imágenes, videos y archivos.

### 4.1 Acceder a la Biblioteca

1. En el menú lateral, haz clic en **Media Library**
2. Verás todas las imágenes y archivos subidos

### 4.2 Subir Archivos

**Arrastrar y Soltar**:
- Arrastra archivos directamente a la ventana

**Botón de Carga**:
1. Haz clic en **+ Add new assets**
2. Selecciona **From computer**
3. Navega y selecciona archivos

### 4.3 Organizar en Carpetas

**Estructura recomendada**:
```
Media Library/
├── Productos/
│   ├── Camisetas/
│   ├── Accesorios/
│   └── Calzado/
├── Colores/
│   ├── Camisetas-Amarillo/
│   ├── Camisetas-Negro/
│   └── ...
├── Tiendas/
└── General/
```

### 4.4 Especificaciones de Imágenes

| Tipo de Imagen | Tamaño Recomendado | Formato |
|----------------|-------------------|---------|
| Producto (Front Image) | 1200x1200 px | JPG |
| Galería de producto | 800x800 px | JPG |
| Imagen de color | 1200x1200 px | JPG |
| Foto de tienda | 1200x800 px | JPG |
| Con transparencia | Cualquiera | PNG |

**Límites**:
- Tamaño máximo por archivo: 2 MB
- Formatos permitidos: JPG, PNG, GIF, WEBP, MP4, MOV

### 4.5 Buenas Prácticas

- Usa nombres descriptivos: `camiseta-penarol-amarillo-frente.jpg`
- Evita espacios y caracteres especiales
- Mantén un fondo consistente (preferiblemente blanco)
- Optimiza imágenes antes de subir (usa TinyPNG)

---

## 5. Gestión de Categorías

Las categorías agrupan productos similares.

### 5.1 Estado Actual de Categorías

> **Importante**: La aplicación móvil actualmente usa una lista de categorías predefinida internamente. Las categorías de Strapi están disponibles vía API y se sincronizan mediante el campo `slug`.

### 5.2 Campos de Categoría

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| **Name** | Sí | Nombre de la categoría (máx 100 chars) |
| **Slug** | Sí | Se genera automáticamente del nombre |
| **Description** | No | Descripción de la categoría |
| **Icon** | No | Imagen/ícono de la categoría |
| **Display Order** | No | Orden de visualización (default: 0) |
| **Is Active** | No | Si está activa (default: true) |
| **Products** | Auto | Relación con productos (no editar manualmente) |
| **Models** | Auto | Relación con modelos (no editar manualmente) |

### 5.3 Crear/Editar Categorías

1. Ve a **Content Manager** > **Categories**
2. Haz clic en **+ Create new entry** o selecciona una existente
3. Completa los campos
4. Guarda y publica

**Nota**: Para que los productos se asignen correctamente, asegúrate de que el `slug` de la categoría coincida con las categorías esperadas por la app.

---

## 6. Gestión de Modelos de Producto

Los modelos son variantes específicas dentro de una categoría (ej: "Titular", "Suplente").

### 6.1 Campos de Modelo

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| **Name** | Sí | Nombre del modelo (máx 100 chars) |
| **Slug** | Sí | Se genera automáticamente |
| **Description** | No | Descripción del modelo |
| **Display Order** | No | Orden de visualización |
| **Is Active** | No | Si está activo (default: true) |
| **Category** | No | Categoría a la que pertenece |
| **Products** | Auto | Productos con este modelo |

### 6.2 Ejemplos de Modelos por Categoría

**Camisetas**: Titular, Suplente, Arquero, Retro, Entrenamiento
**Buzos**: Regular, Oversize, Sport
**Pantalones**: Corto, Largo, Training

---

## 7. Gestión de Estados de Producto

Los estados son etiquetas visuales que destacan productos.

### 7.1 Estados Disponibles

El sistema tiene 8 estados predefinidos con funciones específicas:

| Estado | Nombre Interno | Uso en la App |
|--------|---------------|---------------|
| **Nuevo** | `new` | Badge "Nuevo" en tarjetas |
| **Oferta** | `sale` | Indica producto en promoción |
| **Destacado** | `featured` | Sección "Destacados" |
| **Oportunidad** | `opportunity` | Ofertas especiales |
| **Recomendado** | `recommended` | Productos relacionados |
| **Popular** | `popular` | Sección "Populares" |
| **Exclusivo App** | `app_exclusive` | Solo disponible en app |
| **Resaltado** | `highlighted` | Máxima visibilidad |

### 7.2 Campos de Estado

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| **Name** | Sí | Valor del enum (new, sale, featured, etc.) |
| **Priority** | Sí | Número para ordenar (menor = mayor prioridad) |
| **Label Es** | Sí | Etiqueta en español (máx 50 chars) |
| **Label En** | No | Etiqueta en inglés (máx 50 chars) |
| **Color** | No | Color del texto (hex: #FFFFFF) |
| **Background Color** | No | Color de fondo (hex: #FF0000) |
| **Is Active** | No | Si está activo (default: true) |

### 7.3 Asignar Estados a Productos

1. Abre el producto en edición
2. Busca el campo **Statuses**
3. Haz clic en **Add relation**
4. Selecciona uno o varios estados
5. Guarda y publica

**Recomendaciones**:
- No abuses de los estados (no todos los productos deben tener etiquetas)
- Usa "new" solo para productos recién lanzados
- Combina "sale" con un `discountedPrice` real

---

## 8. Gestión de Ubicaciones de Tienda

Las ubicaciones permiten a los usuarios elegir dónde retirar sus pedidos.

### 8.1 Campos de Ubicación

#### Información Básica

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| **Name** | Sí | Nombre de la tienda (máx 100 chars) |
| **Slug** | Sí | Se genera automáticamente |
| **Code** | Sí | Código único (ej: "MV-CENTRO") - máx 20 chars, único |
| **Description** | No | Descripción de la ubicación |

#### Dirección (Address) - OBLIGATORIO

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| **First Name** | Sí | Nombre del encargado (máx 50 chars) |
| **Last Name** | Sí | Apellido del encargado (máx 50 chars) |
| **Company** | No | Nombre de la empresa |
| **Address Line 1** | Sí | Dirección principal (máx 255 chars) |
| **Address Line 2** | No | Complemento de dirección |
| **City** | Sí | Ciudad (máx 100 chars) |
| **State** | No | Departamento (máx 100 chars) |
| **Postal Code** | No | Código postal (máx 20 chars) |
| **Country** | Sí | Código de país 2 letras (default: "UY") |
| **Phone Number** | No | Teléfono de la dirección |
| **Type** | No | Tipo de dirección (shipping, billing, both) |

#### Contacto

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| **Phone Number** | No | Teléfono principal de la tienda |
| **Email** | No | Correo electrónico |

#### Horarios de Operación (Operating Hours)

Puedes configurar horarios detallados por día de la semana:

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| **Day of Week** | Sí | Día (monday, tuesday, etc.) |
| **Open Time** | No | Hora de apertura (formato HH:MM) |
| **Close Time** | No | Hora de cierre (formato HH:MM) |
| **Is Closed** | No | Si está cerrado ese día |
| **Notes** | No | Notas adicionales (máx 255 chars) |

**Ejemplo de configuración**:
```
Lunes:    09:00 - 18:00
Martes:   09:00 - 18:00
Miércoles: 09:00 - 18:00
Jueves:   09:00 - 18:00
Viernes:  09:00 - 18:00
Sábado:   10:00 - 14:00
Domingo:  isClosed: true
```

#### Características de la Tienda

| Campo | Default | Descripción |
|-------|---------|-------------|
| **Has Pickup Service** | true | Ofrece servicio de retiro |
| **Has Parking** | false | Tiene estacionamiento |
| **Is Accessible** | true | Es accesible (discapacitados) |
| **Max Pickup Items** | 50 | Máximo de items por retiro |

#### Control

| Campo | Default | Descripción |
|-------|---------|-------------|
| **Is Active** | true | Si la ubicación está activa |
| **Display Order** | 0 | Orden de visualización |
| **Images** | - | Fotos de la tienda (múltiples) |

### 8.2 Crear una Ubicación

1. Ve a **Content Manager** > **Store Locations**
2. Haz clic en **+ Create new entry**
3. Completa todos los campos obligatorios
4. Configura los horarios de operación
5. Guarda y publica

---

## 9. Gestión de Pedidos

Los pedidos se crean automáticamente cuando los clientes completan una compra.

### 9.1 Ver Pedidos

1. Ve a **Content Manager** > **Orders**
2. Verás la lista de todos los pedidos
3. Puedes filtrar por estado, fecha, etc.

### 9.2 Campos del Pedido

#### Información General

| Campo | Descripción |
|-------|-------------|
| **Order Number** | Número único del pedido |
| **Order Date** | Fecha y hora del pedido |
| **User** | Usuario que realizó el pedido (si está logueado) |
| **Guest Email** | Email si es compra como invitado |
| **Status** | Estado actual del pedido |

#### Estados del Pedido

| Estado | Descripción |
|--------|-------------|
| `pending` | Pendiente de pago |
| `processing` | En proceso |
| `paid` | Pagado |
| `shipped` | Enviado |
| `delivered` | Entregado |
| `cancelled` | Cancelado |
| `refunded` | Reembolsado |

#### Items del Pedido

Cada item contiene:
- **Product**: Referencia al producto
- **Product Snapshot**: Copia de los datos del producto al momento de la compra
- **Quantity**: Cantidad
- **Unit Price**: Precio unitario
- **Total Price**: Precio total del item
- **Selected Color**: Color seleccionado
- **Selected Size**: Talla seleccionada
- **Customizations**: Personalizaciones (si aplica)
- **Notes**: Notas del item

#### Envío

| Campo | Descripción |
|-------|-------------|
| **Shipping Method** | "delivery" o "pickup" |
| **Shipping Address** | Dirección de envío (si es delivery) |
| **Store Location** | Tienda de retiro (si es pickup) |
| **Tracking Number** | Número de seguimiento |
| **Estimated Delivery** | Fecha estimada de entrega |
| **Delivered At** | Fecha real de entrega |

#### Pago (MercadoPago)

| Campo | Descripción |
|-------|-------------|
| **Payment Method** | "mercadopago" o "cash_on_delivery" |
| **MP Payment Id** | ID del pago en MercadoPago |
| **MP Preference Id** | ID de preferencia de MercadoPago |
| **MP Collection Id** | ID de colección |
| **MP Collection Status** | Estado del pago en MP |
| **MP Payment Type** | Tipo de pago (credit_card, debit_card, etc.) |
| **MP External Reference** | Referencia externa |

#### Totales

| Campo | Descripción |
|-------|-------------|
| **Subtotal** | Suma de items |
| **Shipping Cost** | Costo de envío |
| **Discount** | Descuento aplicado |
| **Tax** | Impuestos |
| **Total** | Total final |

#### Notas

| Campo | Descripción |
|-------|-------------|
| **Customer Notes** | Notas del cliente |
| **Internal Notes** | Notas internas (solo admin) |
| **Notes** | Notas generales |

### 9.3 Actualizar Estado de un Pedido

1. Abre el pedido
2. Cambia el campo **Status** al nuevo estado
3. Opcionalmente agrega notas internas
4. Guarda los cambios

**Importante**: Los cambios de estado pueden disparar notificaciones al cliente.

---

## 10. Configuración de la Aplicación

La configuración de la app es un **Single Type** (tipo único) con valores globales.

### 10.1 Acceder

1. Ve a **Content Manager**
2. En "Single Types", selecciona **App Settings**

### 10.2 Campos Disponibles

| Campo | Obligatorio | Default | Descripción |
|-------|-------------|---------|-------------|
| **Support Phone Number** | Sí | +59899000000 | Teléfono de soporte |
| **Support Email** | No | - | Email de soporte |
| **Business Name** | No | Tifossi | Nombre del negocio |

### 10.3 Editar Configuración

1. Modifica los campos necesarios
2. Haz clic en **Save**
3. Los cambios se reflejan inmediatamente en la app

---

## 11. Gestión de Usuarios

Los usuarios se crean automáticamente cuando se registran en la app.

### 11.1 Ver Usuarios

1. Ve a **Content Manager** > **Users**
2. Verás la lista de usuarios registrados

### 11.2 Campos del Usuario

#### Información Básica

| Campo | Descripción |
|-------|-------------|
| **Username** | Nombre de usuario (único) |
| **Email** | Correo electrónico |
| **First Name** | Nombre |
| **Last Name** | Apellido |
| **Phone Number** | Teléfono |
| **Profile Picture** | Foto de perfil |

#### Cuenta

| Campo | Descripción |
|-------|-------------|
| **Firebase UID** | ID de Firebase (autenticación) |
| **Provider** | Proveedor de auth (local, google, etc.) |
| **Confirmed** | Si el email está confirmado |
| **Blocked** | Si la cuenta está bloqueada |
| **Role** | Rol del usuario |

#### Preferencias

| Campo | Descripción |
|-------|-------------|
| **Preferred Language** | Idioma preferido (es, en) |
| **Currency** | Moneda preferida (UYU, USD) |
| **Newsletter Subscribed** | Suscrito a newsletter |
| **Marketing Emails** | Acepta emails de marketing |

#### Direcciones

- **Addresses**: Lista de direcciones guardadas
- **Default Shipping Address**: Dirección de envío por defecto
- **Default Billing Address**: Dirección de facturación por defecto

#### Actividad

| Campo | Descripción |
|-------|-------------|
| **Cart** | Carrito actual (JSON) |
| **Favorites** | Productos favoritos |
| **Orders** | Pedidos del usuario |
| **Last Login At** | Último inicio de sesión |
| **Total Orders** | Cantidad de pedidos |
| **Total Spent** | Total gastado |
| **Loyalty Points** | Puntos de fidelidad |

### 11.3 Gestión de Usuarios

**Bloquear un usuario**:
1. Abre el perfil del usuario
2. Marca la casilla **Blocked**
3. Guarda

**Ver pedidos de un usuario**:
1. Abre el perfil del usuario
2. En la sección **Orders** verás todos sus pedidos
3. Haz clic en uno para ver detalles

---

## 12. Consejos y Buenas Prácticas

### 12.1 Flujo de Trabajo para Productos

1. **Preparación**:
   - Prepara todas las imágenes optimizadas
   - Define colores con códigos hex correctos
   - Ten la información lista (precios, descripciones, tallas)

2. **Creación**:
   - Crea el producto en modo borrador
   - Completa todos los campos obligatorios primero
   - Agrega variantes de color con sus imágenes específicas
   - Configura tallas y stock

3. **Revisión**:
   - Verifica precios y stock
   - Revisa que las imágenes se vean correctamente
   - Confirma que los colores tengan hex válidos

4. **Publicación**:
   - Guarda y publica
   - Verifica en la app móvil

### 12.2 Gestión de Imágenes por Color

Esta es una funcionalidad clave que permite mostrar diferentes imágenes según el color seleccionado:

1. Sube imágenes específicas para cada color a la Media Library
2. Al crear/editar un color, asigna:
   - **Main Image**: La imagen principal de ese color
   - **Additional Images**: Imágenes adicionales del producto en ese color

3. Cuando el usuario selecciona un color en la app:
   - Se muestra el `Main Image` del color (o `Front Image` del producto si no hay)
   - La galería incluye los `Additional Images` del color

### 12.3 Gestión de Stock

**Por Color**:
- Usa el campo `Quantity` en cada color para control detallado
- Colores con `Quantity: 0` pueden marcarse como `Is Active: false`

**Por Talla**:
- Usa el campo `Stock` en cada talla
- Tallas sin stock pueden marcarse como `Is Active: false`

**General**:
- El campo `Total Stock` del producto es para referencia general
- Para productos sin variantes, usa este campo

### 12.4 Estados Estratégicos

- **Productos nuevos**: Asigna `new` las primeras 2-4 semanas
- **Ofertas**: Combina estado `sale` con `discountedPrice`
- **Destacados**: Rota productos `featured` semanalmente
- **Productos relacionados**: Usa `recommended` para sugerencias

### 12.5 Mantenimiento Regular

**Semanal**:
- Revisa y actualiza stock
- Verifica ofertas activas
- Revisa pedidos pendientes

**Mensual**:
- Limpia Media Library (elimina imágenes no usadas)
- Actualiza estados (remueve `new` de productos antiguos)
- Revisa ubicaciones de tienda

**Trimestral**:
- Evalúa productos sin ventas
- Actualiza descripciones y precios
- Revisa estructura de categorías

### 12.6 Solución de Problemas

**"No puedo publicar un producto"**
- Verifica campos obligatorios: title, slug, price, frontImage
- Asegúrate de tener al menos 1 color con nombre y hex
- El hex debe ser formato válido: #RRGGBB o #RGB

**"Las imágenes no se suben"**
- Verifica tamaño (máx 2 MB)
- Usa formatos válidos (JPG, PNG)
- Prueba con otra imagen

**"No veo cambios en la app"**
- Verifica que hayas hecho clic en "Publish"
- La app tiene caché (espera 30-60 minutos o fuerza actualización)
- Verifica que `Is Active` esté marcado

**"El color no muestra su imagen"**
- Verifica que el color tenga `Main Image` asignada
- Confirma que la imagen esté subida correctamente
- El color debe estar `Is Active: true`

---

## Glosario

| Término | Descripción |
|---------|-------------|
| CMS | Content Management System - Sistema de Gestión de Contenidos |
| Draft | Borrador - contenido no publicado |
| Published | Publicado - contenido visible en la app |
| Slug | Identificador URL-friendly generado del título |
| Hex Code | Código hexadecimal de color (#RRGGBB) |
| Media Library | Biblioteca de archivos multimedia |
| Component | Conjunto de campos reutilizable |
| Relation | Conexión entre tipos de contenido |
| Single Type | Tipo de contenido único (no colección) |
| Collection Type | Tipo de contenido con múltiples entradas |

---

## Checklist: Crear Producto Completo

- [ ] Título descriptivo
- [ ] Precio correcto
- [ ] Precio con descuento (si aplica)
- [ ] Descripción corta (línea 1)
- [ ] Descripción larga
- [ ] Front Image de calidad
- [ ] Imágenes adicionales (2-3 mínimo)
- [ ] Categoría seleccionada
- [ ] Modelo seleccionado (si aplica)
- [ ] Al menos 1 color con:
  - [ ] Nombre
  - [ ] Código hex válido
  - [ ] Main Image (recomendado)
  - [ ] Quantity/stock
- [ ] Tallas configuradas (si aplica)
- [ ] Estados asignados (new, featured, etc.)
- [ ] Producto guardado
- [ ] Producto publicado
- [ ] Verificado en la app móvil

---

**Última actualización**: Diciembre 2025
**Versión de Strapi**: v5
