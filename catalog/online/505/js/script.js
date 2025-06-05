
document.getElementById("buscador").addEventListener("input", function () {
  const filtro = this.value.toLowerCase();
  document.querySelectorAll(".card").forEach(card => {
    const nombre = card.getAttribute("data-nombre").toLowerCase();
    card.style.display = nombre.includes(filtro) ? "block" : "none";
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".card img").forEach(img => {
    img.addEventListener("click", function () {
      const card = this.closest(".card");
      const nombre = card.getAttribute("data-nombre");
      const tamano = card.getAttribute("data-tamano");
      document.getElementById("modal-img").src = this.src;
      document.getElementById("modal-info").textContent = `${nombre} - ${tamano} GB`;
      document.getElementById("modal").style.display = "flex";
    });
  });

  document.getElementById("modal").addEventListener("click", function () {
    this.style.display = "none";
  });
});
