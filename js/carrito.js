/* CARRITO DE PEDIDO — Leviatán
   Comanda persistente, panel lateral y envío por WhatsApp. */
(() => {
  const NUMERO = "5493584283858";
  const CLAVE = "leviatan_pedido_v1";
  const SHEET_CD = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=0&single=true&output=csv";

  let pedido = [];
  try { pedido = JSON.parse(localStorage.getItem(CLAVE) || "[]"); } catch { pedido = []; }

  const guardar = () => localStorage.setItem(CLAVE, JSON.stringify(pedido));
  const plata = n => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(n) || 0);
  const esc = t => String(t ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  function precioNum(v) {
    let t = String(v ?? "").trim().replace(/[^0-9,.-]/g, "");
    if (!t) return null;
    const coma = t.lastIndexOf(","), punto = t.lastIndexOf(".");
    if (coma !== -1 && punto !== -1) {
      if (coma > punto) t = t.replace(/\./g, "").replace(",", ".");
      else t = t.replace(/,/g, "");
    } else if (coma !== -1 || punto !== -1) {
      const sep = coma !== -1 ? "," : ".", partes = t.split(sep);
      t = partes.length === 2 && partes[1].length === 3 ? partes.join("") : t.replace(sep, ".");
    }
    const n = Number(t);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  const claveDe = (artista, album) => (artista + "___" + album).toLowerCase().trim();
  const normalizarEstado = estado => String(estado ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  const disponible = estado => normalizarEstado(estado) === "en stock";

  function armarMensaje() {
    const total = pedido.reduce((a, p) => a + (Number(p.precio) || 0), 0);
    return "Hola, quiero reservar este pedido de Leviatán:\n\n"
      + pedido.map((p, i) => `${i + 1}. ${p.artista} — ${p.album}${p.estado ? " (" + p.estado + ")" : ""} — ${plata(p.precio)}`).join("\n")
      + `\n\nTotal: ${plata(total)}\n\n¿Está disponible?`;
  }

  function inyectarInterfaz() {
    if (document.getElementById("leviatan-cart-dock")) return;
    const style = document.createElement("style");
    style.id = "leviatan-cart-styles";
    style.textContent = `
      #leviatan-cart-dock{position:fixed;right:24px;bottom:22px;z-index:9990}
      #leviatan-cart-open{display:flex;align-items:center;gap:12px;padding:13px 17px;border:1px solid #8b7650;background:#171612;color:#e8dfca;font:10px 'DM Mono',monospace;letter-spacing:.09em;text-transform:uppercase;box-shadow:0 8px 28px #0009;cursor:pointer}
      #leviatan-cart-open:hover{border-color:#b64e36;background:#211612}
      #leviatan-cart-count{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 5px;border-radius:50%;background:#8f3929;color:#fff;font-weight:bold}
      #leviatan-cart-toast{position:fixed;right:24px;bottom:82px;z-index:9992;max-width:min(360px,calc(100vw - 32px));padding:13px 17px;border:1px solid #796747;background:#171612;color:#e8dfca;font:11px 'DM Mono',monospace;letter-spacing:.04em;box-shadow:0 8px 28px #0009;opacity:0;transform:translateY(8px);pointer-events:none;transition:.22s}
      #leviatan-cart-toast.visible{opacity:1;transform:translateY(0)}
      #leviatan-cart-shade{position:fixed;inset:0;z-index:9995;background:#000a;opacity:0;pointer-events:none;transition:opacity .25s}
      #leviatan-cart-shade.open{opacity:1;pointer-events:auto}
      #leviatan-cart-drawer{position:fixed;z-index:9996;top:0;right:0;width:min(440px,100vw);height:100dvh;padding:26px 24px 22px;background:#101110;color:#e8dfca;border-left:1px solid #62553e;box-shadow:-18px 0 50px #0009;transform:translateX(105%);transition:transform .28s ease;display:flex;flex-direction:column}
      #leviatan-cart-drawer.open{transform:translateX(0)}
      #leviatan-cart-drawer .ld-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:18px;border-bottom:1px solid #39352c}
      #leviatan-cart-drawer h2{margin:0;color:#e8dfca;font:800 30px/.95 'Barlow Condensed',sans-serif;letter-spacing:.04em}
      #leviatan-cart-close{border:1px solid #62553e;background:transparent;color:#e8dfca;padding:8px 11px;font:12px 'DM Mono',monospace;cursor:pointer}
      #leviatan-cart-drawer .ld-kicker{margin:17px 0;color:#b7a98b;font:9px 'DM Mono',monospace;letter-spacing:.12em}
      #leviatan-cart-items{overflow:auto;flex:1;min-height:80px}
      #leviatan-cart-items .ld-empty{padding:25px 0;color:#a9a18f;font:12px 'Manrope',sans-serif;line-height:1.7}
      #leviatan-cart-items .ld-line{display:grid;grid-template-columns:1fr auto;gap:8px 12px;padding:14px 0;border-bottom:1px solid #39352c}
      #leviatan-cart-items .ld-name{color:#e8dfca;font:600 12px/1.5 'Manrope',sans-serif}
      #leviatan-cart-items .ld-price{color:#c5b58f;font:700 14px 'Barlow Condensed',sans-serif;white-space:nowrap}
      #leviatan-cart-items .ld-remove{grid-column:1/-1;justify-self:start;border:0;background:transparent;color:#b66b54;padding:3px 0;font:9px 'DM Mono',monospace;cursor:pointer}
      #leviatan-cart-drawer .ld-bottom{padding-top:16px;border-top:1px solid #62553e}
      #leviatan-cart-drawer .ld-total{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;color:#a9a18f;font:9px 'DM Mono',monospace;letter-spacing:.08em}
      #leviatan-cart-drawer .ld-total strong{color:#e8dfca;font:700 24px 'Barlow Condensed',sans-serif}
      #leviatan-cart-send{display:block;width:100%;padding:15px 12px;border:1px solid #8b7650;background:#8f3929;color:#fff;text-align:center;text-decoration:none;font:10px 'DM Mono',monospace;letter-spacing:.08em}
      #leviatan-cart-send.disabled{opacity:.4;pointer-events:none}
      #leviatan-cart-clear{display:block;margin:12px auto 0;border:0;background:transparent;color:#9d9380;font:9px 'DM Mono',monospace;cursor:pointer}
      @media(max-width:600px){#leviatan-cart-dock{right:12px;bottom:12px}#leviatan-cart-open{padding:12px 13px}#leviatan-cart-toast{right:12px;bottom:70px}#leviatan-cart-drawer{padding:22px 18px 18px}}
    `;
    document.head.appendChild(style);
    document.body.insertAdjacentHTML("beforeend", `
      <div id="leviatan-cart-dock"><button id="leviatan-cart-open" type="button">MI PEDIDO <span id="leviatan-cart-count">0</span></button></div>
      <div id="leviatan-cart-toast" role="status" aria-live="polite">Disco agregado a tu pedido.</div>
      <div id="leviatan-cart-shade"></div>
      <aside id="leviatan-cart-drawer" role="dialog" aria-modal="true" aria-labelledby="leviatan-cart-title">
        <div class="ld-head"><h2 id="leviatan-cart-title">TU PEDIDO</h2><button id="leviatan-cart-close" type="button" aria-label="Cerrar pedido">CERRAR ×</button></div>
        <div class="ld-kicker" id="leviatan-cart-subtitle">0 ÍTEMS EN COMANDA</div>
        <div id="leviatan-cart-items"></div>
        <div class="ld-bottom"><div class="ld-total"><span>TOTAL DEL PEDIDO</span><strong id="leviatan-cart-total">$ 0</strong></div><a id="leviatan-cart-send" class="disabled" href="#" target="_blank" rel="noopener">ENVIAR POR WHATSAPP ↗</a><button id="leviatan-cart-clear" type="button">VACIAR PEDIDO</button></div>
      </aside>
    `);

    document.getElementById("leviatan-cart-open").addEventListener("click", abrirPanel);
    document.getElementById("leviatan-cart-close").addEventListener("click", cerrarPanel);
    document.getElementById("leviatan-cart-shade").addEventListener("click", cerrarPanel);
    document.getElementById("leviatan-cart-clear").addEventListener("click", () => {
      pedido = []; guardar(); pintar();
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarPanel(); });

    // Los accesos "Mi pedido" del header abren el panel, sin navegar al index.
    document.querySelectorAll('a[href="#comanda"], a[href$="index.html#comanda"]').forEach(a => {
      a.addEventListener("click", e => { e.preventDefault(); abrirPanel(); });
    });
  }

  function abrirPanel() {
    document.getElementById("leviatan-cart-shade")?.classList.add("open");
    document.getElementById("leviatan-cart-drawer")?.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function cerrarPanel() {
    document.getElementById("leviatan-cart-shade")?.classList.remove("open");
    document.getElementById("leviatan-cart-drawer")?.classList.remove("open");
    document.body.style.overflow = "";
  }

  let toastTimer;
  function notificar() {
    const toast = document.getElementById("leviatan-cart-toast");
    if (!toast) return;
    toast.textContent = "Disco agregado a tu pedido.";
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
  }

  function pintar() {
    const caja = document.getElementById("comanda-lineas");
    const cuenta = document.getElementById("comanda-cuenta");
    const totalEl = document.getElementById("comanda-total");
    const enviar = document.getElementById("comanda-enviar");
    const badge = document.getElementById("carrito-badge");
    const total = pedido.reduce((a, p) => a + (Number(p.precio) || 0), 0);

    if (caja) {
      caja.innerHTML = pedido.length ? pedido.map(p =>
        `<div class="comanda__linea"><span><strong>${esc(p.artista)}</strong> — ${esc(p.album)}</span><span class="monto">${plata(p.precio)}</span><button class="comanda__quitar" data-quitar="${esc(p.clave)}" aria-label="Quitar ${esc(p.artista)}">✕</button></div>`
      ).join("") : '<div class="comanda__vacia">Todavía no agregaste nada.</div>';
    }
    if (badge) {
      badge.classList.toggle("visible", pedido.length > 0);
      const n = badge.querySelector("b"); if (n) n.textContent = pedido.length;
    }
    if (cuenta) cuenta.textContent = pedido.length + (pedido.length === 1 ? " ÍTEM" : " ÍTEMS");
    if (totalEl) totalEl.textContent = plata(total);

    if (enviar) {
      if (!pedido.length) { enviar.classList.add("off"); enviar.removeAttribute("href"); }
      else { enviar.classList.remove("off"); enviar.href = "https://wa.me/" + NUMERO + "?text=" + encodeURIComponent(armarMensaje()); }
    }

    const count = document.getElementById("leviatan-cart-count");
    const subtitle = document.getElementById("leviatan-cart-subtitle");
    const items = document.getElementById("leviatan-cart-items");
    const drawerTotal = document.getElementById("leviatan-cart-total");
    const send = document.getElementById("leviatan-cart-send");
    if (count) count.textContent = pedido.length;
    if (subtitle) subtitle.textContent = `${pedido.length} ${pedido.length === 1 ? "ÍTEM" : "ÍTEMS"} EN COMANDA`;
    if (items) items.innerHTML = pedido.length ? pedido.map(p =>
      `<div class="ld-line"><div class="ld-name">${esc(p.artista)}<br>${esc(p.album)}</div><div class="ld-price">${plata(p.precio)}</div><button class="ld-remove" type="button" data-quitar="${esc(p.clave)}">QUITAR DE LA COMANDA ×</button></div>`
    ).join("") : '<div class="ld-empty">Todavía no agregaste discos.<br>Explorá la batea y sumá los que quieras consultar.</div>';
    if (drawerTotal) drawerTotal.textContent = plata(total);
    if (send) {
      send.classList.toggle("disabled", !pedido.length);
      send.href = pedido.length ? "https://wa.me/" + NUMERO + "?text=" + encodeURIComponent(armarMensaje()) : "#";
    }

    document.querySelectorAll("[data-agregar]").forEach(b => {
      const dentro = pedido.some(p => p.clave === b.dataset.agregar);
      const agotado = !disponible(b.dataset.estado);
      b.disabled = dentro || agotado;
      b.textContent = dentro ? "EN LA COMANDA" : agotado ? "AGOTADO" : b.classList.contains("btn-agregar-catalogo") ? "AGREGAR A LA COMANDA" : "AGREGAR";
    });
  }

  document.addEventListener("click", e => {
    const add = e.target.closest("[data-agregar]");
    if (add) {
      if (!disponible(add.dataset.estado)) return;
      const yaEstaba = pedido.some(p => p.clave === add.dataset.agregar);
      if (!yaEstaba) {
        pedido.push({
          clave: add.dataset.agregar,
          artista: add.dataset.artista || "",
          album: add.dataset.album || "",
          estado: add.dataset.estado || "",
          precio: Number(add.dataset.precio) || 0
        });
        guardar(); pintar(); notificar();
      } else {
        abrirPanel();
      }
    }
    const quitarBtn = e.target.closest("[data-quitar]");
    if (quitarBtn) { quitar(quitarBtn.dataset.quitar); }
  });

  function quitar(clave) {
    pedido = pedido.filter(p => p.clave !== clave);
    guardar(); pintar();
  }

  document.getElementById("comanda-vaciar")?.addEventListener("click", () => {
    pedido = []; guardar(); pintar();
  });

  async function destacados() {
    const caja = document.getElementById("destacados");
    if (!caja || !window.Papa) return;
    Papa.parse(SHEET_CD, {
      download: true, header: true, skipEmptyLines: true,
      complete: r => {
        const items = (r.data || []).filter(x =>
          (x.Artista || "").trim() && (x.Album || "").trim() &&
          precioNum(x.Precio) && disponible(x.Estado)
        );
        caja.innerHTML = items.slice(0, 8).map(x => {
          const p = precioNum(x.Precio), clave = claveDe(x.Artista, x.Album);
          const img = /^https?:\/\//i.test(x.Imagen || "") ? x.Imagen : "img/sin-portada.png";
          return `<article class="mini"><img class="mini__img" src="${esc(img)}" alt="${esc(x.Artista)} - ${esc(x.Album)}" loading="lazy" onerror="this.src='img/sin-portada.png'"><div class="mini__cuerpo"><div class="mini__artista">${esc(x.Artista)}</div><div class="mini__album">${esc(x.Album)}</div><div class="mini__datos">${esc(x["Año de lanzamiento"] || "")} · ${esc(x.Estado || "")}</div><div class="mini__precio">${plata(p)}</div><button class="btn-agregar" data-agregar="${esc(clave)}" data-artista="${esc(x.Artista)}" data-album="${esc(x.Album)}" data-estado="${esc(x.Estado || "")}" data-precio="${p}">AGREGAR</button></div></article>`;
        }).join("");
        pintar();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    inyectarInterfaz();
    pintar();
    destacados();
  });
})();
