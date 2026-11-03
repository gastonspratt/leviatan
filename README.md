# Leviatán Coleccionables

Sitio web de **Tienda Leviatán**, un proyecto dedicado a coleccionistas y apasionados por la música, los cómics, los libros y las figuras de colección.

**Sitio:** https://tiendaleviatan.com/

## Descripción

Leviatán Coleccionables presenta un catálogo web dedicado al mundo del coleccionismo, con una selección de productos relacionados con la música, la historieta, la literatura y las figuras de colección.

La portada combina la identidad visual de la tienda con un buscador, productos destacados de forma aleatoria, información de contacto, noticias, agenda internacional y una banda sonora integrada.

El proyecto está pensado para crecer progresivamente y reunir en un mismo espacio diferentes tipos de coleccionables.

## Categorías

El catálogo de Leviatán contempla cuatro grandes categorías:

- **Música:** CDs y otros formatos relacionados con el coleccionismo musical.
- **Cómics:** historietas, novelas gráficas y publicaciones de colección.
- **Libros:** novelas, literatura y libros seleccionados para coleccionistas.
- **Figuras:** figuras de colección y piezas vinculadas a personajes, cómics, cine, música y cultura popular.

Actualmente el catálogo dinámico integra CDs y cómics desde Google Sheets. Los libros se muestran en `libros.html` a partir de una lista incluida en la propia página, con buscador y filtro por precio. La sección de figuras (`figuras.html`) está en preparación.

## Funcionalidades

- Catálogo dinámico conectado a fuentes externas.
- Carga de datos desde Google Sheets mediante CSV publicado.
- Selección aleatoria de productos destacados.
- Buscador integrado.
- Búsqueda de información según la categoría del producto.
- Obtención automática de portadas para determinados productos.
- Consulta automática de precios de OVNI Press para cómics de esa editorial.
- Botón de consulta directa por WhatsApp.
- Reproductor musical flotante integrado en la portada.
- Páginas dedicadas: Música, Cómics, Libros, Figuras, Noticias, Agenda, Nosotros y Contacto.
- Sección de noticias.
- Agenda internacional de rock y metal.
- Diseño responsive para escritorio y dispositivos móviles.
- Favicon propio.
- Dominio personalizado.

## Catálogo

La estructura del proyecto está pensada para trabajar con distintas categorías de productos.

### Música

La categoría musical reúne CDs y otros artículos relacionados con el coleccionismo musical.

Las portadas de CDs pueden obtenerse automáticamente mediante servicios externos cuando el producto no dispone de una imagen propia.

### Cómics

La categoría de cómics permite almacenar información como:

- Código universal / ISBN
- Editorial
- Serie
- Título
- Número
- Origen
- Precio
- Año de lanzamiento
- Estado
- Notas
- Stock
- Referencia
- Imagen

El sistema contempla la búsqueda automática de portadas a partir del ISBN.

### Libros

La página `libros.html` muestra una lista de libros (título, autor y precio) con buscador, filtro por precio y botón de consulta por WhatsApp. La lista está escrita directamente en ese archivo.

La categoría de libros permitirá incorporar libros seleccionados para coleccionistas, con información bibliográfica y comercial.

La estructura podrá incluir datos como título, autor, editorial, edición, año, estado, precio, stock e imagen.

### Figuras

La categoría de figuras estará destinada a piezas y objetos de colección. Por ahora `figuras.html` muestra el aviso «Sección en preparación».

La estructura podrá incluir datos como personaje, franquicia, fabricante, línea, escala o edición, estado, precio, stock, referencia e imagen.

## Estructura del proyecto

```text
leviatan/
├── audio/
│   ├── Pacto_de_Acero.mp3
│   └── Weight_of_the_Deep.mp3
├── css/
│   ├── agenda.css
│   ├── catalogos-acuaticos.css
│   ├── estilos.css
│   ├── internas.css
│   └── paginas-editoriales.css
├── img/
│   ├── favicon.ico
│   ├── feria-del-libro.jpg
│   ├── fondo.png
│   ├── logo-leviatan.png
│   └── sin-portada.png
├── js/
│   ├── agenda.js
│   ├── catalogo.js
│   └── precios-ovni.js
├── CNAME
├── _headers
├── agenda.html
├── comics.html
├── contacto.html
├── figuras.html
├── index.html
├── libros.html
├── musica.html
├── noticias.html
├── nosotros.html
├── paginas-editoriales.css
├── robots.txt
└── sitemap.xml
```

- `js/catalogo.js`: carga los CSV de Google Sheets, arma las tarjetas, el buscador y la consulta por WhatsApp, y busca portadas.
- `js/precios-ovni.js`: consulta precios de OVNI Press para la página de cómics.
- `js/agenda.js`: eventos y filtros de la agenda (los eventos se editan en ese archivo).
- `_headers`: cabeceras de seguridad que aplica Cloudflare Pages.

