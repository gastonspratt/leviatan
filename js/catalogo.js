const URL_SHEET = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=0&single=true&output=csv";
const URL_SHEET_COMICS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=2096118978&single=true&output=csv";
const URL_PROXY_DISCOGS = "https://leviatan-portadas.f-g-spratt.workers.dev";
const WHATSAPP_NUMERO = "5493584283858";

let catalogo = [];
const CACHE_KEY = "leviatan_portadas_cache_v2";
let cachePortadas = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");

function guardarCachePortadas() {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cachePortadas));
}

function claveItem(artista, album) {
    return ((artista || "") + "___" + (album || "")).toLowerCase().trim();
}

function claveComic(isbn, titulo) {
    return ("comic_" + (isbn || "") + "_" + (titulo || "")).toLowerCase().trim();
}

function tieneImagenValida(valor) {
    const v = (valor || "").trim().toLowerCase();
    if (!v) return false;
    if (v.includes("sin-portada") || v.includes("sin_portada") || v === "sinportada") return false;
    return true;
}

function obtenerRutaImagen(valor) {
    if (!tieneImagenValida(valor)) return "img/sin-portada.png";
    const imagen = valor.trim();
    if (imagen.startsWith("http://") || imagen.startsWith("https://")) return imagen;
    if (imagen.startsWith("img/")) return imagen;
    return `img/${imagen}`;
}

function armarLinkWhatsApp(item) {
    let titulo, mensaje;
    if (item.Tipo === "COMIC") {
        titulo = [item["Título"], item.Serie ? `(${item.Serie})` : "", item["Número"] ? `Nº ${item["Número"]}` : ""].filter(Boolean).join(" ");
        mensaje = `Hola! Te consulto por este cómic:\n${titulo}` + (item.Precio ? `\nPrecio: ${item.Precio}` : "");
    } else {
        titulo = `${item.Artista} - ${item.Album}`;
        mensaje = `Hola! Te consulto por este disco:\n${titulo}` + (item.Precio ? `\nPrecio: ${item.Precio}` : "");
    }
    return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}

function limpiarParaBusqueda(texto) {
    return (texto || "").replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").replace(/\b(reedicion|reedición|bootleg|vinilo|vinyl|lp|cd|remaster(izado)?|edicion|edición|import|importado)\b/gi, "").replace(/\s+/g, " ").trim();
}

function limpiarISBN(valor) {
    return String(valor || "").replace(/[^0-9Xx]/g, "").trim();
}

// Buscar portada de disco en Discogs (vía Worker)
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

