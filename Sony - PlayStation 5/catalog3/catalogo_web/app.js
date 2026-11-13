
const IMG_DIR = "assets/images/";
const PAGE = 60;

const grid = document.getElementById("grid");
const sentinel = document.getElementById("sentinel");
const emptyMsg = document.getElementById("empty");
const emptyText = document.getElementById("emptyText");
const modal = document.getElementById("modal");
const searchInput = document.getElementById("searchInput");
const searchClear = document.getElementById("searchClear");
const chipsBox = document.getElementById("genreChips");
const resultCount = document.getElementById("resultCount");
const backTopBtn = document.getElementById("backTopBtn");

let allGames = [];
let list = [];
let shown = 0;
let detailSize = 50;
let currentId = null;
let currentGenre = "";
const detailCache = {};

const genreES = {
  "action": "Acción", "adventure": "Aventura", "indie": "Indie", "rpg": "RPG",
  "strategy": "Estrategia", "casual": "Casual", "simulation": "Simulación",
  "platformer": "Plataformas", "puzzle": "Rompecabezas", "sports": "Deportes",
  "shooter": "Disparos", "arcade": "Arcade", "racing": "Carreras",
  "fighting": "Lucha", "family": "Familiar", "card": "Cartas",
  "board games": "Juegos de mesa", "massively multiplayer": "Multijugador masivo",
  "educational": "Educativo"
};

function genreName(x) {
  return genreES[(x || "").toLowerCase()] || x;
}

/* busca sin importar mayúsculas, acentos ni signos: "pokemon" encuentra "Pokémon" */
function norm(s) {
  return (s || "").toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/ +/g, " ")
    .trim();
}

function imgUrl(g) {
  return IMG_DIR + encodeURIComponent(g.img);
}

function updateCount(n) {
  if (!resultCount) return;
  resultCount.textContent = n + (n === 1 ? " juego" : " juegos");
}

/* =========================
   TARJETAS
========================= */
function makeCard(g) {
  const card = document.createElement("div");
  card.className = "card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", g.name);

  const box = document.createElement("div");
  box.className = "img-box";
  const img = document.createElement("img");
  img.loading = "lazy";      // solo descarga las portadas que se ven
  img.decoding = "async";
  img.alt = "";
  img.src = imgUrl(g);
  box.appendChild(img);

  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("div");
  title.className = "title";
  title.textContent = g.name;
  title.title = g.name;

  const size = document.createElement("span");
  size.className = "size";
  size.textContent = g.size + " GB";

  body.append(title, size);
  card.append(box, body);
  card.onclick = () => openModal(g);
  card.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(g); } };
  return card;
}

function renderMore() {
  const frag = document.createDocumentFragment();
  list.slice(shown, shown + PAGE).forEach(g => frag.appendChild(makeCard(g)));
  shown += PAGE;
  grid.appendChild(frag);
}

/* agrega tarjetas mientras el final de la lista esté cerca de la pantalla */
function fill() {
  ticking = false;
  backTopBtn.classList.toggle("show", window.scrollY > 600);
  while (shown < list.length && sentinel.getBoundingClientRect().top < window.innerHeight + 800) {
    renderMore();
  }
}

let ticking = false;
function requestFill() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(fill);
  }
}
window.addEventListener("scroll", requestFill, { passive: true });
window.addEventListener("resize", requestFill);

function scrollToTop() {
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
}

backTopBtn.addEventListener("click", scrollToTop);

/* =========================
   BUSCADOR + GÉNEROS
========================= */
function applyFilter() {
  const q = norm(searchInput.value);
  const words = q ? q.split(" ") : [];

  // todas las palabras deben aparecer, en cualquier orden
  list = allGames.filter(g =>
    words.every(w => g.key.includes(w)) &&
    (!currentGenre || (g.genres || []).includes(currentGenre))
  );

  searchClear.classList.toggle("show", !!searchInput.value);
  updateCount(list.length);

  grid.innerHTML = "";
  shown = 0;
  emptyMsg.style.display = list.length ? "none" : "block";
  window.scrollTo(0, 0);
  fill();
}

let searchTimer;
searchInput.addEventListener("input", () => {
  searchClear.classList.toggle("show", !!searchInput.value);
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilter, 200);  // espera a que termines de escribir
});

searchClear.addEventListener("click", (e) => {
  e.preventDefault();
  searchInput.value = "";
  applyFilter();
  searchInput.focus();
});

function makeChip(value, label, n) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip" + (value === currentGenre ? " active" : "");
  b.dataset.genre = value;
  b.setAttribute("aria-pressed", value === currentGenre);
  b.append(label);
  if (n != null) {
    const s = document.createElement("small");
    s.textContent = n;
    b.append(s);
  }
  b.onclick = () => {
    currentGenre = value;
    chipsBox.querySelectorAll(".chip").forEach(c => {
      const on = c.dataset.genre === value;
      c.classList.toggle("active", on);
      c.setAttribute("aria-pressed", on);
    });
    // deja la pestaña elegida a la vista (en el celular se desliza sola)
    chipsBox.scrollTo({ left: b.offsetLeft - chipsBox.clientWidth / 2 + b.offsetWidth / 2, behavior: "smooth" });
    applyFilter();
  };
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
  allGames.forEach(g => (g.genres || []).forEach(x => count[x] = (count[x] || 0) + 1));

  chipsBox.appendChild(makeChip("", "Todos", allGames.length));
  // los géneros con más juegos primero
  Object.keys(count)
    .sort((a, b) => count[b] - count[a] || genreName(a).localeCompare(genreName(b), "es"))
    .forEach(x => chipsBox.appendChild(makeChip(x, genreName(x), count[x])));
  updateArrows();
}

