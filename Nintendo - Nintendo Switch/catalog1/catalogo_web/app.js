

let chunk = 0;
let loading = false;
let allGames = [];
let filterActive = false;

const grid = document.getElementById("grid");
const modal = document.getElementById("modal");
const searchInput = document.getElementById("searchInput");
const chipsBox = document.getElementById("genreChips");
let currentGenre = "";

/* =========================
   CARGA INDEX (TODOS LOS JUEGOS)
========================= */
const CHUNK_SIZE = 300;
let totalChunks = 5;
let loadGen = 0; // invalida cargas en curso cuando se reinicia la cuadrícula

const searchClear = document.getElementById("searchClear");
const resultCount = document.getElementById("resultCount");
const backTopBtn = document.getElementById("backTopBtn");

fetch("data/index.json")
  .then(res => res.json())
  .then(data => {
    allGames = data;
    totalChunks = Math.ceil(allGames.length / CHUNK_SIZE);
    updateCount(allGames.length);
    buildGenres();
  })
  .catch(() => {});

/* =========================
   TARJETA (compartida por scroll y buscador)
========================= */
function createCard(g) {
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <div class="img-box">
      <img src="${g.img_low}" loading="lazy" alt="">
    </div>
    <div class="title" title="${g.name}">${g.name}</div>
    <div class="size">${g.size} GB</div>
  `;

  card.onclick = () => openModal(g);
  return card;
}

function updateCount(n) {
  resultCount.textContent = n + (n === 1 ? " juego" : " juegos");
}

/* =========================
   CARGA CHUNKS (SCROLL)
========================= */
function loadChunk(i) {
  if (loading || i >= totalChunks) return;
  loading = true;
  const gen = loadGen;

  fetch(`data/chunks/page_${i}.json`)
    .then(res => res.json())
    .then(data => {
      if (gen !== loadGen || filterActive) return; // llegó tarde: ignorar
      const frag = document.createDocumentFragment();
      data.forEach(g => frag.appendChild(createCard(g)));
      grid.appendChild(frag);
    })
    .catch(() => {})
    .finally(() => loading = false);
}

/* =========================
   MODAL
========================= */
const genreES = {
  "action": "Acción", "adventure": "Aventura", "indie": "Indie", "rpg": "RPG",
  "strategy": "Estrategia", "casual": "Casual", "simulation": "Simulación",
  "platformer": "Plataformas", "puzzle": "Rompecabezas", "sports": "Deportes",
  "shooter": "Disparos", "arcade": "Arcade", "racing": "Carreras",
  "fighting": "Lucha", "family": "Familiar", "card": "Cartas",
  "board games": "Juegos de mesa", "massively multiplayer": "Multijugador masivo",
  "educational": "Educativo"
};

function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00Z");
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function setDetail(id, show) {
  document.getElementById(id).hidden = !show;
}

function openModal(g) {
  document.getElementById("modal-img").src = g.img_low;
  document.getElementById("modal-title").innerText = g.name;

  // Imagen grande (si no hay, se queda el fondo rojo)
  const banner = document.getElementById("modal-banner");
  const bg = document.getElementById("modal-background");
  bg.onerror = () => { bg.style.display = "none"; banner.classList.add("no-img"); };
  if (g.background_image) {
    bg.src = g.background_image;
    bg.style.display = "";
    banner.classList.remove("no-img");
  } else {
    bg.removeAttribute("src");
    bg.style.display = "none";
    banner.classList.add("no-img");
  }

  // Detalles: solo se muestran los que tienen dato
  const release = formatDate(g.release_date);
  document.getElementById("modal-release").innerText = release;
  setDetail("detail-release", !!release);

  document.getElementById("modal-size").innerText = g.size || "";
  setDetail("detail-size", !!g.size);

  const genres = (g.genres || []).map(x => genreES[x.toLowerCase()] || x).join(", ");
  document.getElementById("modal-genres").innerText = genres;
  setDetail("detail-genres", !!genres);

  // Descripción con "Leer más"
  const descCard = document.getElementById("modal-desc-card");
  const descEl = document.getElementById("modal-desc");
  descEl.innerText = (g.description || "").trim();
  descCard.hidden = !g.description;
  descCard.classList.remove("expanded");
  document.getElementById("expandDesc").innerText = "Leer más";

  // make modal visible
  modal.style.display = "flex";
  document.body.style.overflow = "hidden"; // no mover el fondo
  document.getElementById("modal-content").scrollTop = 0;

  // botón "atrás" del navegador/celular cierra la ficha (solo memoria, sin recargar)
  if (!modalInHistory) {
    history.pushState({ modal: true }, "");
    modalInHistory = true;
  }

  // si el texto es corto, no hace falta "Leer más"
  descCard.classList.toggle("short", descEl.scrollHeight <= descEl.clientHeight + 4);
}

document.getElementById("expandDesc").addEventListener("click", () => {
  const card = document.getElementById("modal-desc-card");
  const open = card.classList.toggle("expanded");
  document.getElementById("expandDesc").innerText = open ? "Leer menos" : "Leer más";
});

/* =========================
   CLOSE MODAL
========================= */
let modalInHistory = false;

// si se recargó con la ficha abierta, limpiar ese paso del historial
if (history.state && history.state.modal) history.replaceState(null, "");

function closeModal() {
  modal.style.display = "none";
  document.body.style.overflow = "";
  // cerrado con ✕ / clic fuera / Esc: quitar el paso que agregamos
  if (modalInHistory) {
    modalInHistory = false;
    history.back();
  }
}

// botón atrás: cerrar la ficha y quedarse en el catálogo
window.addEventListener("popstate", () => {
  if (modalInHistory) {
    modalInHistory = false;
    closeModal();
  }
});

document.getElementById("close-btn").onclick = closeModal;

modal.onclick = (e) => {
  if (e.target === modal) closeModal();
};

/* =========================
   SCROLL INFINITO + BOTÓN VOLVER ARRIBA
========================= */
window.addEventListener("scroll", () => {
  backTopBtn.classList.toggle("show", window.scrollY > 600);

  if (filterActive) return; // 🚫 NO cargar más si estás filtrando

  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
    if (!loading && chunk + 1 < totalChunks) {
      chunk++;
      loadChunk(chunk);
    }
  }
}, { passive: true });

function scrollToTop() {
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
}

backTopBtn.addEventListener("click", scrollToTop);

/* =========================
   BUSCADOR GLOBAL (INDEX.JSON)
========================= */
// quita acentos y signos: "pokémon" encuentra "Pokemon", "mario kart" encuentra "Mario Kart™"
function normalize(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/ +/g, " ").trim();
}

function filterGames(query = "", filter = "") {
  query = normalize(query);
  filter = filter.toLowerCase().trim();

  loadGen++;
  grid.innerHTML = "";

  // 👉 detectar si hay filtro activo
  filterActive = !!query || !!filter;

  if (!filterActive) {
    chunk = 0;
    loading = false;
    updateCount(allGames.length);
    loadChunk(0);
    return;
  }

  let results = allGames;

  if (query) {
    // todas las palabras deben aparecer, en cualquier orden
    const words = query.split(" ");
    results = results.filter(g => {
      const n = normalize(g.name);
      return words.every(w => n.includes(w));
    });
  }

  if (filter) {
    results = results.filter(g =>
      (g.genres || []).some(gen => gen.toLowerCase() === filter)
    );
  }

  updateCount(results.length);

  if (!results.length) {
    grid.innerHTML = `<div class="empty-state"><span class="joycons" aria-hidden="true"><i></i><i></i></span>No se encontraron juegos.<br>Prueba con otra palabra o género.</div>`;
    return;
  }

  const frag = document.createDocumentFragment();
  results.forEach(g => frag.appendChild(createCard(g)));
  grid.appendChild(frag);
}

/* =========================
   EVENTOS BUSCADOR
========================= */
let searchTimer;

function runSearch() {
  searchClear.classList.toggle("show", !!searchInput.value);
  filterGames(searchInput.value, currentGenre);
}

/* =========================
   GÉNEROS (pestañas)
========================= */
function setGenre(value) {
  currentGenre = value;
  let elegido = null;
  chipsBox.querySelectorAll(".chip").forEach(c => {
    const on = c.dataset.genre === value;
    c.classList.toggle("active", on);
    c.setAttribute("aria-pressed", on);
    if (on) elegido = c;
  });
  // deja la pestaña elegida a la vista (en el celular se desliza sola)
  if (elegido) chipsBox.scrollTo({ left: elegido.offsetLeft - chipsBox.clientWidth / 2 + elegido.offsetWidth / 2, behavior: "smooth" });
}

function makeChip(value, label, n) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip" + (value === currentGenre ? " active" : "");
  b.dataset.genre = value;
  b.setAttribute("aria-pressed", value === currentGenre);
  b.append(label);
  const sm = document.createElement("small");
  sm.textContent = n;
  b.append(sm);
  b.onclick = () => { setGenre(value); runSearch(); };
  return b;
}

/* flechas y rueda del mouse para las pestañas de género (PC) */
const chipsWrap = document.getElementById("chipsWrap");
function updateArrows() {
  chipsWrap.classList.toggle("can-prev", chipsBox.scrollLeft > 4);
  chipsWrap.classList.toggle("can-next", chipsBox.scrollLeft + chipsBox.clientWidth < chipsBox.scrollWidth - 4);
}
chipsWrap.querySelector(".prev").onclick = () => chipsBox.scrollBy({ left: -chipsBox.clientWidth * 0.7, behavior: "smooth" });
chipsWrap.querySelector(".next").onclick = () => chipsBox.scrollBy({ left: chipsBox.clientWidth * 0.7, behavior: "smooth" });
chipsBox.addEventListener("scroll", updateArrows, { passive: true });
window.addEventListener("resize", updateArrows);
// la rueda del mouse (arriba/abajo) desliza las pestañas de lado
chipsBox.addEventListener("wheel", (e) => {
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && chipsBox.scrollWidth > chipsBox.clientWidth) {
    e.preventDefault();
    chipsBox.scrollLeft += e.deltaY;
  }
}, { passive: false });

function buildGenres() {
  const count = {};
  allGames.forEach(g => (g.genres || []).forEach(x => {
    const k = x.toLowerCase().trim();
    if (k) count[k] = (count[k] || 0) + 1;
  }));
  const nombre = k => genreES[k] || k.charAt(0).toUpperCase() + k.slice(1);

  chipsBox.innerHTML = "";
  chipsBox.appendChild(makeChip("", "Todos", allGames.length));
  // los géneros con más juegos primero
  Object.keys(count)
    .sort((a, b) => count[b] - count[a] || nombre(a).localeCompare(nombre(b), "es"))
    .forEach(k => chipsBox.appendChild(makeChip(k, nombre(k), count[k])));
  updateArrows();
}

searchInput.addEventListener("input", () => {
  searchClear.classList.toggle("show", !!searchInput.value);
  clearTimeout(searchTimer);
  searchTimer = setTimeout(runSearch, 180); // espera a que termines de escribir
});


searchClear.addEventListener("click", () => {
  searchInput.value = "";
  runSearch();
  searchInput.focus();
});

/* Teclado: "/" para buscar · Esc cierra ventana o borra búsqueda */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (modal.style.display === "flex") { closeModal(); return; }
    if (document.activeElement === searchInput && searchInput.value) {
      searchInput.value = "";
      runSearch();
    }
  } else if (e.key === "/" && document.activeElement !== searchInput) {
    e.preventDefault();
    scrollToTop();
    searchInput.focus();
  }
});

loadChunk(0);