// Buscar portada de disco en iTunes
async function buscarPortadaItunes(artista, album) {
    try {
        const termino = encodeURIComponent(`${limpiarParaBusqueda(artista)} ${limpiarParaBusqueda(album)}`);
        const resp = await fetch(`https://itunes.apple.com/search?term=${termino}&entity=album&limit=1`);
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

// Buscar portada de cómic en Whakoom (vía Worker)
async function buscarPortadaComic(isbn, titulo) {
    const isbnLimpio = limpiarISBN(isbn);
    if (!isbnLimpio && !titulo) return null;

    const clave = claveComic(isbnLimpio, titulo);
    if (clave in cachePortadas) return cachePortadas[clave];

    try {
        // Llamar al Worker en lugar de Whakoom directo
        const resp = await fetch(`${URL_PROXY_DISCOGS}/comic?isbn=${encodeURIComponent(isbnLimpio || titulo)}`);

        if (!resp.ok) {
            console.warn("Worker respondió error:", resp.status);
            return null;
        }

        const data = await resp.json();

        if (data.cover) {
            cachePortadas[clave] = data.cover;
            guardarCachePortadas();
            return data.cover;
        }

        return null;

    } catch (e) {
        console.warn("Whakoom/Worker falló:", isbn, titulo, e);
        return null;
    }
}

// Buscar portada genérica
async function buscarPortada(item) {
    if (item.Tipo === "COMIC") {
        return await buscarPortadaComic(item.ISBN, item["Título"]);
    } else {
        const clave = claveItem(item.Artista, item.Album);
        if (clave in cachePortadas) return cachePortadas[clave];

        let url = await buscarPortadaDiscogs(item.Artista, item.Album);
        if (!url) url = await buscarPortadaItunes(item.Artista, item.Album);

        if (url) {
            cachePortadas[clave] = url;
            guardarCachePortadas();
        }

        return url;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const buscador = document.getElementById("buscador");
    const resultados = document.getElementById("resultados");
    let colaPendiente = [];

    function normalizar(texto) {
        return (texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
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
            resultados.innerHTML = `<div class="sin-resultados">No se encontraron resultados.</div>`;
            resultados.style.display = "block";
            return;
        }

        resultados.style.display = "grid";

        lista.forEach(item => {
            const esComic = item.Tipo === "COMIC";
            const titulo = esComic ? (item["Título"] || "") : (item.Album || "");
            const subtitulo = esComic ? [item.Serie, item["Número"] ? `Nº ${item["Número"]}` : ""].filter(Boolean).join(" · ") : (item.Artista || "");
            const editorialOSello = esComic ? (item.Editorial || "") : (item.Sello || "");
            const anio = item["Año de lanzamiento"] || "";

            const clave = esComic
                ? claveComic(item.ISBN, item["Título"])
                : claveItem(item.Artista, item.Album);

            const imagen = obtenerRutaImagen(item.Imagen);

            resultados.innerHTML += `
                <article class="card">
                    <img data-key="${clave}" src="${imagen}" alt="${titulo}" onerror="this.src='img/sin-portada.png'">
                    <div class="card-body">
                        <h3>${subtitulo}</h3>
                        <p><strong>${titulo}</strong></p>
                        <p>${editorialOSello}</p>
                        <p>${item.Origen || ""}</p>
                        ${anio ? `<p>${anio}</p>` : ""}
                        <p>${item.Estado || ""}</p>
                        <div class="precio">${item.Precio || ""}</div>
                        <a class="btn-whatsapp" href="${armarLinkWhatsApp(item)}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
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
            const url = await buscarPortada(item);

            if (url) {
                document.querySelectorAll(`img[data-key="${CSS.escape(clave)}"]`).forEach(img => {
                    img.src = url;
                });
            }

            await new Promise(resolve => setTimeout(resolve, 1100));
        }
    }

    function cargarCSV(url, tipo) {
        return new Promise(resolve => {
            Papa.parse(url, {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: function(resultado) {
                    const datos = resultado.data.map(item => ({ ...item, Tipo: tipo }));
                    resolve(datos);
                },
                error: function(error) {
                    console.error(`No se pudo cargar ${tipo}:`, error);
                    resolve([]);
                }
            });
        });
    }

    Promise.all([
        cargarCSV(URL_SHEET, "CD"),
        cargarCSV(URL_SHEET_COMICS, "COMIC")
    ]).then(([cds, comics]) => {
        const catalogoCDs = cds.filter(item => (item.Artista || "").trim() && (item.Album || "").trim());
        const catalogoComics = comics.filter(item => (item["Título"] || "").trim());
        catalogo = [...catalogoCDs, ...catalogoComics];

        console.log("CDs cargados:", catalogoCDs.length);
        console.log("Cómics cargados:", catalogoComics.length);
        console.log("Catálogo total:", catalogo.length);

        mostrarResultados(obtenerDestacados());
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
                    item["Título"],
                    item.Serie,
                    item["Número"],
                    item.Editorial,
                    item.Origen,
                    item["Año de lanzamiento"],
                    item.ISBN
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

            return camposBusqueda.some(campo => normalizar(campo).includes(texto));
        });

        mostrarResultados(encontrados);
    });
});
