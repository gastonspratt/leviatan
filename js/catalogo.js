const URL_SHEET =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=0&single=true&output=csv";

let catalogo = [];

// ---- Caché de portadas (persiste entre visitas del usuario) ----
const CACHE_KEY = "leviatan_portadas_cache";
let cachePortadas = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");

function guardarCachePortadas() {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cachePortadas));
}

function claveItem(artista, album) {
    return ((artista || "") + "___" + (album || "")).toLowerCase().trim();
}

async function buscarPortadaItunes(artista, album) {

    const clave = claveItem(artista, album);

    // Si ya la buscamos antes (aunque no haya encontrado nada), no repetir
    if (clave in cachePortadas) return cachePortadas[clave];

    try {

        const termino = encodeURIComponent(`${artista} ${album}`);

        const resp = await fetch(
            `https://itunes.apple.com/search?term=${termino}&entity=album&limit=1`
        );

        const data = await resp.json();

        if (data.results && data.results.length > 0) {
            // iTunes devuelve 100x100 por defecto, pedimos una versión más grande
            const url = data.results[0].artworkUrl100.replace("100x100bb", "600x600bb");
            cachePortadas[clave] = url;
        } else {
            cachePortadas[clave] = null;
        }

    } catch (e) {

        console.warn("No se pudo buscar portada:", artista, album, e);
        cachePortadas[clave] = null;

    }

    guardarCachePortadas();

    return cachePortadas[clave];

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
                    src="img/${item.Imagen || "sin-portada.png"}"
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

                </div>

            </article>

            `;

            // Si la planilla no trae Imagen, la buscamos en iTunes
            if (!(item.Imagen || "").trim()) {
                colaPendiente.push({ item, clave });
            }

        });

        procesarColaPortadas();

    }

    async function procesarColaPortadas() {

        for (const { item, clave } of colaPendiente) {

            const url = await buscarPortadaItunes(item.Artista, item.Album);

            if (url) {
                document
                    .querySelectorAll(`img[data-key="${CSS.escape(clave)}"]`)
                    .forEach(img => { img.src = url; });
            }

            // pequeña pausa entre pedidos para no saturar la API pública
            await new Promise(r => setTimeout(r, 150));

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
