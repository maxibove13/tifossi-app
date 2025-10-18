# Guía de Usuario - Strapi CMS para Tifossi

Bienvenido a la guía de usuario de Strapi para gestionar el contenido de la aplicación móvil Tifossi. Esta guía te ayudará a administrar productos, categorías, ubicaciones de tiendas y más, sin necesidad de conocimientos técnicos.

## Tabla de Contenidos

1. [Introducción a Strapi](#1-introducción-a-strapi)
2. [Acceso y Navegación Básica](#2-acceso-y-navegación-básica)
3. [Gestión de Productos](#3-gestión-de-productos)
4. [Gestión de Medios](#4-gestión-de-medios)
5. [Gestión de Categorías](#5-gestión-de-categorías)
6. [Gestión de Modelos de Producto](#6-gestión-de-modelos-de-producto)
7. [Gestión de Estados de Producto](#7-gestión-de-estados-de-producto)
8. [Gestión de Ubicaciones de Tienda](#8-gestión-de-ubicaciones-de-tienda)
9. [Consejos y Buenas Prácticas](#9-consejos-y-buenas-prácticas)

---

## 1. Introducción a Strapi

### ¿Qué es Strapi?

Strapi es el sistema de gestión de contenidos (CMS) que alimenta la aplicación móvil de Tifossi. A través de Strapi, puedes:

- Crear y editar productos
- Gestionar categorías y modelos
- Subir y organizar imágenes
- Configurar ubicaciones de tiendas
- Controlar qué contenido aparece en la aplicación móvil

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
- **Settings**: Configuraciones del sistema (generalmente no necesitarás acceder aquí)

#### Sección Content Manager

Dentro de Content Manager encontrarás todos los tipos de contenido:

- **Products** (Productos)
- **Categories** (Categorías)
- **Product Models** (Modelos de Producto)
- **Product Statuses** (Estados de Producto)
- **Store Locations** (Ubicaciones de Tienda)

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

**Slug** - OBLIGATORIO
- Se genera automáticamente a partir del título
- Es la URL amigable del producto
- Ejemplo: "camiseta-penarol-titular-2025"
- Generalmente no necesitas modificarlo manualmente

**Price** (Precio) - OBLIGATORIO
- El precio regular del producto
- Ingresa solo números (ejemplo: 2500)
- No uses símbolos de moneda ($)

**Discounted Price** (Precio con Descuento) - OPCIONAL
- Usa este campo si el producto está en oferta
- Debe ser menor que el precio regular
- Si no hay descuento, déjalo vacío

#### Descripciones

**Short Description** (Descripción Corta) - OPCIONAL
- Descripción breve en dos líneas
- **Line 1**: Primera línea (máximo 100 caracteres)
- **Line 2**: Segunda línea (máximo 100 caracteres)
- Ejemplo:
  - Line 1: "Camiseta oficial Peñarol"
  - Line 2: "Temporada 2025 - Material premium"

**Long Description** (Descripción Larga) - OPCIONAL
- Descripción detallada del producto
- Puedes usar formato enriquecido (negrita, cursiva, listas)
- Usa el editor de texto para dar formato

#### Imágenes y Videos

**Front Image** (Imagen Principal) - OBLIGATORIO
- La imagen principal que aparece en la aplicación
- Solo se permite UNA imagen
- Haz clic en "Browse" para seleccionar desde la biblioteca de medios
- Recomendación: Usa imágenes de alta calidad (mínimo 800x800 px)

**Images** (Imágenes Adicionales) - OPCIONAL
- Galería de imágenes del producto
- Puedes agregar múltiples imágenes
- Los usuarios podrán deslizar para verlas en la app
- Haz clic en "Browse" y selecciona varias imágenes a la vez

> **Nota**: El campo de video está disponible en el esquema pero no se visualiza actualmente en la aplicación móvil.

#### Relaciones y Clasificación

**Category** (Categoría) - OPCIONAL
- Selecciona la categoría a la que pertenece el producto
- Haz clic en el campo y elige una categoría de la lista
- Ejemplo: "Camisetas", "Accesorios", "Calzado"

**Model** (Modelo) - OPCIONAL
- El modelo específico dentro de la categoría
- Ejemplo: Si la categoría es "Camisetas", el modelo podría ser "Titular" o "Suplente"

**Statuses** (Estados) - OPCIONAL
- Puedes asignar múltiples estados al producto
- Ejemplos: "Nuevo", "En Oferta", "Destacado", "Exclusivo App"
- Estos estados aparecen como etiquetas en la aplicación
- Haz clic en "Add relation" para agregar estados

#### Configuraciones Avanzadas

**Is Customizable** (Es Personalizable) - OPCIONAL
- Marca esta casilla si el producto puede personalizarse (ejemplo: con nombre y número)
- Por defecto está desmarcada

**Warranty** (Garantía) - OPCIONAL
- Información sobre la garantía del producto
- Ejemplo: "30 días de garantía contra defectos de fabricación"

**Return Policy** (Política de Devolución) - OPCIONAL
- Condiciones para devoluciones
- Ejemplo: "Acepta devoluciones dentro de los 15 días con etiquetas originales"

#### Variantes del Producto

**Colors** (Colores) - OBLIGATORIO
- IMPORTANTE: Todo producto debe tener al menos UN color
- Haz clic en "Add new entry" para agregar un color
- Para cada color debes completar:
  - **Name**: Nombre del color (ejemplo: "Amarillo", "Negro", "Azul")
  - **Hex Code**: Código de color hexadecimal (ejemplo: #FFFF00 para amarillo) - opcional
  - **Is Active**: Marca si el color está disponible
- Puedes agregar múltiples colores haciendo clic en "Add new entry" nuevamente

> **Nota**: El campo Display Order y la visualización de colores hexadecimales están disponibles pero no se utilizan actualmente en la app. Los colores se muestran por nombre.

**Sizes** (Tallas) - OPCIONAL
- Si el producto tiene tallas, agrégalas aquí
- Haz clic en "Add new entry" para cada talla
- Para cada talla completa:
  - **Name**: Nombre de la talla (ejemplo: "S", "M", "L", "XL")
  - **Stock**: Cantidad disponible en inventario
  - **Is Active**: Marca si la talla está disponible

> **Nota**: Los campos Code y Display Order están disponibles pero no se utilizan actualmente en la app.

> **Nota**: Los campos de dimensiones (largo, ancho, alto, peso) están disponibles en el esquema pero no se utilizan actualmente en la aplicación móvil.

#### Inventario y Control

**Total Stock** (Stock Total) - OPCIONAL
- Cantidad total disponible del producto
- Si usas tallas, el stock se gestiona por talla
- Si no usas tallas, indica aquí el stock total
- Por defecto es 0

**Is Active** (Está Activo) - OPCIONAL
- Controla si el producto está activo en el sistema
- Desmarca si quieres desactivar temporalmente el producto
- Por defecto está marcado

> **Nota**: Los campos de contador de vistas y favoritos están disponibles en el esquema pero no se utilizan actualmente en la aplicación móvil.

> **Nota**: Los campos SEO están disponibles en Strapi pero no se utilizan en aplicaciones móviles.

### 3.3 Publicar un Producto

Una vez completados todos los campos obligatorios:

1. Revisa que toda la información sea correcta
2. Verifica que las imágenes se vean bien
3. En la parte superior derecha, haz clic en el botón **Save**
4. Si quieres que el producto sea visible en la app INMEDIATAMENTE:
   - Haz clic en **Publish**
5. Si prefieres guardarlo como borrador para publicarlo después:
   - Haz clic en **Save** únicamente

**Importante**: Solo los productos con estado "Published" aparecen en la aplicación móvil.

### 3.4 Editar un Producto Existente

1. Ve a **Content Manager** > **Products**
2. Busca el producto que quieres editar
   - Puedes usar el buscador en la parte superior
   - O navegar por la lista
3. Haz clic sobre el producto
4. Realiza los cambios necesarios
5. Haz clic en **Save** para guardar los cambios
6. Si el producto ya estaba publicado, haz clic en **Publish** para actualizar la versión pública

### 3.5 Despublicar un Producto

Si necesitas quitar temporalmente un producto de la aplicación:

1. Abre el producto en edición
2. En la parte superior derecha, haz clic en **Unpublish**
3. El producto seguirá existiendo pero NO será visible en la app

### 3.6 Eliminar un Producto

**PRECAUCIÓN**: Eliminar un producto es permanente.

1. Ve a la lista de productos
2. Busca el producto que quieres eliminar
3. Haz clic en el ícono de tres puntos (⋮) al lado del producto
4. Selecciona **Delete**
5. Confirma la eliminación

**Recomendación**: En lugar de eliminar, considera despublicar el producto. Así mantienes el historial.

### 3.7 Duplicar un Producto

Si necesitas crear un producto similar a uno existente:

1. Abre el producto que quieres duplicar
2. Haz clic en el ícono de tres puntos (⋮) en la parte superior
3. Selecciona **Duplicate**
4. Strapi creará una copia
5. Edita la copia con la nueva información
6. Recuerda cambiar el título (el slug se actualizará automáticamente)

---

## 4. Gestión de Medios

La biblioteca de medios es donde se almacenan todas las imágenes, videos y archivos.

### 4.1 Acceder a la Biblioteca de Medios

1. En el menú lateral, haz clic en **Media Library**
2. Verás todas las imágenes y archivos subidos

### 4.2 Subir Nuevos Archivos

**Opción 1: Arrastrar y Soltar**
1. Abre la carpeta en tu computadora donde están las imágenes
2. Arrastra las imágenes directamente a la ventana de Media Library
3. Los archivos se subirán automáticamente

**Opción 2: Botón de Carga**
1. Haz clic en el botón **+ Add new assets** (arriba a la derecha)
2. Selecciona **From computer**
3. Navega a la carpeta donde están tus archivos
4. Selecciona uno o varios archivos
5. Haz clic en **Abrir**

### 4.3 Organizar Archivos en Carpetas

Para mantener organizada tu biblioteca:

1. Haz clic en **+ Add new assets**
2. Selecciona **Create new folder**
3. Dale un nombre a la carpeta (ejemplo: "Camisetas 2025", "Logos", "Banners")
4. Haz clic en **Create**
5. Arrastra archivos a las carpetas para organizarlos

**Sugerencia de estructura de carpetas**:
```
Media Library/
├── Productos/
│   ├── Camisetas/
│   ├── Accesorios/
│   └── Calzado/
├── Categorias/
├── Tiendas/
└── Banners/
```

### 4.4 Editar Información de un Archivo

1. Haz clic sobre la imagen o archivo
2. Se abrirá un panel lateral con detalles
3. Puedes editar:
   - **Alternative text**: Texto descriptivo (bueno para SEO)
   - **Caption**: Leyenda o título
4. Haz clic en **Save** para guardar cambios

### 4.5 Reemplazar un Archivo

Si necesitas actualizar una imagen que ya está en uso:

1. Haz clic sobre el archivo
2. En el panel lateral, haz clic en **Replace media**
3. Selecciona el nuevo archivo
4. El archivo se actualizará en todos los lugares donde se use

**Importante**: Esto actualizará la imagen en TODOS los productos que la usen.

### 4.6 Eliminar Archivos

**PRECAUCIÓN**: Eliminar un archivo puede afectar productos que lo usan.

1. Selecciona el archivo haciendo clic en la casilla superior izquierda
2. Haz clic en el ícono de papelera
3. Confirma la eliminación

**Recomendación**: Antes de eliminar, verifica que el archivo no esté en uso en ningún producto.

### 4.7 Buscar Archivos

Para encontrar rápidamente un archivo:

1. Usa la barra de búsqueda en la parte superior
2. Escribe palabras clave del nombre del archivo
3. Filtra por tipo (imagen, video, documento)
4. Filtra por carpeta

### 4.8 Buenas Prácticas para Imágenes

**Resolución Recomendada**:
- Imágenes de productos: Mínimo 800x800 px, ideal 1200x1200 px
- Banners: 1200x400 px
- Íconos de categorías: 200x200 px

**Formato**:
- Usa JPG para fotografías (menor tamaño de archivo)
- Usa PNG para logos o imágenes con transparencia
- Evita archivos muy pesados (máximo 2 MB por imagen)

**Nombres de Archivo**:
- Usa nombres descriptivos: "camiseta-penarol-titular-frente.jpg"
- Evita caracteres especiales o espacios
- Usa guiones (-) en lugar de espacios

---

## 5. Gestión de Categorías

Las categorías agrupan productos similares y facilitan la navegación en la aplicación.

> **Nota Importante**: Actualmente la aplicación móvil utiliza categorías predefinidas. Las categorías creadas en Strapi están disponibles en la API pero no se visualizan dinámicamente en la app. Esta funcionalidad será implementada en una versión futura.

### 5.1 Ver Categorías Existentes

1. Ve a **Content Manager** > **Categories**
2. Verás la lista de todas las categorías

### 5.2 Crear una Nueva Categoría

1. Haz clic en **+ Create new entry**
2. Completa el formulario:

**Name** (Nombre) - OBLIGATORIO
- El nombre de la categoría que verán los usuarios
- Ejemplo: "Camisetas", "Accesorios", "Calzado"
- Máximo 100 caracteres

**Slug** - OBLIGATORIO
- Se genera automáticamente del nombre
- Ejemplo: "camisetas"

**Description** (Descripción) - OPCIONAL
- Descripción de la categoría
- Ejemplo: "Camisetas oficiales de todos los equipos uruguayos"

**Icon** (Ícono) - OPCIONAL
- Imagen que representa la categoría (no se muestra actualmente en la app)

**Is Active** (Está Activa) - OPCIONAL
- Marca esta casilla para que la categoría esté activa
- Por defecto está marcada

**SEO** - OPCIONAL
- Optimización para motores de búsqueda (similar a productos)

3. Haz clic en **Save**
4. Haz clic en **Publish** para que sea visible en la app

### 5.3 Editar una Categoría

1. Haz clic en la categoría que quieres editar
2. Modifica los campos necesarios
3. Haz clic en **Save** y luego **Publish**

### 5.4 Desactivar una Categoría

Si no quieres eliminar una categoría pero temporalmente no la necesitas:

1. Abre la categoría en edición
2. Desmarca **Is Active**
3. Guarda y publica

---

## 6. Gestión de Modelos de Producto

Los modelos son variantes específicas dentro de una categoría.

**Ejemplo**:
- Categoría: "Camisetas"
- Modelos: "Titular", "Suplente", "Arquero", "Entrenamiento"

### 6.1 Crear un Nuevo Modelo

1. Ve a **Content Manager** > **Product Models**
2. Haz clic en **+ Create new entry**
3. Completa el formulario:

**Name** (Nombre) - OBLIGATORIO
- Nombre del modelo
- Ejemplo: "Titular", "Suplente", "Edición Especial"
- Máximo 100 caracteres

**Slug** - OBLIGATORIO
- Se genera automáticamente

**Description** (Descripción) - OPCIONAL
- Descripción del modelo
- Ejemplo: "Camiseta oficial para partidos de local"

**Is Active** (Está Activo) - OPCIONAL
- Marca para activar el modelo
- Por defecto está marcado

**Category** (Categoría) - OPCIONAL
- Selecciona a qué categoría pertenece este modelo
- Un modelo puede estar asociado a una categoría específica

4. Haz clic en **Save** y luego **Publish**

### 6.2 Casos de Uso

**Ejemplo 1: Camisetas**
- Categoría: Camisetas
- Modelos: Titular, Suplente, Arquero, Retro, Entrenamiento

**Ejemplo 2: Accesorios**
- Categoría: Accesorios
- Modelos: Oficiales, Edición Limitada, Clásicos

### 6.3 Editar y Gestionar Modelos

El proceso es similar al de categorías:
- Puedes editar, duplicar, publicar/despublicar y eliminar modelos
- Usa **Is Active** para desactivar temporalmente

> **Nota**: El campo Display Order está disponible pero no se utiliza actualmente en la app.

---

## 7. Gestión de Estados de Producto

Los estados son etiquetas visuales que destacan productos especiales.

> **Nota Importante**: Los estados están predefinidos en la aplicación. Aunque Strapi permite configurar colores, etiquetas y prioridades, actualmente la app utiliza valores predefinidos en el código.

### 7.1 Estados Disponibles

El sistema tiene estados predefinidos:

1. **New** (Nuevo)
   - Para productos recién lanzados

2. **Sale** (Oferta)
   - Para productos en promoción

3. **Featured** (Destacado)
   - Productos que quieres resaltar

4. **Opportunity** (Oportunidad)
   - Ofertas especiales o liquidaciones

5. **Recommended** (Recomendado)
   - Productos recomendados por la tienda

6. **Popular** (Popular)
   - Productos más vendidos o demandados

7. **App Exclusive** (Exclusivo App)
   - Productos disponibles solo en la aplicación móvil

8. **Highlighted** (Resaltado)
   - Productos que quieres dar máxima visibilidad

### 7.2 Asignar Estados a Productos

Para que un estado aparezca en un producto:

1. Ve a **Content Manager** > **Products**
2. Abre el producto que quieres editar
3. Busca el campo **Statuses**
4. Haz clic en **Add relation**
5. Selecciona uno o varios estados
6. Guarda y publica el producto

---

## 8. Gestión de Ubicaciones de Tienda

Las ubicaciones de tienda permiten a los usuarios elegir dónde retirar sus pedidos.

### 8.1 Crear una Nueva Ubicación

1. Ve a **Content Manager** > **Store Locations**
2. Haz clic en **+ Create new entry**
3. Completa el formulario:

#### Información Básica

**Name** (Nombre) - OBLIGATORIO
- Nombre de la tienda o sucursal
- Ejemplo: "Tifossi Montevideo Centro", "Tifossi Punta Carretas"
- Máximo 100 caracteres

**Slug** - OBLIGATORIO
- Se genera automáticamente

**Code** (Código) - OBLIGATORIO
- Código único de la tienda
- Ejemplo: "MV-CENTRO", "PC-001"
- Máximo 20 caracteres
- Debe ser único (no puede repetirse)

**Description** (Descripción) - OPCIONAL
- Descripción de la ubicación
- Ejemplo: "Nuestra tienda principal en pleno centro de Montevideo"

#### Dirección

**Address** (Dirección) - OBLIGATORIO

Este es un componente con varios campos:

**First Name** (Nombre) - OBLIGATORIO
- Nombre del encargado o responsable
- Máximo 50 caracteres

**Last Name** (Apellido) - OBLIGATORIO
- Apellido del encargado o responsable
- Máximo 50 caracteres

**Company** (Empresa) - OPCIONAL
- Nombre de la empresa
- Ejemplo: "Tifossi Uruguay S.A."

**Address Line 1** (Dirección Línea 1) - OBLIGATORIO
- Dirección principal
- Ejemplo: "Av. 18 de Julio 1234"
- Máximo 255 caracteres

**Address Line 2** (Dirección Línea 2) - OPCIONAL
- Complemento de dirección
- Ejemplo: "Local 5", "Esquina Yaguarón"

**City** (Ciudad) - OBLIGATORIO
- Ciudad donde está ubicada la tienda
- Ejemplo: "Montevideo"

**State** (Departamento) - OPCIONAL
- Departamento (en Uruguay)
- Ejemplo: "Montevideo", "Canelones"

**Postal Code** (Código Postal) - OPCIONAL
- Código postal
- Ejemplo: "11200"

**Country** (País) - OBLIGATORIO
- Código de país de 2 letras
- Por defecto: "UY" (Uruguay)

**Phone Number** (Teléfono en Dirección) - OPCIONAL
- Teléfono de contacto
- Máximo 20 caracteres

**Type** (Tipo) - OPCIONAL
- Tipo de dirección (generalmente no es necesario cambiar)
- Por defecto: "both" (ambos)

#### Información de Contacto

**Phone Number** (Número de Teléfono) - OPCIONAL
- Teléfono principal de la tienda
- Ejemplo: "+598 2XXX XXXX"
- Máximo 20 caracteres

**Email** - OPCIONAL
- Correo electrónico de la tienda
- Ejemplo: "centro@tifossi.uy"

**Store Hours** (Horarios) - OPCIONAL
- Puedes ingresar los horarios de atención como texto simple
- Ejemplo: "Lun. a Vier. 11:00 - 19:00 hs.\nSab. 10:00 - 14:00 hs."

> **Nota**: Los campos de horarios detallados por día (Operating Hours component) y características de tienda (parking, accesibilidad, máximo de items) están disponibles en el esquema pero actualmente la app muestra los horarios como texto simple.

#### Control y Visualización

**Is Active** (Está Activa) - OPCIONAL
- Marca si la ubicación está activa
- Por defecto está marcado

#### Imágenes

**Images** (Imágenes) - OPCIONAL
- Fotos de la tienda (fachada, interior, etc.)
- Puedes agregar múltiples imágenes
- Haz clic en "Browse" y selecciona las imágenes

### 8.2 Guardar y Publicar

1. Revisa que todos los campos obligatorios estén completos
2. Haz clic en **Save**
3. Haz clic en **Publish** para que sea visible en la app

### 8.3 Editar una Ubicación Existente

1. Ve a la lista de Store Locations
2. Haz clic en la ubicación que quieres editar
3. Modifica los campos necesarios
4. Guarda y publica

### 8.4 Desactivar Temporalmente una Tienda

Si una tienda cierra temporalmente:

1. Abre la ubicación en edición
2. Desmarca **Is Active**
3. Guarda y publica

La tienda no aparecerá como opción de retiro en la app.

---

## 9. Consejos y Buenas Prácticas

### 9.1 Antes de Empezar

- **Haz una prueba**: Antes de crear muchos productos, crea uno de prueba para familiarizarte con el proceso
- **Ten las imágenes listas**: Prepara todas las imágenes antes de empezar a crear productos
- **Organiza tus medios**: Usa carpetas en la biblioteca de medios desde el principio
- **Planifica las categorías**: Define tu estructura de categorías antes de crear productos

### 9.2 Gestión de Productos

**Información Completa**:
- Completa todos los campos posibles, no solo los obligatorios
- Descripciones detalladas ayudan a los usuarios a tomar decisiones
- Usa múltiples imágenes para mostrar el producto desde diferentes ángulos

**Imágenes de Calidad**:
- Usa imágenes profesionales de alta resolución
- Asegúrate de que el producto sea el protagonista de la foto
- Mantén un fondo consistente (preferiblemente blanco o neutro)
- La imagen principal debe ser la más representativa

**Precios Claros**:
- Verifica que los precios sean correctos antes de publicar
- Si hay descuento, asegúrate de que el precio con descuento sea menor que el regular
- Actualiza los precios regularmente según tus políticas comerciales

**Stock Actualizado**:
- Mantén el inventario actualizado para evitar vender productos agotados
- Revisa el stock semanalmente
- Considera usar el campo "Is Active" para productos temporalmente sin stock

### 9.3 Gestión de Categorías y Modelos

**Estructura Lógica**:
- Crea categorías amplias y modelos específicos
- No crees demasiadas categorías (5-10 es ideal)
- Los nombres deben ser claros y descriptivos

**Orden Visual**:
- Usa el campo "Display Order" de manera consistente
- Coloca las categorías más importantes primero
- Revisa cómo se ve en la app después de ordenar

### 9.4 Gestión de Estados

**Uso Estratégico**:
- No abuses de los estados (no todos los productos deben tener etiquetas)
- Usa "Sale" solo cuando haya descuento real
- Actualiza los estados regularmente (un producto no puede ser "Nuevo" por siempre)
- Configura las prioridades de manera que las ofertas destaquen más

**Consistencia Visual**:
- Usa colores coherentes con tu marca
- Asegúrate de que el texto sea legible sobre el fondo
- Mantén las etiquetas cortas y claras

### 9.5 Flujo de Trabajo Recomendado

**Para Nuevos Productos**:

1. **Preparación**:
   - Reúne toda la información del producto
   - Prepara y optimiza las imágenes
   - Decide categoría, modelo y estados

2. **Creación**:
   - Crea el producto en modo borrador
   - Completa todos los campos obligatorios
   - Agrega imágenes y descripciones
   - Configura colores y tallas

3. **Revisión**:
   - Revisa toda la información
   - Verifica precios y stock
   - Comprueba que las imágenes se vean correctamente

4. **Publicación**:
   - Guarda el producto
   - Publica cuando estés seguro de que todo está correcto
   - Verifica en la aplicación móvil que se vea bien

**Para Actualizaciones Masivas**:

1. Planifica qué productos necesitas actualizar
2. Prepara todos los materiales nuevos (imágenes, información)
3. Actualiza los productos uno por uno
4. Verifica cada cambio antes de publicar

### 9.6 Mantenimiento Regular

**Semanal**:
- Revisa y actualiza el stock de productos
- Verifica que las ofertas vigentes tengan el estado "Sale"
- Responde a cualquier problema reportado en productos

**Mensual**:
- Revisa y limpia la biblioteca de medios (elimina archivos no usados)
- Actualiza estados (remueve "Nuevo" de productos antiguos)
- Verifica que todas las ubicaciones de tienda tengan información actualizada
- Revisa productos con bajo stock para reordenar o despublicar

**Trimestral**:
- Revisa la estructura de categorías (¿necesitas agregar/eliminar alguna?)
- Evalúa qué productos no se venden y considera despublicarlos
- Actualiza las descripciones de productos si hay cambios en políticas

### 9.7 Solución de Problemas Comunes

**"No puedo publicar un producto"**
- Verifica que todos los campos obligatorios estén completos
- Asegúrate de que tenga al menos una imagen principal
- Verifica que tenga al menos un color configurado

**"Las imágenes no se suben"**
- Verifica que el archivo no sea muy pesado (máximo 2 MB)
- Asegúrate de que sea un formato válido (JPG, PNG)
- Prueba con otra imagen para descartar problemas con el archivo

**"No veo los cambios en la aplicación"**
- Verifica que hayas hecho clic en "Publish" después de "Save"
- Espera unos minutos y cierra/abre la aplicación móvil
- Verifica que el campo "Is Active" esté marcado

**"El slug ya existe"**
- El slug se genera del título y debe ser único
- Cambia ligeramente el título del producto
- Ejemplo: "Camiseta Peñarol" vs "Camiseta Peñarol 2025"

**"Eliminé un archivo por error"**
- Los archivos eliminados NO se pueden recuperar
- Siempre verifica antes de eliminar
- Considera hacer respaldos regulares de tus imágenes en tu computadora

### 9.8 Seguridad y Respaldos

**Protege tu Cuenta**:
- Usa una contraseña fuerte y única
- No compartas tus credenciales
- Cierra sesión cuando termines, especialmente en computadoras compartidas
- Cambia tu contraseña periódicamente

**Respaldos**:
- Mantén copias de tus imágenes en tu computadora
- Guarda información importante de productos en un archivo aparte
- Documenta tu estructura de categorías y modelos

### 9.9 Recursos Útiles

**Herramientas Online Recomendadas**:

- **Optimización de Imágenes**: TinyPNG (https://tinypng.com)
- **Selección de Colores**: Google Color Picker
- **Edición Básica de Imágenes**: Canva (https://canva.com)
- **Eliminación de Fondos**: Remove.bg (https://remove.bg)

**Dimensiones de Referencia**:

| Tipo de Imagen | Tamaño Recomendado |
|----------------|-------------------|
| Producto principal | 1200x1200 px |
| Galería de producto | 800x800 px |
| Ícono de categoría | 200x200 px |
| Foto de tienda | 1200x800 px |

### 9.10 Contacto y Soporte

Si tienes problemas técnicos o preguntas que no están cubiertas en esta guía:

1. Documenta el problema (toma capturas de pantalla si es posible)
2. Contacta al administrador del sistema
3. Proporciona información detallada sobre qué estabas haciendo cuando ocurrió el problema

---

## Glosario de Términos

- **CMS**: Content Management System (Sistema de Gestión de Contenidos)
- **Draft**: Borrador, contenido guardado pero no publicado
- **Published**: Publicado, contenido visible en la aplicación
- **Slug**: URL amigable generada automáticamente a partir del título
- **SEO**: Search Engine Optimization (Optimización para Motores de Búsqueda)
- **Hex Code**: Código hexadecimal de color (ejemplo: #FF0000)
- **Media Library**: Biblioteca donde se almacenan imágenes y archivos
- **Component**: Conjunto de campos agrupados (ejemplo: Dirección, Horarios)
- **Relation**: Conexión entre diferentes tipos de contenido (ejemplo: Producto-Categoría)

---

## Checklist: Crear tu Primer Producto

Usa esta lista para asegurarte de no olvidar nada:

- [ ] Título del producto
- [ ] Precio (y precio con descuento si aplica)
- [ ] Descripción corta (líneas 1 y 2)
- [ ] Descripción larga
- [ ] Imagen principal (Front Image)
- [ ] Imágenes adicionales (mínimo 2-3)
- [ ] Categoría seleccionada
- [ ] Modelo seleccionado (si aplica)
- [ ] Al menos un color configurado
- [ ] Tallas configuradas (si el producto tiene tallas)
- [ ] Stock actualizado
- [ ] Estados asignados (si aplica: Nuevo, Oferta, etc.)
- [ ] Producto guardado
- [ ] Producto publicado
- [ ] Verificado en la aplicación móvil

---

**¡Felicidades!** Ya tienes todo lo necesario para gestionar el contenido de Tifossi en Strapi.

Recuerda: La práctica hace al maestro. No tengas miedo de experimentar con productos de prueba antes de trabajar con tu catálogo real.

**Última actualización**: Enero 2025
**Versión de Strapi**: v5
