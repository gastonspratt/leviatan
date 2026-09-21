const URL_SHEET =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=0&single=true&output=csv";

const URL_SHEET_COMICS =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=2096118978&single=true&output=csv";

const URL_PROXY_DISCOGS =
    "https://leviatan-portadas.f-g-spratt.workers.dev";

const URL_PROXY_COMICS =
    "https://leviatan-portadas.f-g-spratt.workers.dev/comic";

const URL_OVNI_CORS = "https://api.allorigins.win/raw?url=";
const CACHE_PRECIOS_OVNI_KEY = "leviatan_ovni_precios_v1";
const CACHE_PRECIOS_OVNI_TTL = 1000 * 60 * 60 * 12;

let cachePreciosOVNI = JSON.parse(
    localStorage.getItem(CACHE_PRECIOS_OVNI_KEY) || "{}"
);

function guardarCachePreciosOVNI() {
    localStorage.setItem(
        CACHE_PRECIOS_OVNI_KEY,
        JSON.stringify(cachePreciosOVNI)
    );
}

function esComicOVNI(item) {
    return (
        item &&
        item.Tipo === "COMIC" &&
        /ovni\s*press/i.test(item.Editorial || "")
    );
}

function slugOVNI(texto) {
    return (texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/&/g, " y ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function urlsProductoOVNI(item) {
    const titulo = item["Tï¿½tulo"] || "";
    const serie = item.Serie || "";
    const numero = item["Nï¿½mero"] || "";

    const nombres = [
        titulo,
        `${titulo} ${serie}`,
        `${titulo} ${numero}`,
        `${titulo} ${serie} ${numero}`,
        `${serie} ${numero}`,
        `${serie} ${titulo} ${numero}`
    ];

    const urls = [];

    for (const nombre of nombres) {
        const slug = slugOVNI(nombre);

        if (!slug) continue;

        const url =
            `https://www.ovnipress.net/productos/${slug}/`;

        if (!urls.includes(url)) {
            urls.push(url);
        }
    }

    return urls;
}

function extraerPrecioOVNI(html) {
    try {
        const doc = new DOMParser().parseFromString(
            html,
            "text/html"
        );

        const metaSelectors = [
            'meta[itemprop="price"]',
            'meta[property="product:price:amount"]',
            'meta[name="product:price:amount"]'
        ];

        for (const selector of metaSelectors) {
            const meta = doc.querySelector(selector);

            if (meta && meta.content) {
                const precio = parsearPrecio(meta.content);

                if (precio !== null && precio > 0) {
                    return precio;
                }
            }
        }

        const scripts = doc.querySelectorAll(
            'script[type="application/ld+json"]'
        );

        for (const script of scripts) {
            try {
                const data = JSON.parse(
                    script.textContent
                );

                const objetos = Array.isArray(data)
                    ? data
                    : [data];

                for (const objeto of objetos) {
                    if (!objeto) continue;

                    const ofertas = objeto.offers
                        ? (
                            Array.isArray(objeto.offers)
                                ? objeto.offers
                                : [objeto.offers]
                        )
                        : [];

                    for (const oferta of ofertas) {
                        const precio = parsearPrecio(
                            oferta && oferta.price
                        );

                        if (precio !== null && precio > 0) {
                            return precio;
                        }
                    }
                }
            } catch (e) {}
        }

        const texto = doc.body
            ? doc.body.innerText || ""
            : "";

        const coincidencias = texto.match(
            /\$\s*[0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]+)?/g
        );

        if (coincidencias) {
            for (const coincidencia of coincidencias) {
                const precio = parsearPrecio(
                    coincidencia
                );

                if (precio !== null && precio > 0) {
                    return precio;
                }
            }
        }

        return null;
    } catch (e) {
        console.warn(
            "No se pudo leer el precio de OVNI:",
            e
        );

        return null;
    }
}

async function buscarPrecioOVNI(item) {
    if (!esComicOVNI(item)) {
        return null;
    }

    const precioPlanilla = parsearPrecio(
        item.Precio
    );

    if (precioPlanilla !== null) {
        return precioPlanilla;
    }

    const clave = claveComic(item);
    const guardado = cachePreciosOVNI[clave];

    if (
        guardado &&
        Date.now() - guardado.timestamp <
            CACHE_PRECIOS_OVNI_TTL
    ) {
        return guardado.precio;
    }

    for (const url of urlsProductoOVNI(item)) {
        try {
            const respuesta = await fetch(
                URL_OVNI_CORS +
                encodeURIComponent(url)
            );

            if (!respuesta.ok) {
                continue;
            }

            const html = await respuesta.text();

            const precio = extraerPrecioOVNI(html);

            if (precio !== null) {
                cachePreciosOVNI[clave] = {
                    precio,
                    timestamp: Date.now()
                };

                guardarCachePreciosOVNI();

                return precio;
            }
        } catch (e) {
            console.warn(
                "Error buscando precio OVNI:",
                item["Tï¿½tulo"],
                e
            );
        }

        await new Promise(resolve =>
            setTimeout(resolve, 700)
        );
    }

    return null;
}

