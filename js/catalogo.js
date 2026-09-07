const URL_SHEET =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=0&single=true&output=csv";

// ⚠️ Reemplazá esta URL por la que te dio Cloudflare al publicar el Worker
const URL_PROXY_DISCOGS = "https://leviatan-portadas.f-g-spratt.workers.dev";

// Número de WhatsApp del negocio (formato internacional, sin + ni espacios)
const WHATSAPP_NUMERO = "5493584283858";

let catalogo = [];

// ---- Caché de portadas (persiste entre visitas del usuario) ----
const CACHE_KEY = "leviatan_portadas_cache_v2";
let cachePortadas = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");

function guardarCachePortadas() {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cachePortadas));
}

function claveItem(artista, album) {
    return ((artista || "") + "___" + (album || "")).toLowerCase().trim();
}

// Considera "sin imagen" tanto una celda vacía como un placeholder tipo "sin-portada.jpg"
function tieneImagenValida(valor) {
    const v = (valor || "").trim().toLowerCase();
    if (!v) return false;
    if (v.includes("sin-portada") || v.includes("sin_portada") || v === "sinportada") return false;
    return true;
}

function armarLinkWhatsApp(item) {

    const partes = [
        `${item.Artista} - ${item.Album}`,
        item.Precio ? `Precio: ${item.Precio}` : null
    ].filter(Boolean);

    const mensaje = `Hola! Te consulto por este disco:\n${partes.join("\n")}`;

    return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;

}

// Limpia texto de ruido que arruina las búsquedas (paréntesis, "bootleg", "reedición", etc.)
function limpiarParaBusqueda(texto) {

    return (texto || "")
        .replace(/\(.*?\)/g, "")
        .replace(/\[.*?\]/g, "")
        .replace(/\b(reedicion|reedición|bootleg|vinilo|vinyl|lp|cd|remaster(izado)?|edicion|edición|import|importado)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();

}

async function buscarPortadaDiscogs(artista, album) {

    try {

        const a = encodeURIComponent(limpiarParaBusqueda(artista));
        const b = encodeURIComponent(limpiarParaBusqueda(album));

        const resp = await fetch(`${URL_PROXY_DISCOGS}?artist=${a}&album=${b}`);

        if (!resp.ok) return null;

        const data = await resp.json();

        return data.cover || null;

    } catch (e) {

        console.warn("Discogs falló:", artista, album, e);
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

        const data = await resp.json();

        if (data.results && data.results.length > 0) {
            return data.results[0].artworkUrl100.replace("100x100bb", "600x600bb");
        }

        return null;

    } catch (e) {

        console.warn("iTunes falló:", artista, album, e);
        return null;

    }

}

// Discogs primero (mejor cobertura de nicho), iTunes como respaldo
async function buscarPortada(artista, album) {

    const clave = claveItem(artista, album);

    if (clave in cachePortadas) return cachePortadas[clave];

    let url = await buscarPortadaDiscogs(artista, album);

    if (!url) {
        url = await buscarPortadaItunes(artista, album);
    }

    cachePortadas[clave] = url;
    guardarCachePortadas();

    return url;

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

            const precio = Number(item.Precio).toLocaleString("es-AR", {
                style: "currency",
                currency: "ARS"
            });

            const clave = claveItem(item.Artista, item.Album);

            resultados.innerHTML += `

            <article class="card">

                <img
                    data-key="${clave}"
                    src="img/${tieneImagenValida(item.Imagen) ? item.Imagen : "sin-portada.png"}"
                    alt="${item.Album}"
                    onerror="this.src='img/sin-portada.png'">

                <div class="card-body">

                    <h3>${item.Artista}</h3>

                    <p><strong>${item.Album}</strong></p>

                    <p>${item.Sello || ""}</p>

                    <p>${item.Origen || ""}</p>

                    <p>${item.Estado || ""}</p>

                   <div class="precio">
    ${item.Precio || ""}
</div>

                    <a
                        class="btn-whatsapp"
                        href="${armarLinkWhatsApp(item)}"
                        target="_blank"
                        rel="noopener">
                        Consultar por WhatsApp
                    </a>

                </div>

            </article>

            `;

            // Si la planilla no trae Imagen válida, la buscamos automáticamente
            if (!tieneImagenValida(item.Imagen)) {
                colaPendiente.push({ item, clave });
            }

        });

        procesarColaPortadas();

    }

    async function procesarColaPortadas() {

        for (const { item, clave } of colaPendiente) {

            const url = await buscarPortada(item.Artista, item.Album);

            if (url) {
                document
                    .querySelectorAll(`img[data-key="${CSS.escape(clave)}"]`)
                    .forEach(img => { img.src = url; });
            }

            // Pausa para no pasarnos del límite de pedidos por minuto de Discogs
            await new Promise(r => setTimeout(r, 1100));

        }

    }

    Papa.parse(URL_SHEET, {

        download: true,
        header: true,
        skipEmptyLines: true,

        complete: function(resultado) {

       catalogo = resultado.data.filter(item =>
    (item.Artista || "").trim() &&
    (item.Album || "").trim()
);
            console.log("Catálogo cargado:", catalogo.length);

            mostrarResultados(obtenerDestacados());

        }

    });

    buscador.addEventListener("input", () => {

        const texto = normalizar(buscador.value);

        if (texto === "") {

            mostrarResultados(obtenerDestacados());

            return;

        }

        const encontrados = catalogo.filter(item =>

            normalizar(item.Artista).includes(texto) ||
            normalizar(item.Album).includes(texto)

        );

        mostrarResultados(encontrados);

    });

});
