const URL_API = "/api";
const continut = document.querySelector("#continut-detaliu");

document.querySelector("#an-curent").textContent = new Date().getFullYear();

async function incarcaDetaliu() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    continut.innerHTML = `
      <a href="/meals.html" class="detaliu-inapoi">&larr; Înapoi la meniuri</a>
      <p class="stare-incarcare">ID lipsă. <a href="/meals.html">Vezi toate meniurile.</a></p>
    `;
    return;
  }

  try {
    const raspuns = await fetch(`${URL_API}/menu/${id}`);

    if (raspuns.status === 404) {
      continut.innerHTML = `
        <a href="/meals.html" class="detaliu-inapoi">&larr; Înapoi la meniuri</a>
        <p class="stare-incarcare">Meniul cu ID-ul ${id} nu a fost găsit.</p>
      `;
      return;
    }

    const masa = await raspuns.json();
    document.title = `Omnifood — ${masa.name}`;

    continut.innerHTML = `
      <a href="/meals.html" class="detaliu-inapoi">&larr; Înapoi la meniuri</a>
      <div class="detaliu-grid">
        <div class="detaliu-img-container">
          <img src="${masa.image}" alt="${masa.alt}" class="detaliu-img" />
        </div>
        <div class="detaliu-info">
          <div class="detaliu-categorie">
            <span class="eticheta eticheta--${masa.category.toLowerCase()}">${masa.category}</span>
            ${masa.isFeatured ? '<span class="detaliu-featured">⭐ Featured</span>' : ""}
          </div>
          <h1 class="detaliu-titlu">${masa.name}</h1>
          <p class="detaliu-descriere">${masa.description}</p>
          <p class="detaliu-pret">${masa.price.toFixed(2)} lei / porție</p>
          <a href="/#cta" class="detaliu-btn">Comandă acum &rarr;</a>
        </div>
      </div>
    `;
  } catch {
    continut.innerHTML = `
      <a href="/meals.html" class="detaliu-inapoi">&larr; Înapoi la meniuri</a>
      <p class="stare-incarcare">Eroare la încărcarea meniurilor.</p>
    `;
  }
}

incarcaDetaliu();