async function cargarPreciosOVNI(lista) {
    for (const item of lista) {
        if (!esComicOVNI(item)) {
            continue;
        }

        if (parsearPrecio(item.Precio) !== null) {
            continue;
        }

        const precio = await buscarPrecioOVNI(item);

        if (precio === null) {
            continue;
        }

        item._precioAutomatico = precio;

        const clave = claveComic(item);

        document
            .querySelectorAll(
                `[data-precio-ovni-key="${CSS.escape(clave)}"]`
            )
            .forEach(elemento => {
                elemento.outerHTML =
                    renderizarPrecio(item);
            });

        document
            .querySelectorAll(
                `[data-whatsapp-key="${CSS.escape(clave)}"]`
            )
            .forEach(enlace => {
                enlace.href =
                    armarLinkWhatsApp(item);
            });
    }
}



const WHATSAPP_NUMERO = "5493584283858";

// âš ï¸ REEMPLAZAR por la URL real del Worker de administraciÃ³n una vez desplegado
const WORKER_ADMIN = "https://leviatan-admin.TU-SUBDOMINIO.workers.dev";

let catalogo = [];
let bonificaciones = null;

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
    const isbn = limpiarISBN(item["CÃ³digo universal"]);

    if (isbn) {
        return `isbn_${isbn}`;
    }

    return (
        "comic_" +
        (item["TÃ­tulo"] || "") +
        "___" +
        (item.Serie || "") +
        "___" +
        (item["NÃºmero"] || "")
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

// ==========================================================
// BONIFICACIONES (compartidas vÃ­a Worker + KV, no localStorage)
// ==========================================================

function normalizarTexto(texto) {
    return (texto || "")
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

function claveBonifMusica(item) {
    return "musica:" + normalizarTexto(`${item.Artista}-${item.Album}`);
}

function claveBonifComic(item) {
    return "comics:" + normalizarTexto(
        `${item["TÃ­tulo"]}-${item.Serie}-${item["NÃºmero"]}`
    );
}

function claveBonif(item) {
    return item.Tipo === "COMIC"
        ? claveBonifComic(item)
        : claveBonifMusica(item);
}

function cargarBonificaciones() {
    return fetch(`${WORKER_ADMIN}/bonificaciones`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null);
}

function calcularDescuento(item) {
    if (!bonificaciones) return null;

    const clave = claveBonif(item);
    const descProducto =
        bonificaciones.productos && bonificaciones.productos[clave];

    if (descProducto) return descProducto;

    const categoria = item.Tipo === "COMIC" ? "comics" : "musica";
    const descCategoria =
        bonificaciones.categorias && bonificaciones.categorias[categoria];

    if (descCategoria && Number(descCategoria) > 0) {
        return { tipo: "porcentaje", valor: Number(descCategoria) };
    }

    return null;
}

function aplicarDescuento(base, descuento) {
    if (!descuento || !base) return null;

    if (descuento.tipo === "porcentaje") {
        return base - (base * descuento.valor / 100);
    }

    if (descuento.tipo === "fijo") {
        return Math.max(base - descuento.valor, 0);
    }

    return null;
}

function mostrarBannerPromo() {
    const contenedor = document.getElementById("catalogo");
    if (!contenedor) return;

    let banner = document.getElementById("banner-promo");
    const promo = bonificaciones && bonificaciones.promoGeneral;

    if (!promo || !promo.activa) {
        if (banner) banner.remove();
        return;
    }

    if (!banner) {
        banner = document.createElement("div");
        banner.id = "banner-promo";
        banner.style.cssText =
            "background:#8e1b1b;color:white;text-align:center;padding:14px 20px;font-weight:600;position:relative;z-index:2;";
        contenedor.prepend(banner);
    }

    banner.innerHTML =
        `${promo.titulo ? promo.titulo + " â€” " : ""}${promo.descripcion || ""}${promo.envioGratis ? " Â· EnvÃ­o gratis" : ""}`;
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

function obtenerPrecioFinal(item) {
    const base = parsearPrecio(
        item.Precio !== undefined &&
        String(item.Precio).trim() !== ""
            ? item.Precio
            : item._precioAutomatico
    );

    if (base === null) {
        return { base: null, final: null, porcentaje: 0 };
    }

    const descuento = calcularDescuento(item);
    const final = descuento ? aplicarDescuento(base, descuento) : base;
    const porcentaje =
        descuento && descuento.tipo === "porcentaje" ? descuento.valor : 0;

    return { base, final: final === null ? base : final, porcentaje };
}

function renderizarPrecio(item) {
    const precio = obtenerPrecioFinal(item);

    if (precio.final === null) return "";

    if (precio.final === precio.base) {
        return `<div class="precio">${escapeHtml(formatearPrecio(precio.final))}</div>`;
    }

    return `
        <div class="precio-container">
            <span class="precio-tachado">${escapeHtml(formatearPrecio(precio.base))}</span>
            <span class="precio-bonificado">${escapeHtml(formatearPrecio(precio.final))}</span>
            ${precio.porcentaje > 0 ? `<span class="tag-descuento">-${precio.porcentaje}%</span>` : ""}
        </div>
    `;
}

function armarLinkWhatsApp(item) {
    let titulo;

    if (item.Tipo === "COMIC") {
        titulo = [
            item["TÃ­tulo"],
            item.Serie ? `(${item.Serie})` : "",
            item["NÃºmero"] ? `NÂº ${item["NÃºmero"]}` : ""
        ]
            .filter(Boolean)
            .join(" ");
    } else {
        titulo = `${item.Artista} - ${item.Album}`;
    }

    const tipoTexto = item.Tipo === "COMIC" ? "cÃ³mic" : "disco";
    const precio = obtenerPrecioFinal(item);

    let mensaje = `Hola! Te consulto por este ${tipoTexto}:\n${titulo}`;

    if (precio.final !== null) {
        mensaje += `\nPrecio: ${formatearPrecio(precio.final)}`;
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
            /\b(reedicion|reediciÃ³n|bootleg|vinilo|vinyl|lp|cd|remaster(izado)?|edicion|ediciÃ³n|import|importado)\b/gi,
            ""
        )
        .replace(/\s+/g, " ")
        .trim();
}

async function buscarPortadaDiscogs(artista, album) {
    try {
        const a = encodeURIComponent(limpiarParaBusqueda(artista));
        const b = encodeURIComponent(limpiarParaBusqueda(album));

        const resp = await fetch(
            `${URL_PROXY_DISCOGS}?artist=${a}&album=${b}`
        );

        if (!resp.ok) return null;

        const data = await resp.json();
        return data.cover || null;
    } catch (e) {
        console.warn("Discogs fallÃ³:", artista, album, e);
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
                .replace("100x100bb", "600x600bb");
        }

        return null;
    } catch (e) {
        console.warn("iTunes fallÃ³:", artista, album, e);
        return null;
    }
}

async function buscarPortada(artista, album) {
    const clave = claveItem(artista, album);

    if (clave in cachePortadas) {
        return cachePortadas[clave];
    }

    let url = await buscarPortadaDiscogs(artista, album);

    if (!url) {
        url = await buscarPortadaItunes(artista, album);
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
            console.warn("Whakoom proxy respondiÃ³:", resp.status, codigo);
            return null;
        }

        const data = await resp.json();
        const url = data.cover || null;

        cachePortadasComics[codigo] = url;
        guardarCachePortadasComics();

        return url;
    } catch (e) {
        console.warn("Whakoom fallÃ³:", codigo, e);
        return null;
    }
}

function obtenerTipoPagina() {
    const ruta = window.location.pathname.toLowerCase();

    if (ruta.includes("comics")) return "COMIC";
    if (ruta.includes("musica")) return "CD";

    return null; // null = pÃ¡gina combinada (ej. index.html), muestra todo
}

document.addEventListener("DOMContentLoaded", () => {
    const buscador = document.getElementById("buscador");
    const resultados = document.getElementById("resultados");

    let colaPendiente = [];

    function normalizar(texto) {
        return (texto || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");
    }

    function obtenerDestacados(cantidad = 12) {
        const copia = [...catalogo];

        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }

        return copia.slice(0, cantidad);
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

            resultados.style.display = "block";

            return;
        }

        resultados.style.display = "grid";

        lista.forEach(item => {
            const esComic = item.Tipo === "COMIC";

            const titulo = esComic
                ? (item["TÃ­tulo"] || "")
                : (item.Album || "");

            const subtitulo = esComic
                ? [
                    item.Serie,
                    item["NÃºmero"] ? `NÂº ${item["NÃºmero"]}` : ""
                ]
                    .filter(Boolean)
                    .join(" Â· ")
                : (item.Artista || "");

            const editorialOSello = esComic
                ? (item.Editorial || "")
                : (item.Sello || "");

            const anio = item["AÃ±o de lanzamiento"] || "";

            const clave = esComic
                ? claveComic(item)
                : claveItem(item.Artista, item.Album);

            const imagen = obtenerRutaImagen(item.Imagen);

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
                    ${anio ? `<p>${escapeHtml(anio)}</p>` : ""}
                    <p>${escapeHtml(item.Estado || "")}</p>
                    ${renderizarPrecio(item)}
                    <a
                        class="btn-whatsapp"
                        data-whatsapp-key="${escapeAttribute(claveComic(item))}"
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
                colaPendiente.push({ item, clave });
            }
        });

        procesarColaPortadas();
    }

    async function procesarColaPortadas() {
        for (const { item, clave } of colaPendiente) {
            let url = null;

            if (item.Tipo === "COMIC") {
                const isbn = limpiarISBN(item["CÃ³digo universal"]);

                if (isbn) {
                    url = await buscarPortadaComicWhakoom(isbn);
                }
            } else {
                url = await buscarPortada(item.Artista, item.Album);
            }

            if (url) {
                document
                    .querySelectorAll(`img[data-key="${CSS.escape(clave)}"]`)
                    .forEach(img => {
                        img.src = url;
                    });
            }

            await new Promise(resolve =>
                setTimeout(resolve, item.Tipo === "COMIC" ? 700 : 1100)
            );
        }
    }

    function cargarCSV(url, tipo) {
        return new Promise(resolve => {
            Papa.parse(url, {
                download: true,
                header: true,
                skipEmptyLines: true,

                complete: function(resultado) {
                    const datos = resultado.data.map(item => ({
                        ...item,
                        Tipo: tipo
                    }));

                    resolve(datos);
                },

                error: function(error) {
                    console.error(`No se pudo cargar ${tipo}:`, error);
                    resolve([]);
                }
            });
        });
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
        return escapeHtml(valor).replace(/`/g, "&#096;");
    }

    Promise.all([
        cargarCSV(URL_SHEET, "CD"),
        cargarCSV(URL_SHEET_COMICS, "COMIC"),
        cargarBonificaciones()
    ]).then(([cds, comics, bonif]) => {
        const catalogoCDs = cds.filter(
            item => (item.Artista || "").trim() && (item.Album || "").trim()
        );

        const catalogoComics = comics.filter(
            item => (item["TÃ­tulo"] || "").trim()
        );

        catalogo = [...catalogoCDs, ...catalogoComics];

        const tipoPagina = obtenerTipoPagina();

        if (tipoPagina) {
            catalogo = catalogo.filter(item => item.Tipo === tipoPagina);
        }

        bonificaciones = bonif;

        console.log("CDs cargados:", catalogoCDs.length);
        console.log("CÃ³mics cargados:", catalogoComics.length);
        console.log("CatÃ¡logo mostrado en esta pÃ¡gina:", catalogo.length);

        mostrarResultados(obtenerDestacados());
        mostrarBannerPromo();
        cargarPreciosOVNI(catalogo);
    });

    buscador.addEventListener("input", () => {
        const texto = normalizar(buscador.value);

        if (texto === "") {
            mostrarResultados(obtenerDestacados());
            return;
        }

        const encontrados = catalogo.filter(item => {
            let camposBusqueda;

            if (item.Tipo === "COMIC") {
                camposBusqueda = [
                    item["TÃ­tulo"],
                    item.Serie,
                    item["NÃºmero"],
                    item.Editorial,
                    item.Origen,
                    item["CÃ³digo universal"],
                    item["AÃ±o de lanzamiento"]
                ];
            } else {
                camposBusqueda = [
                    item.Artista,
                    item.Album,
                    item.Sello,
                    item.Origen,
                    item["AÃ±o de lanzamiento"]
                ];
            }

            return camposBusqueda.some(campo =>
                normalizar(campo).includes(texto)
            );
        });

        mostrarResultados(encontrados);
    });
});

