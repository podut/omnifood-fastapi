from __future__ import annotations

import json
from contextlib import asynccontextmanager
from datetime import date, time
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import EmailStr
from sqlalchemy import func
from sqlmodel import Field, SQLModel, Session, select

import database

# Directorul backend/ și calea către fișierul JSON cu meniuri
DIR_BAZA = Path(__file__).resolve().parent
FISIER_MENIU = DIR_BAZA / "menu.json"


# --- Modele de date ---

class ElementMeniuBaza(SQLModel):
    # Câmpurile comune folosite atât pentru validare cât și pentru baza de date
    name: str
    category: str
    price: float
    description: str
    image: str
    alt: str
    isFeatured: bool = False


class ElementMeniu(ElementMeniuBaza, table=True):
    # table=True îi spune SQLModel să creeze un tabel în baza de date
    id: int | None = Field(default=None, primary_key=True)


class ComandaBaza(SQLModel):
    # Câmpurile unei comenzi cu validări Pydantic
    contact_name: str = Field(min_length=1, max_length=100)
    contact_email: EmailStr
    date: date
    time: time
    guest_count: int = Field(ge=1, le=20)
    special_requests: str | None = Field(default=None, max_length=500)


class Comanda(ComandaBaza, table=True):
    # Tabelul comenzilor în baza de date
    id: int | None = Field(default=None, primary_key=True)


class ComandaCreare(ComandaBaza):
    # Model folosit doar pentru datele primite din cererea POST (fără id)
    pass


# --- Funcții ajutătoare ---

def citeste_fisier_json(cale: Path, valoare_implicita: Any | None = None) -> Any:
    # Citește un fișier JSON; dacă nu există, îl creează cu valoarea implicită
    if not cale.exists():
        if valoare_implicita is None:
            raise FileNotFoundError(f"Fișierul de date lipsește: {cale}")

        cale.write_text(json.dumps(valoare_implicita, indent=2) + "\n", encoding="utf-8")
        return valoare_implicita

    return json.loads(cale.read_text(encoding="utf-8"))


def populeaza_meniu(sesiune: Session) -> None:
    # Dacă tabelul este gol, importă datele din menu.json (seed data)
    element_existent = sesiune.exec(select(ElementMeniu).limit(1)).first()
    if element_existent is not None:
        return

    elemente_brute = citeste_fisier_json(FISIER_MENIU)
    elemente_meniu = [ElementMeniu.model_validate(elem) for elem in elemente_brute]
    sesiune.add_all(elemente_meniu)
    sesiune.commit()


@asynccontextmanager
async def durata_de_viata(_: FastAPI):
    # Se execută la pornirea serverului: creează tabelele și populează meniul
    SQLModel.metadata.create_all(database.motor)

    with Session(database.motor) as sesiune:
        populeaza_meniu(sesiune)

    yield


# --- Aplicația FastAPI ---

app = FastAPI(
    title="Omnifood API",
    description="API FastAPI pentru servirea meniurilor și gestionarea comenzilor Omnifood.",
    lifespan=durata_de_viata,
)

# Browserele blochează cererile cross-origin implicit, deci frontend-ul
# are nevoie de o regulă CORS explicită pentru a putea apela API-ul.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Endpoint-uri ---

@app.get("/api/status")
def obtine_status(sesiune: Session = Depends(database.obtine_sesiune)) -> dict[str, Any]:
    # FastAPI serializează automat dicționarele Python în JSON
    return {
        "status": "ok",
        "numar_meniuri": len(sesiune.exec(select(ElementMeniu)).all()),
        "numar_comenzi": len(sesiune.exec(select(Comanda)).all()),
    }


@app.get("/api/menu", response_model=list[ElementMeniu])
def obtine_meniu(
    category: str | None = Query(default=None),
    sesiune: Session = Depends(database.obtine_sesiune),
) -> list[ElementMeniu]:
    # Returnează toate elementele meniului, opțional filtrate după categorie
    interogare = select(ElementMeniu).order_by(ElementMeniu.id)

    if category is None:
        return list(sesiune.exec(interogare).all())

    # Normalizăm categoria pentru comparație case-insensitive
    categorie_normalizata = category.strip().casefold()
    interogare_filtrata = interogare.where(
        func.lower(ElementMeniu.category) == categorie_normalizata
    )
    return list(sesiune.exec(interogare_filtrata).all())


@app.get("/api/menu/{id_element}", response_model=ElementMeniu)
def obtine_element_meniu(
    id_element: int,
    sesiune: Session = Depends(database.obtine_sesiune),
) -> ElementMeniu:
    # Caută elementul după ID; returnează 404 dacă nu există
    element = sesiune.get(ElementMeniu, id_element)
    if element is not None:
        return element

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Elementul din meniu nu a fost găsit.",
    )


@app.post(
    "/api/reservations",
    response_model=Comanda,
    status_code=status.HTTP_201_CREATED,
)
def creeaza_comanda(
    cerere_comanda: ComandaCreare,
    sesiune: Session = Depends(database.obtine_sesiune),
) -> Comanda:
    # FastAPI validează JSON-ul față de ComandaCreeze înainte ca funcția să ruleze.
    # Payload-urile invalide returnează automat eroare 422.
    comanda = Comanda.model_validate(cerere_comanda)
    sesiune.add(comanda)
    sesiune.commit()
    # refresh() obține ID-ul generat de baza de date
    sesiune.refresh(comanda)
    return comanda


# --- Servire fișiere statice (frontend) ---
# Montăm folderul frontend/ la rădăcina serverului DUPĂ toate rutele API,
# astfel încât /api/... să fie interceptate mai întâi de FastAPI.
DIR_FRONTEND = DIR_BAZA.parent / "frontend"
app.mount("/", StaticFiles(directory=DIR_FRONTEND, html=True), name="frontend")
