const URL_SHEET =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=0&single=true&output=csv";

const URL_SHEET_COMICS =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=2096118978&single=true&output=csv";

const URL_PROXY_DISCOGS =
    "https://leviatan-portadas.f-g-spratt.workers.dev";

const URL_PROXY_COMICS =
    "https://leviatan-portadas.f-g-spratt.workers.dev/comic";

const WHATSAPP_NUMERO = "5493584283858";

let catalogo = [];

const CACHE_KEY = "leviatan_portadas_cache_v2";
const CACHE_COMICS_KEY = "leviatan_comic_portadas_cache_v1";

let cachePortadas =
    JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");

let cachePortadasComics =
    JSON.parse(localStorage.getItem(CACHE_COMICS_KEY) || "{}");

function guardarCachePortadas() {
    localStorage.setItem(
        CACHE_KEY,
        JSON.stringify(cachePortadas)
    );
}

function guardarCachePortadasComics() {
    localStorage.setItem(
        CACHE_COMICS_KEY,
        JSON.stringify(cachePortadasComics)
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

function claveComic(item) {
    const isbn = limpiarISBN(item["Código universal"]);

    if (isbn) {
        return `isbn_${isbn}`;
    }

    return (
        "comic_" +
        (item["Título"] || "") +
        "___" +
        (item.Serie || "") +
        "___" +
        (item["Número"] || "")
    )
        .toLowerCase()
        .trim();
}

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

    if (
        imagen.startsWith("http://") ||
        imagen.startsWith("https://")
    ) {
        return imagen;
    }

    if (imagen.startsWith("img/")) {
        return imagen;
    }

    return `img/${imagen}`;
}

function limpiarISBN(valor) {
    return (valor || "")
        .toString()
        .replace(/[^0-9Xx]/g, "")
        .trim();
}


function obtenerConfigAdmin() {
    try {
        return JSON.parse(
            localStorage.getItem("leviatan_config_v1") ||
            '{"porcentaje":0,"mostrarTachado":true}'
        );
    } catch {
        return { porcentaje: 0, mostrarTachado: true };
    }
}

function parsearPrecio(valor) {
    if (valor === null || valor === undefined) return null;

    let texto = String(valor).trim();
    if (!texto) return null;

    texto = texto.replace(/[^0-9,.-]/g, "");

    if (texto.includes(",") && texto.includes(".")) {
        if (texto.lastIndexOf(",") > texto.lastIndexOf(".")) {
            texto = texto.replace(/\./g, "").replace(",", ".");
        } else {
            texto = texto.replace(/,/g, "");
        }
    } else if (texto.includes(",")) {
        texto = texto.replace(/\./g, "").replace(",", ".");
    } else if ((texto.match(/\./g) || []).length > 1) {
        texto = texto.replace(/\./g, "");
    }

    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : null;
}

function formatearPrecio(valor) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0
    }).format(valor);
}

function obtenerPrecioComic(item) {
    const base = parsearPrecio(item.Precio);
    if (base === null) {
        return { base: null, final: null, porcentaje: 0 };
    }

    const config = obtenerConfigAdmin();
    const porcentaje = Math.max(0, Number(config.porcentaje) || 0);
    const final = base * (1 - porcentaje / 100);

    return { base, final, porcentaje };
}

function renderizarPrecio(item) {
    const precio = item.Tipo === "COMIC"
        ? obtenerPrecioComic(item)
        : { base: parsearPrecio(item.Precio), final: parsearPrecio(item.Precio), porcentaje: 0 };

    if (precio.final === null) return "";

    if (item.Tipo !== "COMIC" || precio.porcentaje <= 0) {
        return `<div class="precio">${escapeHtml(formatearPrecio(precio.final))}</div>`;
    }

    const config = obtenerConfigAdmin();
    const tachado = config.mostrarTachado !== false
        ? `<span class="precio-tachado">${escapeHtml(formatearPrecio(precio.base))}</span>`
        : "";

    return `
        <div class="precio-container">
            ${tachado}
            <span class="precio-bonificado">${escapeHtml(formatearPrecio(precio.final))}</span>
            <span class="tag-descuento">-${precio.porcentaje}%</span>
        </div>
    `;
}

