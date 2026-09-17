### README.md actualizado

````markdown
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

Actualmente el sistema de catálogo web integra CDs y cómics. La estructura del proyecto está preparada para incorporar posteriormente libros y figuras.

## Funcionalidades

- Catálogo dinámico conectado a fuentes externas.
- Carga de datos desde Google Sheets mediante CSV publicado.
- Selección aleatoria de productos destacados.
- Buscador integrado.
- Búsqueda de información según la categoría del producto.
- Obtención automática de portadas para determinados productos.
- Botón de consulta directa por WhatsApp.
- Reproductor musical flotante integrado en la portada.
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

La categoría de libros permitirá incorporar libros seleccionados para coleccionistas, con información bibliográfica y comercial.

La estructura podrá incluir datos como título, autor, editorial, edición, año, estado, precio, stock e imagen.

### Figuras

La categoría de figuras estará destinada a piezas y objetos de colección.

La estructura podrá incluir datos como personaje, franquicia, fabricante, línea, escala o edición, estado, precio, stock, referencia e imagen.

## Estructura del proyecto

```text
leviatan/
├── audio/
│   └── Weight_of_the_Deep.mp3
├── css/
│   └── estilos.css
├── img/
│   ├── favicon.ico
│   └── sin-portada.png
├── js/
│   └── catalogo.js
├── CNAME
├── index.html
└── noticias.html
````

A medida que se incorporen nuevas categorías pueden agregarse nuevas fuentes de datos, imágenes y módulos específicos.

## Datos del catálogo

El catálogo actual utiliza hojas de cálculo publicadas como CSV.

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

Para determinados productos sin imagen, el sistema puede consultar servicios externos para intentar obtener una portada automáticamente.

URL del Worker:

```text
https://leviatan-portadas.f-g-spratt.workers.dev
```

## Reproductor

La portada incluye un reproductor musical flotante.

Actualmente utiliza:

```text
audio/Weight_of_the_Deep.mp3
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

El catálogo utiliza fuentes externas de datos y servicios de terceros para determinadas funciones relacionadas con las imágenes.

Para trabajar localmente se recomienda utilizar un servidor web local en lugar de abrir directamente `index.html` mediante `file://`.

## Publicación

El repositorio utiliza un archivo `CNAME` para asociar el proyecto con el dominio:

```text
tiendaleviatan.com
```

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

```
