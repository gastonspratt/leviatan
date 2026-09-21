const URL_COMICS_OVNI =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=2096118978&single=true&output=csv";

const URL_OVNI_BUSQUEDA = "https://s.jina.ai/?q=";
const CACHE_OVNI = "leviatan_ovni_precios_v2";
const CACHE_TTL = 1000 * 60 * 60 * 12;

let comicsOVNI = [];
let cacheOVNI = JSON.parse(
    localStorage.getItem(CACHE_OVNI) || "{}"
);
let consultasOVNI = new Set();

function normalizarOVNI(texto) {
    return (texto || "")
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function parsearPrecioOVNI(texto) {
    const encontrados = String(texto || "").match(
        /\$\s*[0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]{1,2})?/g
    ) || [];

    for (const encontrado of encontrados) {
        const numero = Number(
            encontrado
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

function formatearPrecioOVNI(numero) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0
    }).format(numero);
}

function obtenerClaveOVNI(item) {
    return [
        item["Título"] || "",
        item.Serie || "",
        item["Número"] || ""
    ].join("|");
}

function buscarComicVisible(titulo, subtitulo) {
    const t = normalizarOVNI(titulo);
    const s = normalizarOVNI(subtitulo);

    const candidatos = comicsOVNI.filter(item =>
        normalizarOVNI(item["Título"]) === t
    );

    if (candidatos.length === 1) {
        return candidatos[0];
    }

    const porNumero = candidatos.find(item => {
        const numero = normalizarOVNI(item["Número"]);
        const serie = normalizarOVNI(item.Serie);

        return (
            (!numero || s.includes(numero)) &&
            (!serie || s.includes(serie))
        );
    });

    return porNumero || candidatos[0] || null;
}

async function buscarPrecioOVNI(item) {
    const clave = obtenerClaveOVNI(item);
    const guardado = cacheOVNI[clave];

    if (
        guardado &&
        Date.now() - guardado.timestamp < CACHE_TTL
    ) {
        return guardado.precio;
    }

    const isbn =
        item.ISBN ||
        item["Código universal"] ||
        "";

    const titulo = item["Título"] || "";
    const serie = item.Serie || "";
    const numero = item["Número"] || "";

    const consulta = isbn
        ? `site:ovnipress.net/productos "${isbn}"`
        : `site:ovnipress.net/productos "${titulo}" "${serie}" "${numero}"`;

    try {
        const respuesta = await fetch(
            URL_OVNI_BUSQUEDA +
            encodeURIComponent(consulta)
        );

        if (!respuesta.ok) {
            return null;
        }

        const texto = await respuesta.text();
        const precio = parsearPrecioOVNI(texto);

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
            "Precio OVNI no disponible:",
            titulo,
            error
        );
    }

    return null;
}

async function actualizarPreciosVisibles() {
    const resultados = document.getElementById("resultados");

    if (!resultados || comicsOVNI.length === 0) {
        return;
    }

    const tarjetas = resultados.querySelectorAll(".card");

    for (const tarjeta of tarjetas) {
        const tituloEl = tarjeta.querySelector(
            ".card-body p strong"
        );

        const subtituloEl = tarjeta.querySelector(
            ".card-body h3"
        );

        const precioEl = tarjeta.querySelector(
            ".card-body .precio"
        );

        if (!tituloEl || !precioEl) {
            continue;
        }

        if (precioEl.textContent.trim()) {
            continue;
        }

        const titulo = tituloEl.textContent.trim();
        const subtitulo = subtituloEl
            ? subtituloEl.textContent.trim()
            : "";

        const item = buscarComicVisible(
            titulo,
            subtitulo
        );

        if (!item) {
            continue;
        }

        const clave = obtenerClaveOVNI(item);

        if (consultasOVNI.has(clave)) {
            continue;
        }

        consultasOVNI.add(clave);

        const precio = await buscarPrecioOVNI(item);

        if (precio !== null) {
            precioEl.textContent =
                formatearPrecioOVNI(precio);
        }

        await new Promise(resolve =>
            setTimeout(resolve, 500)
        );
    }
}

async function iniciarPreciosOVNI() {
    Papa.parse(URL_COMICS_OVNI, {
        download: true,
        header: true,
        skipEmptyLines: true,

        complete: async function(resultado) {
            comicsOVNI = resultado.data.filter(item =>
                /ovni\s*press/i.test(
                    item.Editorial || ""
                ) &&
                !(item.Precio || "").trim() &&
                (item["Título"] || "").trim()
            );

            await actualizarPreciosVisibles();

            const resultados =
                document.getElementById("resultados");

            if (resultados) {
                let temporizador = null;

                const observer =
                    new MutationObserver(() => {
                        clearTimeout(temporizador);

                        temporizador = setTimeout(
                            actualizarPreciosVisibles,
                            300
                        );
                    });

                observer.observe(resultados, {
                    childList: true,
                    subtree: true
                });
            }
        },

        error: function(error) {
            console.warn(
                "No se pudo cargar el catálogo OVNI:",
                error
            );
        }
    });
}

document.addEventListener(
    "DOMContentLoaded",
    iniciarPreciosOVNI
);