const URL_SHEET = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=0&single=true&output=csv";
const URL_SHEET_COMICS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=2096118978&single=true&output=csv";
const URL_PROXY = "https://leviatan-portadas.f-g-spratt.workers.dev";
const WHATSAPP_NUMERO = "5493584283858";

// Leer configuración del panel admin
const BONIFICACION = {
  get porcentaje() { return window.configAdmin?.descuento || 10; },
  get activa() { return true; },
  get mostrarTachado() { return window.configAdmin?.mostrarTachado !== false; },
  get fuente() { return window.configAdmin?.fuente || "ovnipress"; }
};

let catalogo = [];
const CACHE_KEY = "leviatan_portadas_cache_v2";
let cachePortadas = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");

function guardarCachePortadas() {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cachePortadas));
}

function claveItem(artista, album) {
  return ((artista || "") + "___" + (album || "")).toLowerCase().trim();
}

function claveComic(serie, titulo) {
  return ("comic_" + (serie || "") + "_" + (titulo || "")).toLowerCase().trim().replace(/\s+/g, "-");
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

function calcularBonificacion(precio) {
  if (!precio) return null;
  const numero = parseFloat(String(precio).replace(/[^0-9]/g, ""));
  if (isNaN(numero)) return null;
  return Math.round(numero * (1 - BONIFICACION.porcentaje / 100));
}

function formatearPrecio(numero) {
  return "$" + numero.toLocaleString("es-AR");
}

function armarLinkWhatsApp(item, precioFinal) {
  let titulo, mensaje;
  if (item.Tipo === "COMIC") {
    titulo = [item["Título"], item.Serie ? `(${item.Serie})` : "", item["Número"] ? `Nº ${item["Número"]}` : ""].filter(Boolean).join(" ");
    const precioTexto = precioFinal ? `Precio: ${formatearPrecio(precioFinal)}` : (item.Precio ? `Precio: ${item.Precio}` : "");
    mensaje = `Hola! Te consulto por este cómic:\n${titulo}\n${precioTexto}`;
  } else {
    titulo = `${item.Artista} - ${item.Album}`;
    mensaje = `Hola! Te consulto por este disco:\n${titulo}` + (item.Precio ? `\nPrecio: ${item.Precio}` : "");
  }
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}

function limpiarTextoBusqueda(texto) {
  return (texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

document.addEventListener("DOMContentLoaded", () => {
  const buscador = document.getElementById("buscador");
  const resultados = document.getElementById("resultados");
  let colaPendiente = [];

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
      const clave = esComic ? claveComic(item.Serie, item["Título"]) : claveItem(item.Artista, item.Album);
      const imagen = obtenerRutaImagen(item.Imagen);

      // Precio inicial (de planilla)
      const precioPlanilla = item.Precio || "";
      let precioHTML = `<div class="precio">${precioPlanilla}</div>`;

      resultados.innerHTML += `
        <article class="card" data-clave="${clave}">
          <img data-key="${clave}" src="${imagen}" alt="${titulo}" onerror="this.src='img/sin-portada.png'">
          <div class="card-body">
            <h3>${subtitulo}</h3>
            <p><strong>${titulo}</strong></p>
            <p>${editorialOSello}</p>
            <p>${item.Origen || ""}</p>
            ${anio ? `<p>${anio}</p>` : ""}
            <p>${item.Estado || ""}</p>
            <div class="precio-container" id="precio-${clave}">
              ${precioHTML}
            </div>
            <a class="btn-whatsapp" href="${armarLinkWhatsApp(item, null)}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
          </div>
        </article>
      `;

      if (!tieneImagenValida(item.Imagen)) {
        colaPendiente.push({ item, clave });
      }

      // Buscar precio actualizado para cómics
      if (esComic) {
        buscarPrecioActualizado(item, clave);
      }
    });

    procesarColaPortadas();
  }

  async function buscarPrecioActualizado(item, clave) {
    try {
      const nombre = `${item.Serie || ""} ${item["Título"] || ""}`.trim();
      if (!nombre) return;

      let precioLista, precioBonificado, fuente;

      if (BONIFICACION.fuente === "ovnipress") {
        // Buscar en OvniPress
        const url = `${URL_PROXY}/precio?nombre=${encodeURIComponent(nombre)}&bonificacion=${BONIFICACION.porcentaje}`;
        const resp = await fetch(url);
        const data = await resp.json();
        
        if (data.precioLista) {
          precioLista = data.precioLista;
          precioBonificado = data.precioBonificado;
          fuente = "OvniPress";
        }
      }

      // Si no encontró en OvniPress o usa planilla, usar precio de planilla
      if (!precioLista && item.Precio) {
        const num = parseFloat(String(item.Precio).replace(/[^0-9]/g, ""));
        if (!isNaN(num)) {
          precioLista = num;
          precioBonificado = BONIFICACION.activa ? Math.round(num * (1 - BONIFICACION.porcentaje / 100)) : num;
          fuente = "Planilla";
        }
      }

      if (precioLista && precioBonificado && BONIFICACION.mostrarTachado) {
        const container = document.getElementById(`precio-${clave}`);
        const btn = document.querySelector(`article[data-clave="${CSS.escape(clave)}"] .btn-whatsapp`);
        
        if (container) {
          container.innerHTML = `
            <span class="precio-tachado">${formatearPrecio(precioLista)}</span>
            <span class="precio-bonificado">${formatearPrecio(precioBonificado)}</span>
            <span class="${fuente === 'OvniPress' ? 'ovnipress-tag' : 'tag-descuento'}">${fuente}</span>
          `;
        }
        
        if (btn) {
          btn.href = armarLinkWhatsApp(item, precioBonificado);
        }
      }

    } catch (e) {
      console.warn("Error buscando precio:", e);
    }
  }

  async function procesarColaPortadas() {
    for (const { item, clave } of colaPendiente) {
      try {
        const url = `${URL_PROXY}/comic?nombre=${encodeURIComponent(item.Serie + " " + item["Título"])}`;
        const resp = await fetch(url);
        const data = await resp.json();
        
        if (data.cover) {
          document.querySelectorAll(`img[data-key="${CSS.escape(clave)}"]`).forEach(img => {
            img.src = data.cover;
          });
          cachePortadas[clave] = data.cover;
          guardarCachePortadas();
        }
      } catch (e) {
        console.warn("Error cargando portada:", e);
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
        complete: (resultado) => {
          resolve(resultado.data.map(item => ({ ...item, Tipo: tipo })));
        },
        error: (error) => {
          console.error(`Error cargando ${tipo}:`, error);
          resolve([]);
        }
      });
    });
  }

  Promise.all([
    cargarCSV(URL_SHEET, "CD"),
    cargarCSV(URL_SHEET_COMICS, "COMIC")
  ]).then(([cds, comics]) => {
    const catalogoCDs = cds.filter(i => (i.Artista || "").trim() && (i.Album || "").trim());
    const catalogoComics = comics.filter(i => (i["Título"] || "").trim());
    catalogo = [...catalogoCDs, ...catalogoComics];
    
    console.log(`CDs: ${catalogoCDs.length}, Cómics: ${catalogoComics.length}, Total: ${catalogo.length}`);
    mostrarResultados(obtenerDestacados());
  });

  buscador.addEventListener("input", () => {
    const texto = limpiarTextoBusqueda(buscador.value);
    if (texto === "") {
      mostrarResultados(obtenerDestacados());
      return;
    }
    
    const encontrados = catalogo.filter(item => {
      const campos = item.Tipo === "COMIC" 
        ? [item["Título"], item.Serie, item["Número"], item.Editorial, item.Origen, item.ISBN]
        : [item.Artista, item.Album, item.Sello, item.Origen];
      return campos.some(c => limpiarTextoBusqueda(c).includes(texto));
    });
    
    mostrarResultados(encontrados);
  });
});
