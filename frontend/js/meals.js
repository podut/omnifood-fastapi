const URL_API = "/api";
const grila = document.querySelector("#grila-toate-meniurile");
const butoaneFiltru = document.querySelectorAll(".btn-filtru");

document.querySelector("#an-curent").textContent = new Date().getFullYear();

function categorieClasa(cat) {
  return `eticheta--${cat.toLowerCase()}`;
}

function genereazaCard(masa) {
  return `
    <a href="/meal?id=${masa.id}" class="masa-link">
      <div class="masa">
        <div class="masa-img-container">
          <img src="${masa.image}" class="masa-img" alt="${masa.alt}" loading="lazy" />
        </div>
        <div class="masa-continut">
          <div class="masa-etichete">
            <span class="eticheta ${categorieClasa(masa.category)}">${masa.category}</span>
          </div>
          <p class="masa-titlu">${masa.name}</p>
          <ul class="masa-atribute">
            <li class="masa-atribut">
              <ion-icon class="masa-icon" name="cash-outline"></ion-icon>
              <span><strong>${masa.price.toFixed(2)}</strong> lei / porție</span>
            </li>
            <li class="masa-atribut">
              <ion-icon class="masa-icon" name="document-text-outline"></ion-icon>
              <span>${masa.description}</span>
            </li>
          </ul>
        </div>
      </div>
    </a>
  `;
}

let toateMeniurile = [];

async function incarcaMeniuri() {
  try {
    const raspuns = await fetch(`${URL_API}/menu`);
    toateMeniurile = await raspuns.json();
    afiseazaMeniuri("toate");
  } catch {
    grila.innerHTML = `<p class="stare-incarcare">Eroare la încărcarea meniurilor.</p>`;
  }
}

function afiseazaMeniuri(filtru) {
  const lista = filtru === "toate"
    ? toateMeniurile
    : toateMeniurile.filter(m => m.category === filtru);

  if (lista.length === 0) {
    grila.innerHTML = `<p class="stare-incarcare">Niciun meniu în categoria selectată.</p>`;
    return;
  }

  grila.innerHTML = lista.map(genereazaCard).join("");
}

butoaneFiltru.forEach(btn => {
  btn.addEventListener("click", () => {
    butoaneFiltru.forEach(b => b.classList.remove("activ"));
    btn.classList.add("activ");
    afiseazaMeniuri(btn.dataset.filtru);
  });
});

incarcaMeniuri();
