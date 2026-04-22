const URL_API = "/api";

// Elemente DOM
const ecranLogin    = document.querySelector("#ecran-login");
const panouAdmin    = document.querySelector("#panou-admin");
const formLogin     = document.querySelector("#formular-login");
const eroareLogin   = document.querySelector("#eroare-login");
const formAdauga    = document.querySelector("#formular-adauga");
const mesajAdauga   = document.querySelector("#mesaj-adauga");
const mesajStergere = document.querySelector("#mesaj-stergere");
const corpTabel     = document.querySelector("#corp-tabel");
const btnLogout     = document.querySelector("#btn-logout");
const btnReincarca  = document.querySelector("#btn-reincarca");
const modalOverlay  = document.querySelector("#modal-overlay");
const formEdit      = document.querySelector("#formular-edit");
const mesajEdit     = document.querySelector("#mesaj-edit");

///////////////////////////////////////////////////////////
// Gestionare token

function salveazaToken(token) {
  localStorage.setItem("omnifood_admin_token", token);
}

function obtineToken() {
  return localStorage.getItem("omnifood_admin_token");
}

function stergeToken() {
  localStorage.removeItem("omnifood_admin_token");
}

function headersAutorizare() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${obtineToken()}`,
  };
}

///////////////////////////////////////////////////////////
// Afișare ecran corect

function arataPanou() {
  ecranLogin.classList.add("ascuns");
  panouAdmin.classList.remove("ascuns");
  incarcaMeniuri();
}

function arataLogin() {
  panouAdmin.classList.add("ascuns");
  ecranLogin.classList.remove("ascuns");
}

// La încărcarea paginii verifică dacă există deja un token salvat
if (obtineToken()) {
  arataPanou();
}

///////////////////////////////////////////////////////////
// Login

formLogin.addEventListener("submit", async function (e) {
  e.preventDefault();
  eroareLogin.textContent = "";

  const date = new FormData(formLogin);
  try {
    const raspuns = await fetch(`${URL_API}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: date.get("username"),
        password: date.get("password"),
      }),
    });

    if (raspuns.ok) {
      const { token } = await raspuns.json();
      salveazaToken(token);
      arataPanou();
    } else {
      const eroare = await raspuns.json();
      eroareLogin.textContent = eroare.detail ?? "Credențiale incorecte.";
    }
  } catch {
    eroareLogin.textContent = "Nu s-a putut contacta serverul.";
  }
});

///////////////////////////////////////////////////////////
// Logout

btnLogout.addEventListener("click", async function () {
  try {
    await fetch(`${URL_API}/admin/logout`, {
      method: "POST",
      headers: headersAutorizare(),
    });
  } catch { /* ignorăm erori de rețea la logout */ }

  stergeToken();
  arataLogin();
});

///////////////////////////////////////////////////////////
// Încarcă tabelul cu meniuri

async function incarcaMeniuri() {
  corpTabel.innerHTML = `<tr><td colspan="7" class="tabel-stare">Se încarcă...</td></tr>`;

  try {
    const raspuns = await fetch(`${URL_API}/menu`);
    const meniuri = await raspuns.json();

    if (meniuri.length === 0) {
      corpTabel.innerHTML = `<tr><td colspan="7" class="tabel-stare">Niciun meniu în baza de date.</td></tr>`;
      return;
    }

    corpTabel.innerHTML = meniuri.map(m => `
      <tr>
        <td>${m.id}</td>
        <td><img class="tabel-img" src="${m.image}" alt="${m.alt}" loading="lazy" /></td>
        <td>${m.name}</td>
        <td>${m.category}</td>
        <td>${m.price.toFixed(2)} lei</td>
        <td><span class="badge ${m.isFeatured ? "badge--da" : "badge--nu"}">${m.isFeatured ? "Da" : "Nu"}</span></td>
        <td>
          <button class="btn-edit" data-id="${m.id}">Editează</button>
          <button class="btn-sterge" data-id="${m.id}" data-nume="${m.name}">Șterge</button>
        </td>
      </tr>
    `).join("");

    // Atașează evenimentele de ștergere și editare
    corpTabel.querySelectorAll(".btn-sterge").forEach(btn => {
      btn.addEventListener("click", () => stergeMeniu(btn.dataset.id, btn.dataset.nume));
    });

    corpTabel.querySelectorAll(".btn-edit").forEach(btn => {
      const meniu = meniuri.find(m => m.id === Number(btn.dataset.id));
      btn.addEventListener("click", () => deschideModal(meniu));
    });

  } catch {
    corpTabel.innerHTML = `<tr><td colspan="7" class="tabel-stare">Eroare la încărcarea meniurilor.</td></tr>`;
  }
}

btnReincarca.addEventListener("click", incarcaMeniuri);

///////////////////////////////////////////////////////////
// Adaugă meniu nou