A medida que se incorporen nuevas categorías pueden agregarse nuevas fuentes de datos, imágenes y módulos específicos.

## Datos del catálogo

El catálogo actual utiliza hojas de cálculo publicadas como CSV.

Cada página elige qué muestra con el atributo `data-catalogo` del `<body>` (`musica` o `comics`); sin ese atributo, como en la portada, se muestran ambos. La hoja debe seguir publicada en la web como CSV para que el catálogo cargue.

### CDs

La información de CDs se obtiene desde la pestaña:

```text
CDS
```

### Cómics

La información de cómics se obtiene desde la pestaña:

```text
COMICS
```

Las futuras categorías de libros y figuras podrán contar con sus propias fuentes de datos.

## Imágenes y portadas

Cuando un producto contiene una imagen válida en su fuente de datos, el sitio utiliza esa imagen directamente.

Para determinados productos sin imagen, el sistema consulta servicios externos para intentar obtener una portada automáticamente:

- **CDs:** se consulta Discogs a través del Worker y, si no hay resultado, iTunes Search.
- **Cómics:** se consulta el endpoint `/comic` del Worker (con ISBN, franquicia, serie y número), que devuelve portada y precio de OVNI Press.

Los resultados se guardan en el navegador (`localStorage`) para no repetir consultas.

URL del Worker:

```text
https://leviatan-portadas.f-g-spratt.workers.dev
```

El token de Discogs se guarda como Secret del Worker en Cloudflare; no forma parte de este repositorio.

## Reproductor

La portada incluye un reproductor musical flotante.

Actualmente utiliza:

```text
audio/Pacto_de_Acero.mp3
```

El control permite reproducir y pausar la música durante la navegación.

## Noticias

La sección de noticias reúne novedades de Tienda Leviatán, incorporaciones al catálogo, proyectos y otros contenidos relacionados con la historia del sitio.

## Agenda Internacional

La agenda internacional está destinada a recitales, festivales y eventos relacionados con:

* Rock
* Hard rock
* Heavy metal
* Metal extremo
* Punk
* Hardcore
* Rock progresivo
* Gothic
* Industrial
* Otras ramas de la escena rock y metal

## Desarrollo

El proyecto es un sitio web principalmente estático compuesto por HTML, CSS y JavaScript.

El catálogo utiliza fuentes externas de datos y servicios de terceros para imágenes y precios:

- Google Sheets (CSV publicado) para los datos del catálogo.
- PapaParse 5.4.1 (cdnjs) para leer los CSV.
- Google Fonts para las tipografías.
- Cloudflare Worker `leviatan-portadas` (Discogs y OVNI Press) y iTunes Search API para las portadas.
- OVNI Press, leído mediante `r.jina.ai`, para los precios de cómics.

Para trabajar localmente se recomienda utilizar un servidor web local en lugar de abrir directamente `index.html` mediante `file://`.

## Publicación

El sitio está alojado en **Cloudflare Pages**, con el dominio personalizado `tiendaleviatan.com` configurado desde Cloudflare.

El archivo `CNAME` del repositorio es una convención de GitHub Pages; Cloudflare Pages no lo utiliza.

## Seguridad

- `_headers` define las cabeceras de seguridad que Cloudflare Pages aplica a todo el sitio: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy` y `Permissions-Policy`.
- Los datos que vienen del Google Sheet se escapan antes de mostrarse en pantalla (`escapeHtml` y `escapeAttribute` en `js/catalogo.js`). Todo código nuevo que arme HTML con datos externos debe hacer lo mismo.
- Este repositorio es público: no se guardan contraseñas ni tokens.
- El panel de administración con contraseña que existía en `index.html` fue retirado. `js/catalogo.js` todavía lee un porcentaje de descuento para cómics desde `localStorage` (`leviatan_config_v1`, 0 % por defecto), pero esa configuración solo se aplica en el navegador donde se guardó.

## Contacto

* Web: [https://tiendaleviatan.com/](https://tiendaleviatan.com/)
* Instagram: [https://instagram.com/tiendaleviatan](https://instagram.com/tiendaleviatan)
* Email: [tiendaleviatan@proton.me](mailto:tiendaleviatan@proton.me)
* MercadoLibre: [https://listado.mercadolibre.com.ar/_CustId_151374402](https://listado.mercadolibre.com.ar/_CustId_151374402)

## Identidad

> El legado no se hereda.
> Se conquista.

Leviatán nace de una historia familiar vinculada al coleccionismo musical argentino y busca llevar ese espíritu de descubrimiento a un catálogo digital cada vez más amplio.

Música, cómics, libros y figuras.

Un solo lugar para coleccionar.
