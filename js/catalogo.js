const URL_SHEET =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=0&single=true&output=csv";

const URL_SHEET_COMICS =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=2096118978&single=true&output=csv";

// ⚠️ URL del Worker de Cloudflare
const URL_PROXY_DISCOGS =
"https://leviatan-portadas.f-g-spratt.workers.dev";

// Número de WhatsApp del negocio
const WHATSAPP_NUMERO = "5493584283858";

let catalogo = [];

// ---------------------------------------------------------
// CACHÉ DE PORTADAS
// ---------------------------------------------------------

const CACHE_KEY = "leviatan_portadas_cache_v2";

let cachePortadas =
    JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");

function guardarCachePortadas() {

    localStorage.setItem(
        CACHE_KEY,
        JSON.stringify(cachePortadas)
    );

}

function claveItem(artista, album) {

    return (
        (artista || "") +
        "___" +
        (album || "")
    )
        .toLowerCase()
        .trim();

}

// ---------------------------------------------------------
// IMÁGENES
// ---------------------------------------------------------

function tieneImagenValida(valor) {

    const v = (valor || "")
        .trim()
        .toLowerCase();

    if (!v) return false;

    if (
        v.includes("sin-portada") ||
        v.includes("sin_portada") ||
        v === "sinportada"
    ) {
        return false;
    }

    return true;

}

function obtenerRutaImagen(valor) {

    if (!tieneImagenValida(valor)) {
        return "img/sin-portada.png";
    }

    const imagen = valor.trim();

    // Si ya es una URL completa
    if (
        imagen.startsWith("http://") ||
        imagen.startsWith("https://")
    ) {
        return imagen;
    }

    // Si ya comienza con img/
    if (imagen.startsWith("img/")) {
        return imagen;
    }

    // Si es solamente el nombre del archivo
    return `img/${imagen}`;

}

// ---------------------------------------------------------
// WHATSAPP
// ---------------------------------------------------------

function armarLinkWhatsApp(item) {

    let titulo;
    let mensaje;

    if (item.Tipo === "COMIC") {

        titulo = [
            item.titulo,
            item.Serie ? `(${item.Serie})` : "",
            item.Número ? `Nº ${item.Número}` : ""
        ]
            .filter(Boolean)
            .join(" ");

        mensaje =
            `Hola! Te consulto por este cómic:\n` +
            `${titulo}` +
            (item.Precio
                ? `\nPrecio: ${item.Precio}`
                : "");

    } else {

        titulo =
            `${item.Artista} - ${item.Album}`;

        mensaje =
            `Hola! Te consulto por este disco:\n` +
            `${titulo}` +
            (item.Precio
                ? `\nPrecio: ${item.Precio}`
                : "");

    }

    return (
        `https://wa.me/${WHATSAPP_NUMERO}` +
        `?text=${encodeURIComponent(mensaje)}`
    );

}

// ---------------------------------------------------------
// LIMPIEZA PARA BÚSQUEDA DE PORTADAS
// ---------------------------------------------------------

function limpiarParaBusqueda(texto) {

    return (texto || "")
        .replace(/\(.*?\)/g, "")
        .replace(/\[.*?\]/g, "")
        .replace(
            /\b(reedicion|reedición|bootleg|vinilo|vinyl|lp|cd|remaster(izado)?|edicion|edición|import|importado)\b/gi,
            ""
        )
        .replace(/\s+/g, " ")
        .trim();

}

// ---------------------------------------------------------
// DISCOGS
// ---------------------------------------------------------

async function buscarPortadaDiscogs(artista, album) {

    try {

        const a = encodeURIComponent(
            limpiarParaBusqueda(artista)
        );

        const b = encodeURIComponent(
            limpiarParaBusqueda(album)
        );

        const resp = await fetch(
            `${URL_PROXY_DISCOGS}?artist=${a}&album=${b}`
        );

        if (!resp.ok) return null;

        const data = await resp.json();

        return data.cover || null;

    } catch (e) {

        console.warn(
            "Discogs falló:",
            artista,
            album,
            e
        );

        return null;

    }

}

// ---------------------------------------------------------
// ITUNES
// ---------------------------------------------------------