/* =========================
   MODAL (los detalles se bajan solo al abrir el juego)
========================= */
function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00Z");
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function loadDetails(id) {
  const n = Math.floor(id / detailSize);
  if (!detailCache[n]) {
    detailCache[n] = fetch(`data/details/page_${n}.json`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .catch(() => { delete detailCache[n]; return null; });
  }
  return detailCache[n];
}

const banner = document.getElementById("modal-banner");
const bg = document.getElementById("modal-background");
const descCard = document.getElementById("modal-desc-card");
const descEl = document.getElementById("modal-desc");
const expandBtn = document.getElementById("expandDesc");

bg.onload = () => bg.classList.add("loaded");
bg.onerror = () => { bg.removeAttribute("src"); banner.classList.add("no-img"); };

function show(id, on) {
  document.getElementById(id).hidden = !on;
}

let modalInHistory = false;
let lastFocus = null;
// si se recargó con la ficha abierta, limpiar ese paso del historial
if (history.state && history.state.modal) history.replaceState(null, "");

function openModal(g) {
  currentId = g.id;
  lastFocus = document.activeElement;

  // lo que ya tenemos: se ve al instante
  document.getElementById("modal-img").src = imgUrl(g);
  document.getElementById("modal-title").textContent = g.name;

  document.getElementById("modal-size").textContent = g.size || "";
  show("detail-size", !!g.size);

  const genres = (g.genres || []).map(genreName).join(", ");
  document.getElementById("modal-genres").textContent = genres;
  show("detail-genres", !!genres);

  show("detail-release", false);
  show("detail-publisher", false);
  bg.classList.remove("loaded");
  bg.removeAttribute("src");
  banner.classList.remove("no-img");

  descCard.hidden = false;
  descCard.classList.remove("expanded");
  descCard.classList.add("short");
  descEl.textContent = "Cargando…";
  expandBtn.textContent = "Leer más";

  modal.style.display = "flex";
  document.body.style.overflow = "hidden";   // no mover el fondo
  document.body.classList.add("modal-open");
  document.getElementById("modal-content").scrollTop = 0;
  document.getElementById("close-btn").focus({ preventScroll: true });

  // botón "atrás" del navegador/celular cierra la ficha (solo memoria, sin recargar)
  if (!modalInHistory) {
    history.pushState({ modal: true }, "");
    modalInHistory = true;
  }

  // lo pesado (descripción, fecha, imagen): solo ahora se descarga
  loadDetails(g.id).then(all => {
    if (currentId !== g.id) return;   // ya abrió otro juego
    if (!all) {
      descEl.textContent = "No se pudo cargar la información. Revisa tu conexión.";
      banner.classList.add("no-img");
      return;
    }
    const d = all[g.id] || {};

    const release = formatDate(d.release_date);
    document.getElementById("modal-release").textContent = release;
    show("detail-release", !!release);

    document.getElementById("modal-publisher").textContent = d.publisher || "";
    show("detail-publisher", !!d.publisher);

    if (d.background_image) bg.src = d.background_image;
    else banner.classList.add("no-img");

    descEl.textContent = (d.description || "").trim();
    descCard.hidden = !d.description;
    descCard.classList.remove("short");
    descCard.classList.toggle("short", descEl.scrollHeight <= descEl.clientHeight + 4);
  });
}

expandBtn.addEventListener("click", () => {
  const open = descCard.classList.toggle("expanded");
  expandBtn.textContent = open ? "Leer menos" : "Leer más";
});

function closeModal() {
  modal.style.display = "none";
  document.body.style.overflow = "";
  document.body.classList.remove("modal-open");
  currentId = null;
  if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
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
modal.onclick = (e) => { if (e.target === modal) closeModal(); };

/* Teclado: "/" para buscar · Esc cierra la ficha o borra la búsqueda */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (modal.style.display === "flex") { closeModal(); return; }
    if (document.activeElement === searchInput && searchInput.value) {
      searchInput.value = "";
      applyFilter();
    }
  } else if (e.key === "/" && document.activeElement !== searchInput) {
    e.preventDefault();
    scrollToTop();
    searchInput.focus();
  }
});

/* =========================
   INICIO
========================= */
fetch("data/index.json")
  .then(r => r.json())
  .then(data => {
    detailSize = data.detail_size;
    allGames = data.games;
    allGames.forEach(g => g.key = norm(g.name));
    searchInput.placeholder = `Buscar entre ${allGames.length} juegos...`;
    buildGenres();
    applyFilter();
  })
  .catch(() => {
    emptyText.textContent = "No se pudo cargar el catálogo. Revisa tu conexión y recarga la página.";
    emptyMsg.style.display = "block";
  });