function armarLinkWhatsApp(item) {
    let titulo;
    let mensaje;

    if (item.Tipo === "COMIC") {
        titulo = [
            item["Título"],
            item.Serie ? `(${item.Serie})` : "",
            item["Número"] ? `Nº ${item["Número"]}` : ""
        ]
            .filter(Boolean)
            .join(" ");

        const precio = obtenerPrecioComic(item);

        mensaje =
            `Hola! Te consulto por este cómic:
` +
            `${titulo}` +
            (precio.final !== null
                ? `
Precio: ${formatearPrecio(precio.final)}`
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

async function buscarPortadaItunes(artista, album) {
    try {
        const termino = encodeURIComponent(
            `${limpiarParaBusqueda(artista)} ${limpiarParaBusqueda(album)}`
        );

        const resp = await fetch(
            `https://itunes.apple.com/search?term=${termino}&entity=album&limit=1`
        );

        if (!resp.ok) return null;

        const data = await resp.json();

        if (
            data.results &&
            data.results.length > 0 &&
            data.results[0].artworkUrl100
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

async function buscarPortadaComicWhakoom(isbn) {
    const codigo = limpiarISBN(isbn);

    if (!codigo) return null;

    if (codigo in cachePortadasComics) {
        return cachePortadasComics[codigo];
    }

    try {
        const resp = await fetch(
            `${URL_PROXY_COMICS}?isbn=${encodeURIComponent(codigo)}`
        );

        if (!resp.ok) {
            console.warn(
                "Whakoom proxy respondió:",
                resp.status,
                codigo
            );
            return null;
        }

        const data = await resp.json();
        const url = data.cover || null;

        cachePortadasComics[codigo] = url;
        guardarCachePortadasComics();

        return url;
    } catch (e) {
        console.warn(
            "Whakoom falló:",
            codigo,
            e
        );
        return null;
    }
}

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
                            item["Título"] || ""
                        )
                        : (
                            item.Album || ""
                        );

                const subtitulo =
                    esComic
                        ? [
                            item.Serie,
                            item["Número"]
                                ? `Nº ${item["Número"]}`
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
                        ? claveComic(item)
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
                        data-key="${escapeAttribute(clave)}"
                        src="${escapeAttribute(imagen)}"
                        alt="${escapeHtml(titulo)}"
                        onerror="this.src='img/sin-portada.png'"
                    >
                    <div class="card-body">
                        <h3>${escapeHtml(subtitulo)}</h3>
                        <p><strong>${escapeHtml(titulo)}</strong></p>
                        <p>${escapeHtml(editorialOSello)}</p>
                        <p>${escapeHtml(item.Origen || "")}</p>
                        ${
                            anio
                                ? `<p>${escapeHtml(anio)}</p>`
                                : ""
                        }
                        <p>${escapeHtml(item.Estado || "")}</p>
                        ${renderizarPrecio(item)}
                        <a
                            class="btn-whatsapp"
                            href="${escapeAttribute(armarLinkWhatsApp(item))}"
                            target="_blank"
                            rel="noopener"
                        >
                            Consultar por WhatsApp
                        </a>
                    </div>
                </article>
                `;

                if (!tieneImagenValida(item.Imagen)) {
                    colaPendiente.push({
                        item,
                        clave
                    });
                }
            });

            procesarColaPortadas();
        }

        async function procesarColaPortadas() {
            for (
                const {
                    item,
                    clave
                }
                of colaPendiente
            ) {
                let url = null;

                if (item.Tipo === "COMIC") {
                    const isbn =
                        limpiarISBN(
                            item["Código universal"]
                        );

                    if (isbn) {
                        url =
                            await buscarPortadaComicWhakoom(
                                isbn
                            );
                    }
                } else {
                    url =
                        await buscarPortada(
                            item.Artista,
                            item.Album
                        );
                }

                if (url) {
                    document
                        .querySelectorAll(
                            `img[data-key="${CSS.escape(clave)}"]`
                        )
                        .forEach(img => {
                            img.src = url;
                        });
                }

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            item.Tipo === "COMIC"
                                ? 700
                                : 1100
                        )
                );
            }
        }

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

        function escapeHtml(valor) {
            return (valor || "")
                .toString()
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        function escapeAttribute(valor) {
            return escapeHtml(valor)
                .replace(/`/g, "&#096;");
        }

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
                                    item["Título"] ||
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
                                    item["Título"],
                                    item.Serie,
                                    item["Número"],
                                    item.Editorial,
                                    item.Origen,
                                    item["Código universal"],
                                    item["Año de lanzamiento"]
                                ];

                            } else {

                                camposBusqueda = [
                                    item.Artista,
                                    item.Album,
                                    item.Sello,
                                    item.Origen,
                                    item["Año de lanzamiento"]
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
