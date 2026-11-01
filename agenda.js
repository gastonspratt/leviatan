/*
 * Agenda editable de Leviatán.
 * Para actualizarla, agregá, quitá o modificá eventos en este arreglo.
 * Formato de fecha: AAAA-MM-DD. Los géneros disponibles para filtrar son:
 * power, heavy, thrash, extremo, progresivo, sinfonico y hardrock.
 */

const agendaEvents = [
  {
    date: "2026-11-03", artist: "Opeth", venue: "Teatro Gran Rivadavia", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["progresivo", "extremo"], genreLabels: ["Metal progresivo", "Death metal"],
    time: "21:00 hs", link: "https://www.granrivadavia.com.ar/cartelera/"
  },
  {
    date: "2026-11-05", artist: "Def Leppard + Extreme", venue: "Movistar Arena", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["hardrock", "heavy"], genreLabels: ["Hard rock", "Heavy clásico"],
    time: "Horario a confirmar", link: "https://inprotur-prod.turismo.gob.ar/novedades/shows-internacionales-en-argentina-en-2026"
  },
  {
    date: "2026-11-06", artist: "Violent Execution · 15 años de Thrashectoria", venue: "Uniclub", city: "Buenos Aires · CABA",
    type: "nacional", genres: ["thrash"], genreLabels: ["Thrash metal", "Escena nacional"],
    time: "23:00 hs", link: "https://tramasonora.com/agenda/metal"
  },
  {
    date: "2026-11-13", artist: "Zamarbide · Cumbre del Metal 41", venue: "Auditorio Oeste", city: "Haedo · Buenos Aires",
    type: "nacional", genres: ["heavy"], genreLabels: ["Heavy metal", "Escena nacional"],
    time: "19:00 hs", link: "https://tramasonora.com/agenda/metal"
  },
  {
    date: "2026-11-20", artist: "Rata Blanca", venue: "Tribus Club de Arte", city: "Santa Fe · Santa Fe",
    type: "nacional", genres: ["heavy", "power"], genreLabels: ["Heavy metal", "Power metal"],
    time: "Horario a confirmar", link: "https://www.quehacemos.com.ar/eventos/rata-blanca-27908"
  },
  {
    date: "2026-11-21", artist: "Rata Blanca", venue: "Teatro San Carlos", city: "Junín · Buenos Aires",
    type: "nacional", genres: ["heavy", "power"], genreLabels: ["Heavy metal", "Power metal"],
    time: "21:30 hs", link: "https://tramasonora.com/agenda/metal"
  },
  {
    date: "2026-11-27", artist: "Rata Blanca", venue: "Casino Magic", city: "Neuquén · Neuquén",
    type: "nacional", genres: ["heavy", "power"], genreLabels: ["Heavy metal", "Power metal"],
    time: "21:00 hs", link: "https://tramasonora.com/agenda/metal"
  },
  {
    date: "2026-12-01", artist: "Testament + Municipal Waste + Immolation", venue: "Teatro Flores", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["thrash", "extremo"], genreLabels: ["Thrash metal", "Crossover", "Death metal"],
    time: "18:00 hs", link: "https://pogo.ar/?genero=metal"
  },
  {
    date: "2026-12-01", artist: "BABYMETAL", venue: "Movistar Arena", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["heavy"], genreLabels: ["Kawaii metal", "Metal japonés"],
    time: "21:00 hs", link: "https://mail.vickyzapata.com.ar/comunicados/babymetal-prepara-su-llegada-al-movistar-arena-en-el-marco-de-su-babymetal-world-tour"
  },
  {
    date: "2026-12-01", artist: "Tarja", venue: "Teatro Coliseo", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["sinfonico", "power"], genreLabels: ["Metal sinfónico", "Power metal"],
    time: "21:00 hs", link: "https://www.metalargentumradio.com.ar/agenda/"
  },
  {
    date: "2026-12-04", artist: "O’Connor + DarloTodo", venue: "Club Paraguay", city: "Córdoba · Córdoba",
    type: "nacional", genres: ["heavy"], genreLabels: ["Heavy metal argentino", "Rock pesado"],
    time: "19:00 hs", link: "https://www.edenentradas.com/event/oconnor--darlotodo-041226"
  },
  {
    date: "2026-12-05", artist: "O’Connor + DarloTodo", venue: "Centro Cultural Güemes", city: "Rosario · Santa Fe",
    type: "nacional", genres: ["heavy"], genreLabels: ["Heavy metal argentino", "Rock pesado"],
    time: "20:00 hs", link: "https://indiehoy.com/agenda/oconnor-en-rosario/"
  },
  {
    date: "2026-12-05", artist: "Rata Blanca", venue: "Movistar Arena", city: "Buenos Aires · CABA",
    type: "nacional", genres: ["heavy", "power"], genreLabels: ["Heavy metal", "Power metal"],
    time: "21:00 hs", link: "https://pogo.ar/?genero=metal"
  },
  {
    date: "2026-12-10", artist: "Deep Purple", venue: "Movistar Arena", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["hardrock", "heavy"], genreLabels: ["Hard rock", "Heavy clásico"],
    time: "Horario a confirmar", link: "https://argentina.travel/novedades/shows-internacionales-en-argentina-en-2026"
  },
  {
    date: "2026-12-14", artist: "Slayer", venue: "Movistar Arena", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["thrash"], genreLabels: ["Thrash metal", "Metal extremo"],
    time: "21:00 hs", link: "https://www.elcarporock.com/p/recitales-internacionales-en-argentina.html"
  },
  {
    date: "2027-01-13", artist: "Avatar", venue: "Teatro Flores", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["heavy", "extremo"], genreLabels: ["Metal", "Metal alternativo"],
    time: "19:00 hs", link: "https://metaldazeweb.com/agenda/"
  },
  {
    date: "2027-01-14", artist: "Geoff Tate · Operation: Mindcrime", venue: "Teatro Vorterix", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["heavy", "progresivo"], genreLabels: ["Heavy metal", "Metal progresivo"],
    time: "Horario a confirmar", link: "https://www.elcarporock.com/p/recitales-internacionales-en-argentina.html"
  },
  {
    date: "2027-01-15", artist: "Rush", venue: "Movistar Arena", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["progresivo", "hardrock"], genreLabels: ["Rock progresivo", "Hard rock"],
    time: "21:00 hs", link: "https://www.rush.com/show/fifty-something-2027-01-15/"
  },
  {
    date: "2027-01-19", artist: "Hellripper", venue: "Uniclub", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["thrash", "extremo"], genreLabels: ["Black / thrash", "Metal extremo"],
    time: "19:00 hs", link: "https://pogo.ar/?genero=metal"
  },
  {
    date: "2027-02-05", artist: "Mortification", venue: "Uniclub", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["extremo"], genreLabels: ["Death metal"],
    time: "Horario a confirmar", link: "https://pogo.ar/?genero=metal"
  },
  {
    date: "2027-02-10", artist: "Hirax", venue: "Uniclub", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["thrash"], genreLabels: ["Thrash metal"],
    time: "Horario a confirmar", link: "https://pogo.ar/?genero=metal"
  },
  {
    date: "2027-02-17", artist: "Alcest", venue: "Uniclub", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["progresivo", "extremo"], genreLabels: ["Post-metal", "Blackgaze"],
    time: "Horario a confirmar", link: "https://pogo.ar/?genero=metal"
  },
  {
    date: "2027-02-25", artist: "Foo Fighters", venue: "Estadio River Plate", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["hardrock"], genreLabels: ["Rock alternativo", "Hard rock"],
    time: "21:00 hs", link: "https://www.livenation.lat/event/foo-fighters-take-cover-tour-2027-buenos-aires-tickets-edp1690280"
  },
  {
    date: "2027-02-28", artist: "Overkill", venue: "El Teatrito", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["thrash"], genreLabels: ["Thrash metal"],
    time: "18:00 hs", link: "https://pogo.ar/?genero=metal"
  },
  {
    date: "2027-03-07", artist: "Epica + Rhapsody", venue: "Estadio Malvinas Argentinas", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["power", "sinfonico"], genreLabels: ["Power metal", "Metal sinfónico"],
    time: "19:00 hs", link: "https://www.passline.com/eventos/epica-25-years-celebration-rhapsody-the-last-shows"
  },
  {
    date: "2027-04-19", artist: "HammerFall", venue: "Teatro Flores", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["power", "heavy"], genreLabels: ["Power metal", "Heavy metal"],
    time: "18:00 hs", link: "https://www.passline.com/eventos/hammerfall-glory-to-the-brave-hymns-latin-america-2027"
  },
  {
    date: "2027-04-22", artist: "Quiet Riot", venue: "Teatro Flores", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["hardrock", "heavy"], genreLabels: ["Hard rock", "Heavy clásico"],
    time: "Horario a confirmar", link: "https://www.metalargentumradio.com.ar/agenda/"
  },
  {
    date: "2027-04-26", artist: "KK’s Priest", venue: "Teatro Flores", city: "Buenos Aires · CABA",
    type: "internacional", genres: ["heavy"], genreLabels: ["Heavy metal tradicional"],
    time: "Horario a confirmar", link: "https://www.metalargentumradio.com.ar/agenda/"
  }
];

