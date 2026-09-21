const URL_SITEMAP_OVNI =
    "https://r.jina.ai/https://www.ovnipress.net/sitemap.xml";

const URL_READER_OVNI =
    "https://r.jina.ai/";

const URL_COMICS_SHEET_OVNI =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=2096118978&single=true&output=csv";

const CACHE_OVNI = "leviatan_ovni_precios_v3";
const CACHE_TTL_OVNI = 1000 * 60 * 60 * 12;

let productosOVNI = [];
let urlsOVNI = [];
let cacheOVNI = JSON.parse(
    localStorage.getItem(CACHE_OVNI) || "{}"
);
let consultasOVNI = new Set();
let timerOVNI = null;

function normalizarOVNI(texto) {
    return (texto || "")
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function tokensOVNI(texto) {
    return normalizarOVNI(texto)
        .split(/\s+/)
        .filter(token =>
            token.length >= 3 &&
            ![
                "los",
                "las",
                "del",
                "una",
                "uno",
                "con",
                "para",
                "the",
                "and",
                "vol",
                "nro"
            ].includes(token)
        );
}

function claveOVNI(item) {
    return [
        item["Título"] || "",
        item.Serie || "",
        item["Número"] || ""
    ].join("|");
}

function precioOVNI(texto) {
    const coincidencias = String(texto || "").match(
        /##\s*\$[0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]{1,2})?/g
    ) || [];

    for (const valor of coincidencias) {
        const numero = Number(
            valor
                .replace(/[^0-9,.-]/g, "")
                .replace(/\./g, "")
                .replace(",", ".")
        );

        if (Number.isFinite(numero) && numero >= 1000) {
            return numero;
        }
    }

    return null;
}

function formatoPrecioOVNI(numero) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0
    }).format(numero);
}

function puntuacionProducto(item, url) {
    const texto = normalizarOVNI(
        `${item["Título"] || ""} ${item.Serie || ""} ${item["Número"] || ""}`
    );

    const slug = normalizarOVNI(
        url
            .replace("https://www.ovnipress.net/productos/", "")
            .replace("/", "")
            .replace(/-/g, " ")
    );

    const buscados = tokensOVNI(texto);

    let puntos = 0;

    for (const token of buscados) {
        if (slug.includes(token)) {
            puntos++;
        }
    }

    const titulo = normalizarOVNI(item["Título"] || "");

    if (
        titulo &&
        slug.includes(
            titulo.replace(/\s+/g, " ")
        )
    ) {
        puntos += 5;
    }

    return puntos;
}

function encontrarProductoOVNI(item) {
    let mejor = null;
    let mejorPuntaje = 0;

    for (const url of urlsOVNI) {
        const puntos = puntuacionProducto(item, url);

        if (puntos > mejorPuntaje) {
            mejorPuntaje = puntos;
            mejor = url;
        }
    }

    return mejorPuntaje >= 2 ? mejor : null;
}

