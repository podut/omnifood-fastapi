console.log("Hello world!");

const myName = "Jonas Schmedtmann";
const h1 = document.querySelector(".titlu-principal");
console.log(myName);
console.log(h1);

// h1.addEventListener("click", function () {
//   h1.textContent = myName;
//   h1.style.backgroundColor = "red";
//   h1.style.padding = "5rem";
// });

///////////////////////////////////////////////////////////
// Setează anul curent
const yearEl = document.querySelector(".an");
const currentYear = new Date().getFullYear();
yearEl.textContent = currentYear;

///////////////////////////////////////////////////////////
// Activează navigarea mobilă

const btnNavEl = document.querySelector(".btn-nav-mobil");
const headerEl = document.querySelector(".antet");

btnNavEl.addEventListener("click", function () {
  headerEl.classList.toggle("nav-deschis");
});

///////////////////////////////////////////////////////////
// Animație de derulare lină

const allLinks = document.querySelectorAll("a:link");

allLinks.forEach(function (link) {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    const href = link.getAttribute("href");

    // Derulează înapoi sus
    if (href === "#")
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    // Derulează la alte link-uri
    if (href !== "#" && href.startsWith("#")) {
      const sectionEl = document.querySelector(href);
      sectionEl.scrollIntoView({ behavior: "smooth" });
    }

    // Închide navigarea mobilă
    if (link.classList.contains("nav-principal-link"))
      headerEl.classList.toggle("nav-deschis");
  });
});

///////////////////////////////////////////////////////////
// Navigare fixată

const sectionHeroEl = document.querySelector(".sectiune-erou");

const obs = new IntersectionObserver(
  function (entries) {
    const ent = entries[0];
    console.log(ent);

    if (ent.isIntersecting === false) {
      document.body.classList.add("fixat");
    }

    if (ent.isIntersecting === true) {
      document.body.classList.remove("fixat");
    }
  },
  {
    // În viewport
    root: null,
    threshold: 0,
    rootMargin: "-80px",
  }
);
obs.observe(sectionHeroEl);

///////////////////////////////////////////////////////////
// Reparare proprietate gap flexbox lipsă în unele versiuni Safari
function checkFlexGap() {
  var flex = document.createElement("div");
  flex.style.display = "flex";
  flex.style.flexDirection = "column";
  flex.style.rowGap = "1px";

  flex.appendChild(document.createElement("div"));
  flex.appendChild(document.createElement("div"));

  document.body.appendChild(flex);
  var isSupported = flex.scrollHeight === 1;
  flex.parentNode.removeChild(flex);
  console.log(isSupported);

  if (!isSupported) document.body.classList.add("fara-flexbox-gap");
}
checkFlexGap();

///////////////////////////////////////////////////////////
// Încarcă meniuri dinamice din API backend

const URL_API = "/api";

// Mapare categorie → clasă CSS pentru eticheta colorată
function categorieClasa(categorie) {
  const map = {
    vegetarian: "eticheta--vegetarian",
    vegan: "eticheta--vegan",
    paleo: "eticheta--paleo",
    pescatarian: "eticheta--pescatarian",
  };
  return map[categorie.toLowerCase()] ?? "eticheta--vegetarian";
}

// Construiește un nod DOM pentru un card de masă
function creeazaCardMasa(masa) {
  const div = document.createElement("div");
  div.classList.add("masa");
  div.innerHTML = `
    <img src="${masa.image}" class="masa-img" alt="${masa.alt}" loading="lazy" />
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
          <ion-icon class="masa-icon" name="restaurant-outline"></ion-icon>
          <span>${masa.description}</span>
        </li>
      </ul>
    </div>
  `;
  return div;
}

async function incarcaMeniuri() {
  const grila = document.querySelector("#grila-meniuri");
  if (!grila) return;

  const coloanadieta = grila.querySelector(".diete");

  try {
    const raspuns = await fetch(`${URL_API}/menu`);
    if (!raspuns.ok) throw new Error("Răspuns invalid de la server");

    const meniuri = await raspuns.json();

    // Elimină cardurile statice existente, păstrează coloana de diete
    grila.querySelectorAll(".masa").forEach((el) => el.remove());

    // Afișează primele 2 meniuri marcate ca featured
    const deAfisat = meniuri.filter((m) => m.isFeatured).slice(0, 2);
    deAfisat.forEach((masa) => grila.insertBefore(creeazaCardMasa(masa), coloanadieta));
  } catch (eroare) {
    console.error("Nu s-au putut încărca meniurile din API:", eroare);
  }
}

///////////////////////////////////////////////////////////
// Trimite formularul CTA la API pentru a crea o comandă

const formularCta = document.querySelector("#formular-cta");
const mesajStatus = document.querySelector("#mesaj-status");

function arataMesaj(text, tip) {
  mesajStatus.textContent = text;
  mesajStatus.className = "mesaj-status";
  mesajStatus.classList.add(
    tip === "success" ? "mesaj-status--succes" : "mesaj-status--eroare"
  );
}

formularCta?.addEventListener("submit", async function (e) {
  e.preventDefault();

  const date = new FormData(formularCta);
  const payload = {
    contact_name: String(date.get("full-name")).trim(),
    contact_email: String(date.get("email")).trim(),
    date: date.get("date"),
    time: date.get("time"),
    guest_count: Number(date.get("guests")),
    // Câmpul "de unde ai auzit" merge ca cerință specială
    special_requests: date.get("select-where") || null,
  };

  try {
    const raspuns = await fetch(`${URL_API}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (raspuns.status === 201) {
      const comanda = await raspuns.json();
      arataMesaj(
        `Mulțumim! Comanda #${comanda.id} este confirmată pentru ${payload.date} la ${payload.time}.`,
        "success"
      );
      formularCta.reset();
    } else {
      arataMesaj("Nu s-a putut trimite comanda. Verifică datele introduse.", "error");
    }
  } catch (eroare) {
    arataMesaj("Eroare de conexiune cu serverul. Încearcă din nou.", "error");
    console.error(eroare);
  }
});

incarcaMeniuri();

// https://unpkg.com/smoothscroll-polyfill@0.4.4/dist/smoothscroll.min.js

/*
.fara-flexbox-gap .nav-principal-lista li:not(:last-child) {
  margin-right: 4.8rem;
}

.fara-flexbox-gap .element-lista:not(:last-child) {
  margin-bottom: 1.6rem;
}

.fara-flexbox-gap .icon-lista:not(:last-child) {
  margin-right: 1.6rem;
}

.fara-flexbox-gap .delivered-faces {
  margin-right: 1.6rem;
}

.fara-flexbox-gap .masa-atribut:not(:last-child) {
  margin-bottom: 2rem;
}

.fara-flexbox-gap .masa-icon {
  margin-right: 1.6rem;
}

.fara-flexbox-gap .subsol-row div:not(:last-child) {
  margin-right: 6.4rem;
}

.fara-flexbox-gap .linkuri-sociale li:not(:last-child) {
  margin-right: 2.4rem;
}

.fara-flexbox-gap .subsol-nav li:not(:last-child) {
  margin-bottom: 2.4rem;
}

@media (max-width: 75em) {
  .fara-flexbox-gap .nav-principal-lista li:not(:last-child) {
    margin-right: 3.2rem;
  }
}

@media (max-width: 59em) {
  .fara-flexbox-gap .nav-principal-lista li:not(:last-child) {
    margin-right: 0;
    margin-bottom: 4.8rem;
  }
}
*/