const agendaGrid = document.getElementById("agenda-events");
const nextEventBox = document.getElementById("next-event");
const agendaCount = document.getElementById("agenda-count");
const agendaSearch = document.getElementById("agenda-search");
const emptyState = document.getElementById("agenda-empty");
const filterButtons = [...document.querySelectorAll(".agenda-filter")];
let activeFilter = "todos";

const monthNames = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

function parseLocalDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function formatLongDate(isoDate) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  }).format(parseLocalDate(isoDate));
}

function getVisibleEvents() {
  const query = agendaSearch.value.trim().toLocaleLowerCase("es-AR");
  return agendaEvents
    .filter(event => activeFilter === "todos" || event.type === activeFilter || event.genres.includes(activeFilter))
    .filter(event => {
      if (!query) return true;
      const text = [event.artist, event.venue, event.city, ...event.genreLabels].join(" ").toLocaleLowerCase("es-AR");
      return text.includes(query);
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.artist.localeCompare(b.artist, "es"));
}

function renderNextEvent() {
  const first = [...agendaEvents].sort((a, b) => a.date.localeCompare(b.date))[0];
  if (!first) return;
  const date = parseLocalDate(first.date);
  const day = String(date.getDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat("es-AR", { month: "long" }).format(date);
  nextEventBox.innerHTML = `
    <div class="agenda-next__date"><strong>${day}</strong><span>${escapeHTML(month)}</span></div>
    <div class="agenda-next__info">
      <small>${first.type === "nacional" ? "Escena nacional" : "En vivo en Argentina"} · ${escapeHTML(first.genreLabels[0])}</small>
      <h3>${escapeHTML(first.artist)}</h3>
      <p>${escapeHTML(formatLongDate(first.date))} · ${escapeHTML(first.venue)} · ${escapeHTML(first.city)}</p>
    </div>
    <a class="agenda-next__action" href="${escapeHTML(first.link)}" target="_blank" rel="noopener noreferrer">MÁS INFO <span aria-hidden="true">↗</span></a>
  `;
}

function renderEvents() {
  const events = getVisibleEvents();
  agendaCount.textContent = `${events.length} ${events.length === 1 ? "fecha encontrada" : "fechas encontradas"}`;
  emptyState.hidden = events.length !== 0;
  agendaGrid.hidden = events.length === 0;

  agendaGrid.innerHTML = events.map(event => {
    const date = parseLocalDate(event.date);
    const day = String(date.getDate()).padStart(2, "0");
    const month = monthNames[date.getMonth()];
    const typeLabel = event.type === "nacional" ? "Nacional" : "Internacional";
    const typeClass = event.type === "nacional" ? "agenda-card__type--nacional" : "";
    const tags = event.genreLabels.map(label => `<span class="agenda-tag">${escapeHTML(label)}</span>`).join("");
    return `
      <article class="agenda-card">
        <div class="agenda-card__top">
          <div class="agenda-card__date"><strong class="agenda-card__day">${day}</strong><span class="agenda-card__month">${month} ${date.getFullYear()}</span></div>
          <span class="agenda-card__type ${typeClass}">${typeLabel}</span>
        </div>
        <div class="agenda-card__rule"></div>
        <h3>${escapeHTML(event.artist)}</h3>
        <p class="agenda-card__venue">${escapeHTML(event.venue)}<br>${escapeHTML(event.city)}</p>
        <div class="agenda-card__genres">${tags}</div>
        <div class="agenda-card__bottom">
          <span class="agenda-card__time">${escapeHTML(event.time)}</span>
          <a class="agenda-ticket" href="${escapeHTML(event.link)}" target="_blank" rel="noopener noreferrer">INFO / TICKETS ↗</a>
        </div>
      </article>
    `;
  }).join("");
}

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach(item => {
      const selected = item === button;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    renderEvents();
  });
});

agendaSearch.addEventListener("input", renderEvents);
document.getElementById("agenda-reset").addEventListener("click", () => {
  activeFilter = "todos";
  agendaSearch.value = "";
  filterButtons.forEach(button => {
    const selected = button.dataset.filter === "todos";
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  renderEvents();
});

renderNextEvent();
renderEvents();
