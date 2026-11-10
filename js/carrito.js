/* CARRITO DE PEDIDO — Leviatán
   Guarda en el navegador, arma una comanda y la manda por WhatsApp.
   No cobra: el pago se coordina después de confirmar stock. */
(() => {
  const NUMERO = "5493584283858";
  const CLAVE = "leviatan_pedido_v1";
  const SHEET_CD = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=0&single=true&output=csv";

  let pedido = [];
  try { pedido = JSON.parse(localStorage.getItem(CLAVE) || "[]"); } catch { pedido = []; }

  const guardar = () => localStorage.setItem(CLAVE, JSON.stringify(pedido));
  const plata = n => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
  const esc = t => String(t ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

 function precioNum(v) {
  let t = String(v ?? "").trim().replace(/[^0-9,.-]/g, "");
  if (!t) return null;

  const coma = t.lastIndexOf(",");
  const punto = t.lastIndexOf(".");

  if (coma !== -1 && punto !== -1) {
    // El último separador es el decimal.
    if (coma > punto) {
      t = t.replace(/\./g, "").replace(",", ".");
    } else {
      t = t.replace(/,/g, "");
    }
  } else if (coma !== -1 || punto !== -1) {
    const sep = coma !== -1 ? "," : ".";
    const partes = t.split(sep);

    if (partes.length === 2 && partes[1].length === 3) {
      // Separador de miles.
      t = partes.join("");
    } else {
      // Separador decimal.
      t = t.replace(sep, ".");
    }
  }

  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : null;
}

  const claveDe = (artista, album) => (artista + "___" + album).toLowerCase().trim();

 function normalizarEstado(estado) {
    return String(estado ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function disponible(estado) {
    return normalizarEstado(estado) === "en stock";
}

function agregar(item) {
    if (!disponible(item.estado)) return;
    if (pedido.some(p => p.clave === item.clave)) return;

    pedido.push(item);
    guardar();
    pintar();
}
  function quitar(clave) { pedido = pedido.filter(p => p.clave !== clave); guardar(); pintar(); }

  /* --- Comanda --- */
  function pintar() {
    const caja = document.getElementById("comanda-lineas");
    const cuenta = document.getElementById("comanda-cuenta");
    const totalEl = document.getElementById("comanda-total");
    const enviar = document.getElementById("comanda-enviar");
    const badge = document.getElementById("carrito-badge");
    if (caja) {
    // Aquí permanece el código actual que dibuja la comanda.
}

    if (badge) {
      badge.classList.toggle("visible", pedido.length > 0);
      const n = badge.querySelector("b");
      if (n) n.textContent = pedido.length;
    }
    if (cuenta) cuenta.textContent = pedido.length + (pedido.length === 1 ? " ÍTEM" : " ÍTEMS");

    if (!pedido.length) {
      caja.innerHTML = '<div class="comanda__vacia">Todavía no agregaste nada.</div>';
    } else {
      caja.innerHTML = pedido.map(p =>
        `<div class="comanda__linea"><span><strong>${esc(p.artista)}</strong> — ${esc(p.album)}</span>
         <span class="monto">${plata(p.precio)}</span>
         <button class="comanda__quitar" data-quitar="${esc(p.clave)}" aria-label="Quitar ${esc(p.artista)}">✕</button></div>`
      ).join("");
    }

    const total = pedido.reduce((a, p) => a + p.precio, 0);
    if (totalEl) totalEl.textContent = plata(total);

    if (enviar) {
      if (!pedido.length) { enviar.classList.add("off"); enviar.removeAttribute("href"); }
      else {
        enviar.classList.remove("off");
        const texto = "Hola, quiero reservar este pedido de Leviatán:\n\n"
          + pedido.map((p, i) => `${i + 1}. ${p.artista} — ${p.album}${p.estado ? " (" + p.estado + ")" : ""} — ${plata(p.precio)}`).join("\n")
          + `\n\nTotal: ${plata(total)}\n\n¿Está disponible?`;
        enviar.href = "https://wa.me/" + NUMERO + "?text=" + encodeURIComponent(texto);
      }
    }

    document.querySelectorAll("[data-agregar]").forEach(b => {
      const dentro = pedido.some(p => p.clave === b.dataset.agregar);
      b.disabled = dentro;
      b.textContent = dentro ? "EN LA COMANDA" : "AGREGAR";
    });
  }

  document.addEventListener("click", e => {
    const add = e.target.closest("[data-agregar]");
    if (add) {
      agregar({
        clave: add.dataset.agregar,
        artista: add.dataset.artista || "",
        album: add.dataset.album || "",
        estado: add.dataset.estado || "",
        precio: Number(add.dataset.precio) || 0
      });
    }
    const q = e.target.closest("[data-quitar]");
    if (q) quitar(q.dataset.quitar);
  });

  document.getElementById("comanda-vaciar")?.addEventListener("click", () => { pedido = []; guardar(); pintar(); });

  /* --- Destacados de la portada --- */
  async function destacados() {
    const caja = document.getElementById("destacados");
    if (!caja || !window.Papa) return;
    Papa.parse(SHEET_CD, {
      download: true, header: true, skipEmptyLines: true,
      complete: r => {
     const items = (r.data || []).filter(x =>
  (x.Artista || "").trim() &&
  (x.Album || "").trim() &&
  precioNum(x.Precio) &&
  String(x.Estado || "").trim().toLowerCase() === "en stock"
);
        caja.innerHTML = items.slice(0, 8).map(x => {
          const p = precioNum(x.Precio);
          const clave = claveDe(x.Artista, x.Album);
          const img = /^https?:\/\//i.test(x.Imagen || "") ? x.Imagen : "img/sin-portada.png";
          return `<article class="mini">
            <img class="mini__img" src="${esc(img)}" alt="${esc(x.Artista)} - ${esc(x.Album)}" loading="lazy" onerror="this.src='img/sin-portada.png'">
            <div class="mini__cuerpo">
              <div class="mini__artista">${esc(x.Artista)}</div>
              <div class="mini__album">${esc(x.Album)}</div>
              <div class="mini__datos">${esc(x["Año de lanzamiento"] || "")} · ${esc(x.Estado || "")}</div>
              <div class="mini__precio">${plata(p)}</div>
              <button class="btn-agregar" data-agregar="${esc(clave)}" data-artista="${esc(x.Artista)}" data-album="${esc(x.Album)}" data-estado="${esc(x.Estado || "")}" data-precio="${p}">AGREGAR</button>
            </div></article>`;
        }).join("");
        pintar();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => { pintar(); destacados(); });
})();