async function cargarSitemapOVNI() {
    try {
        const respuesta = await fetch(URL_SITEMAP_OVNI);

        if (!respuesta.ok) {
            return;
        }

        const texto = await respuesta.text();

        urlsOVNI = [
            ...new Set(
                texto.match(
                    /https:\/\/www\.ovnipress\.net\/productos\/[^<\s]+/g
                ) || []
            )
        ];

        urlsOVNI = urlsOVNI.map(url =>
            url.replace(/["')]+$/g, "")
        );
    } catch (error) {
        console.warn(
            "No se pudo leer el sitemap de OVNI:",
            error
        );
    }
}

async function buscarPrecioOVNI(item) {
    const clave = claveOVNI(item);
    const guardado = cacheOVNI[clave];

    if (
        guardado &&
        Date.now() - guardado.timestamp < CACHE_TTL_OVNI
    ) {
        return guardado.precio;
    }

    const url = encontrarProductoOVNI(item);

    if (!url) {
        return null;
    }

    try {
        const respuesta = await fetch(
            URL_READER_OVNI + url
        );

        if (!respuesta.ok) {
            return null;
        }

        const texto = await respuesta.text();
        const precio = precioOVNI(texto);

        if (precio !== null) {
            cacheOVNI[clave] = {
                precio,
                timestamp: Date.now()
            };

            localStorage.setItem(
                CACHE_OVNI,
                JSON.stringify(cacheOVNI)
            );

            return precio;
        }
    } catch (error) {
        console.warn(
            "Error consultando OVNI:",
            item["Título"],
            error
        );
    }

    return null;
}

async function actualizarPreciosOVNI() {
    const resultados =
        document.getElementById("resultados");

    if (
        !resultados ||
        !productosOVNI.length ||
        !urlsOVNI.length
    ) {
        return;
    }

    const tarjetas =
        [...resultados.querySelectorAll(".card")];

    const trabajos = [];

    for (const tarjeta of tarjetas) {
        const tituloEl =
            tarjeta.querySelector(
                ".card-body p strong"
            );

        const subtituloEl =
            tarjeta.querySelector(
                ".card-body h3"
            );

        const precioEl =
            tarjeta.querySelector(
                ".card-body .precio"
            );

        if (
            !tituloEl ||
            !precioEl ||
            precioEl.textContent.trim()
        ) {
            continue;
        }

        const titulo =
            tituloEl.textContent.trim();

        const subtitulo =
            subtituloEl
                ? subtituloEl.textContent.trim()
                : "";

        const item = productosOVNI.find(producto => {
            const mismoTitulo =
                normalizarOVNI(
                    producto["Título"]
                ) === normalizarOVNI(titulo);

            if (!mismoTitulo) {
                return false;
            }

            const serie =
                normalizarOVNI(
                    producto.Serie
                );

            const sub =
                normalizarOVNI(
                    subtitulo
                );

            return (
                !serie ||
                sub.includes(serie) ||
                normalizarOVNI(
                    producto["Número"]
                ) ===
                    normalizarOVNI(subtitulo)
                    .replace(/[^0-9]/g, "")
            );
        });

        if (!item) {
            continue;
        }

        const clave = claveOVNI(item);

        if (consultasOVNI.has(clave)) {
            continue;
        }

        consultasOVNI.add(clave);

        trabajos.push({
            tarjeta,
            precioEl,
            item
        });

        if (trabajos.length >= 3) {
            break;
        }
    }

    const resultadosPrecios =
        await Promise.all(
            trabajos.map(async trabajo => ({
                ...trabajo,
                precio: await buscarPrecioOVNI(
                    trabajo.item
                )
            }))
        );

    for (const trabajo of resultadosPrecios) {
        if (trabajo.precio !== null) {
            trabajo.precioEl.textContent =
                formatoPrecioOVNI(
                    trabajo.precio
                );
        }
    }

    if (trabajos.length > 0) {
        setTimeout(
            actualizarPreciosOVNI,
            1000
        );
    }
}

function vigilarCatalogoOVNI() {
    const resultados =
        document.getElementById("resultados");

    if (!resultados) {
        return;
    }

    const observer =
        new MutationObserver(() => {
            clearTimeout(timerOVNI);

            timerOVNI = setTimeout(
                actualizarPreciosOVNI,
                500
            );
        });

    observer.observe(resultados, {
        childList: true,
        subtree: true
    });
}

function iniciarOVNI() {
    const resultados =
        document.getElementById("resultados");

    if (!resultados) {
        return;
    }

    vigilarCatalogoOVNI();

    Papa.parse(
        URL_COMICS_SHEET_OVNI,
        {
            download: true,
            header: true,
            skipEmptyLines: true,

            complete: async function(resultado) {
                productosOVNI =
                    resultado.data.filter(item =>
                        /ovni\s*press/i.test(
                            item.Editorial || ""
                        ) &&
                        !(item.Precio || "").trim() &&
                        (item["Título"] || "").trim()
                    );

                await cargarSitemapOVNI();
                actualizarPreciosOVNI();
            }
        }
    );
}

document.addEventListener(
    "DOMContentLoaded",
    iniciarOVNI
);