async function buscarPortadaItunes(artista, album) {

    try {

        const termino = encodeURIComponent(
            `${limpiarParaBusqueda(artista)} ${limpiarParaBusqueda(album)}`
        );

        const resp = await fetch(
            `https://itunes.apple.com/search?term=${termino}&entity=album&limit=1`
        );

        const data = await resp.json();

        if (
            data.results &&
            data.results.length > 0
        ) {

            return data.results[0]
                .artworkUrl100
                .replace(
                    "100x100bb",
                    "600x600bb"
                );

        }

        return null;

    } catch (e) {

        console.warn(
            "iTunes falló:",
            artista,
            album,
            e
        );

        return null;

    }

}

// ---------------------------------------------------------
// BUSCAR PORTADA
// ---------------------------------------------------------

async function buscarPortada(artista, album) {

    const clave =
        claveItem(artista, album);

    if (clave in cachePortadas) {

        return cachePortadas[clave];

    }

    let url =
        await buscarPortadaDiscogs(
            artista,
            album
        );

    if (!url) {

        url =
            await buscarPortadaItunes(
                artista,
                album
            );

    }

    cachePortadas[clave] = url;

    guardarCachePortadas();

    return url;

}

// ---------------------------------------------------------
// INICIO
// ---------------------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const buscador =
            document.getElementById(
                "buscador"
            );

        const resultados =
            document.getElementById(
                "resultados"
            );

        let colaPendiente = [];

        // -------------------------------------------------
        // NORMALIZAR
        // -------------------------------------------------

        function normalizar(texto) {

            return (texto || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(
                    /[\u0300-\u036f]/g,
                    ""
                )
                .replace(
                    /[^a-z0-9]/g,
                    ""
                );

        }

        // -------------------------------------------------
        // DESTACADOS
        // -------------------------------------------------

        function obtenerDestacados(
            cantidad = 12
        ) {

            const copia =
                [...catalogo];

            for (
                let i = copia.length - 1;
                i > 0;
                i--
            ) {

                const j =
                    Math.floor(
                        Math.random() *
                        (i + 1)
                    );

                [
                    copia[i],
                    copia[j]
                ] = [
                    copia[j],
                    copia[i]
                ];

            }

            return copia.slice(
                0,
                cantidad
            );

        }

        // -------------------------------------------------
        // MOSTRAR RESULTADOS
        // -------------------------------------------------

        function mostrarResultados(lista) {

            resultados.innerHTML = "";

            colaPendiente = [];

            if (lista.length === 0) {

                resultados.innerHTML = `
                    <div class="sin-resultados">
                        No se encontraron resultados.
                    </div>
                `;

                resultados.style.display =
                    "block";

                return;

            }

            resultados.style.display =
                "grid";

            lista.forEach(item => {

                const esComic =
                    item.Tipo === "COMIC";

                const titulo =
                    esComic
                        ? (
                            item.Titulo || ""
                        )
                        : (
                            item.Album || ""
                        );

                const subtitulo =
                    esComic
                        ? [
                            item.Serie,
                            item.Numero
                                ? `Nº ${item.Numero}`
                                : ""
                        ]
                            .filter(Boolean)
                            .join(" · ")
                        : (
                            item.Artista || ""
                        );

                const editorialOSello =
                    esComic
                        ? (
                            item.Editorial || ""
                        )
                        : (
                            item.Sello || ""
                        );

                const anio =
                    item["Año de lanzamiento"] ||
                    "";

                const clave =
                    esComic
                        ? claveItem(
                            item.Serie,
                            titulo
                        )
                        : claveItem(
                            item.Artista,
                            item.Album
                        );

                const imagen =
                    obtenerRutaImagen(
                        item.Imagen
                    );

                resultados.innerHTML += `

                <article class="card">

                    <img
                        data-key="${clave}"
                        src="${imagen}"
                        alt="${titulo}"
                        onerror="this.src='img/sin-portada.png'"
                    >

                    <div class="card-body">

                        <h3>
                            ${subtitulo}
                        </h3>

                        <p>
                            <strong>
                                ${titulo}
                            </strong>
                        </p>

                        <p>
                            ${editorialOSello}
                        </p>

                        <p>
                            ${item.Origen || ""}
                        </p>

                        ${
                            anio
                                ? `<p>${anio}</p>`
                                : ""
                        }

                        <p>
                            ${item.Estado || ""}
                        </p>

                        <div class="precio">
                            ${item.Precio || ""}
                        </div>

                        <a
                            class="btn-whatsapp"
                            href="${armarLinkWhatsApp(item)}"
                            target="_blank"
                            rel="noopener"
                        >
                            Consultar por WhatsApp
                        </a>

                    </div>

                </article>

                `;

                // Solo buscamos automáticamente
                // portadas de CDs.
                //
                // Los cómics utilizan la imagen
                // que figure en la columna Imagen.

                if (
                    !esComic &&
                    !tieneImagenValida(
                        item.Imagen
                    )
                ) {

                    colaPendiente.push({
                        item,
                        clave
                    });

                }

            });

            procesarColaPortadas();

        }

        // -------------------------------------------------
        // PROCESAR PORTADAS DE CDs
        // -------------------------------------------------

        async function procesarColaPortadas() {

            for (
                const {
                    item,
                    clave
                }
                of colaPendiente
            ) {

                const url =
                    await buscarPortada(
                        item.Artista,
                        item.Album
                    );

                if (url) {

                    document
                        .querySelectorAll(
                            `img[data-key="${CSS.escape(clave)}"]`
                        )
                        .forEach(img => {

                            img.src = url;

                        });

                }

                // Espera para respetar
                // el límite de Discogs.

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            1100
                        )
                );

            }

        }

        // -------------------------------------------------
        // CARGAR CSV
        // -------------------------------------------------

        function cargarCSV(
            url,
            tipo
        ) {

            return new Promise(
                resolve => {

                    Papa.parse(
                        url,
                        {

                            download: true,

                            header: true,

                            skipEmptyLines: true,

                            complete:
                                function(resultado) {

                                    const datos =
                                        resultado.data
                                            .map(
                                                item => ({
                                                    ...item,
                                                    Tipo: tipo
                                                })
                                            );

                                    resolve(
                                        datos
                                    );

                                },

                            error:
                                function(error) {

                                    console.error(
                                        `No se pudo cargar ${tipo}:`,
                                        error
                                    );

                                    resolve([]);

                                }

                        }
                    );

                }
            );

        }

        // -------------------------------------------------
        // CARGAR CDs + CÓMICS
        // -------------------------------------------------

        Promise.all([

            cargarCSV(
                URL_SHEET,
                "CD"
            ),

            cargarCSV(
                URL_SHEET_COMICS,
                "COMIC"
            )

        ])
        .then(
            (
                [cds, comics]
            ) => {

                const catalogoCDs =
                    cds.filter(
                        item =>
                            (
                                item.Artista ||
                                ""
                            ).trim() &&
                            (
                                item.Album ||
                                ""
                            ).trim()
                    );

                const catalogoComics =
                    comics.filter(
                        item =>
                            (
                                item.Titulo ||
                                ""
                            ).trim()
                    );

                catalogo = [
                    ...catalogoCDs,
                    ...catalogoComics
                ];

                console.log(
                    "CDs cargados:",
                    catalogoCDs.length
                );

                console.log(
                    "Cómics cargados:",
                    catalogoComics.length
                );

                console.log(
                    "Catálogo total:",
                    catalogo.length
                );

                mostrarResultados(
                    obtenerDestacados()
                );

            }
        );

        // -------------------------------------------------
        // BUSCADOR
        // -------------------------------------------------

        buscador.addEventListener(
            "input",
            () => {

                const texto =
                    normalizar(
                        buscador.value
                    );

                if (texto === "") {

                    mostrarResultados(
                        obtenerDestacados()
                    );

                    return;

                }

                const encontrados =
                    catalogo.filter(
                        item => {

                            let camposBusqueda;

                            if (
                                item.Tipo ===
                                "COMIC"
                            ) {

                                camposBusqueda = [

                                    item.Titulo,

                                    item.Serie,

                                    item.Numero,

                                    item.Editorial,

                                    item.Origen,

                                    item[
                                        "Año de lanzamiento"
                                    ]

                                ];

                            } else {

                                camposBusqueda = [

                                    item.Artista,

                                    item.Album,

                                    item.Sello,

                                    item.Origen,

                                    item[
                                        "Año de lanzamiento"
                                    ]

                                ];

                            }

                            return camposBusqueda.some(
                                campo =>
                                    normalizar(
                                        campo
                                    ).includes(
                                        texto
                                    )
                            );

                        }
                    );

                mostrarResultados(
                    encontrados
                );

            }

        );

    }
);