formAdauga.addEventListener("submit", async function (e) {
  e.preventDefault();
  mesajAdauga.textContent = "";
  mesajAdauga.className = "mesaj";

  const date = new FormData(formAdauga);
  const payload = {
    name: String(date.get("name")).trim(),
    category: String(date.get("category")),
    price: Number(date.get("price")),
    description: String(date.get("description")).trim(),
    image: String(date.get("image")).trim(),
    alt: String(date.get("alt")).trim(),
    isFeatured: date.get("isFeatured") === "on",
  };

  try {
    const raspuns = await fetch(`${URL_API}/menu`, {
      method: "POST",
      headers: headersAutorizare(),
      body: JSON.stringify(payload),
    });

    if (raspuns.status === 201) {
      const meniu = await raspuns.json();
      mesajAdauga.textContent = `✓ "${meniu.name}" adăugat cu succes (ID: ${meniu.id})`;
      mesajAdauga.className = "mesaj mesaj--succes";
      formAdauga.reset();
      incarcaMeniuri();
    } else if (raspuns.status === 401) {
      mesajAdauga.textContent = "Sesiune expirată. Reconectează-te.";
      mesajAdauga.className = "mesaj mesaj--eroare";
      stergeToken();
      arataLogin();
    } else {
      mesajAdauga.textContent = "Nu s-a putut adăuga meniul. Verifică datele.";
      mesajAdauga.className = "mesaj mesaj--eroare";
    }
  } catch {
    mesajAdauga.textContent = "Eroare de conexiune cu serverul.";
    mesajAdauga.className = "mesaj mesaj--eroare";
  }
});

///////////////////////////////////////////////////////////
// Șterge meniu

///////////////////////////////////////////////////////////
// Modal Editare

function deschideModal(meniu) {
  document.querySelector("#edit-id").value        = meniu.id;
  document.querySelector("#edit-name").value      = meniu.name;
  document.querySelector("#edit-category").value  = meniu.category;
  document.querySelector("#edit-price").value     = meniu.price;
  document.querySelector("#edit-description").value = meniu.description;
  document.querySelector("#edit-image").value     = meniu.image;
  document.querySelector("#edit-alt").value       = meniu.alt;
  document.querySelector("#edit-isFeatured").checked = meniu.isFeatured;
  mesajEdit.textContent = "";
  mesajEdit.className = "mesaj";
  modalOverlay.classList.remove("ascuns");
}

function inchideModal() {
  modalOverlay.classList.add("ascuns");
}

document.querySelector("#modal-inchide").addEventListener("click", inchideModal);
document.querySelector("#modal-anuleaza").addEventListener("click", inchideModal);
modalOverlay.addEventListener("click", function (e) {
  if (e.target === modalOverlay) inchideModal();
});

formEdit.addEventListener("submit", async function (e) {
  e.preventDefault();
  mesajEdit.textContent = "";
  mesajEdit.className = "mesaj";

  const date = new FormData(formEdit);
  const id = date.get("id");
  const payload = {
    name:        String(date.get("name")).trim(),
    category:    String(date.get("category")),
    price:       Number(date.get("price")),
    description: String(date.get("description")).trim(),
    image:       String(date.get("image")).trim(),
    alt:         String(date.get("alt")).trim(),
    isFeatured:  date.get("isFeatured") === "on",
  };

  try {
    const raspuns = await fetch(`${URL_API}/menu/${id}`, {
      method: "PUT",
      headers: headersAutorizare(),
      body: JSON.stringify(payload),
    });

    if (raspuns.ok) {
      const meniu = await raspuns.json();
      mesajEdit.textContent = `✓ "${meniu.name}" actualizat cu succes.`;
      mesajEdit.className = "mesaj mesaj--succes";
      incarcaMeniuri();
      setTimeout(inchideModal, 1200);
    } else if (raspuns.status === 401) {
      mesajEdit.textContent = "Sesiune expirată. Reconectează-te.";
      mesajEdit.className = "mesaj mesaj--eroare";
      stergeToken();
      arataLogin();
    } else {
      mesajEdit.textContent = "Nu s-a putut actualiza meniul.";
      mesajEdit.className = "mesaj mesaj--eroare";
    }
  } catch {
    mesajEdit.textContent = "Eroare de conexiune cu serverul.";
    mesajEdit.className = "mesaj mesaj--eroare";
  }
});

///////////////////////////////////////////////////////////
// Șterge meniu

async function stergeMeniu(id, nume) {
  if (!confirm(`Ești sigur că vrei să ștergi "${nume}"?`)) return;

  mesajStergere.textContent = "";
  mesajStergere.className = "mesaj";

  try {
    const raspuns = await fetch(`${URL_API}/menu/${id}`, {
      method: "DELETE",
      headers: headersAutorizare(),
    });

    if (raspuns.status === 204) {
      mesajStergere.textContent = `✓ "${nume}" a fost șters.`;
      mesajStergere.className = "mesaj mesaj--succes";
      incarcaMeniuri();
    } else if (raspuns.status === 401) {
      mesajStergere.textContent = "Sesiune expirată. Reconectează-te.";
      mesajStergere.className = "mesaj mesaj--eroare";
      stergeToken();
      arataLogin();
    } else {
      mesajStergere.textContent = "Nu s-a putut șterge meniul.";
      mesajStergere.className = "mesaj mesaj--eroare";
    }
  } catch {
    mesajStergere.textContent = "Eroare de conexiune cu serverul.";
    mesajStergere.className = "mesaj mesaj--eroare";
  }
}
