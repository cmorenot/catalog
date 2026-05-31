
let chunk = 0;
let loading = false;
let allGames = [];
let filterActive = false;

const grid = document.getElementById("grid");
const modal = document.getElementById("modal");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const genresList = [
  { value: "action", label: "Acción" },
  { value: "shooter", label: "Disparos" },
  { value: "arcade", label: "Arcade" },
  { value: "indie", label: "Indie" },
  { value: "simulation", label: "Simulación" },
  { value: "sports", label: "Deportes" },
  { value: "racing", label: "Carreras" },
  { value: "adventure", label: "Aventura" },
  { value: "rpg", label: "RPG" },
  { value: "strategy", label: "Estrategia" },
  { value: "platformer", label: "Plataformas" },
  { value: "massively multiplayer", label: "Multijugador masivo" },
  { value: "casual", label: "Casual" },
  { value: "puzzle", label: "Rompecabezas" },
  { value: "fighting", label: "Lucha" }
];

const allOption = document.createElement("option");
allOption.value = "";
allOption.textContent = "🎮 Todos los géneros";
filterSelect.appendChild(allOption);

genresList.forEach(g => {
  const option = document.createElement("option");
  option.value = g.value;
  option.textContent = g.label;
  filterSelect.appendChild(option);
});


/* =========================
   CARGA INDEX (TODOS LOS JUEGOS)
========================= */
fetch("data/index.json")
  .then(res => res.json())
  .then(data => {
    allGames = data;
    loadChunk(0);
  });

/* =========================
   CARGA CHUNKS (SCROLL)
========================= */
function loadChunk(i) {
  if (loading) return;
  loading = true;

  fetch(`data/chunks/page_${i}.json`)
    .then(res => res.json())
    .then(data => {
      const frag = document.createDocumentFragment();

      data.forEach(g => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
          <div class="img-box">
            <img src="${g.img_low}">
          </div>
          <div class="title">${g.name}</div>
          <div class="size">${g.size} GB</div>
        `;

        card.onclick = () => openModal(g);
        frag.appendChild(card);
      });

      grid.appendChild(frag);
    })
    .finally(() => loading = false);
}

/* =========================
   MODAL
========================= */
function openModal(g) {
  document.getElementById("modal-img").src = g.img_low;
  document.getElementById("modal-title").innerText = g.name;

  document.getElementById("modal-name").innerText = g.name;
  document.getElementById("modal-size").innerText = g.size || "";
  document.getElementById("modal-rating").innerText = g.rating || "";
  document.getElementById("modal-release").innerText = g.release_date || "";
  document.getElementById("modal-genres").innerText = (g.genres || []).join(", ");
  document.getElementById("modal-platforms").innerText = (g.platforms || []).join(", ");

  const mc = document.getElementById("modal-metacritic-link");
  mc.innerText = g.metacritic || "";
  mc.href = g.metacritic_url || "#";

  const descEl = document.getElementById("modal-desc");
  if (descEl) descEl.innerText = g.description || "";
  document.getElementById("modal-background").src = g.background_image || "";

  const descCard = document.getElementById("modal-desc-card");

  // make modal visible
  modal.style.display = "flex";

  if (descCard) {
    descCard.classList.remove("expanded");
  }
}

/* =========================
   CLOSE MODAL
========================= */
document.getElementById("close-btn").onclick = () => {
  modal.style.display = "none";
};

// expand button handler is attached inside openModal when needed

modal.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

/* =========================
   SCROLL INFINITO
========================= */
window.addEventListener("scroll", () => {
  if (filterActive) return; // 🚫 NO cargar más si estás filtrando

  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
    chunk++;
    loadChunk(chunk);
  }
});

/* =========================
   BUSCADOR GLOBAL (INDEX.JSON)
========================= */
function filterGames(query = "", filter = "") {
  query = query.toLowerCase().trim();
  filter = filter.toLowerCase().trim();

  grid.innerHTML = "";

  // 👉 detectar si hay filtro activo
  filterActive = !!query || !!filter;

  let results = allGames;

  if (query) {
    results = results.filter(g =>
      g.name.toLowerCase().includes(query)
    );
  }

  if (filter) {
    results = results.filter(g =>
      (g.genres || []).some(gen =>
        gen.toLowerCase().includes(filter)
      )
    );
  }

  const frag = document.createDocumentFragment();

  results.forEach(g => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="img-box">
        <img src="${g.img_low}">
      </div>
      <div class="title">${g.name}</div>
      <div class="size">${g.size} GB</div>
    `;

    card.onclick = () => openModal(g);
    frag.appendChild(card);
  });

  grid.appendChild(frag);

  // 👇 AQUÍ VA (al final de todo)
  if (!filterActive) {
    chunk = 0;
    grid.innerHTML = "";
    loadChunk(0);
  }
}

/* =========================
   EVENTOS BUSCADOR
========================= */

searchInput.addEventListener("input", () => {
  filterGames(searchInput.value, filterSelect.value);
});

filterSelect.addEventListener("change", () => {
  filterGames(searchInput.value, filterSelect.value);
});

loadChunk(0);
