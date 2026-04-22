from __future__ import annotations

from collections.abc import Generator
from pathlib import Path

from sqlmodel import Session, create_engine

# Directorul în care se află acest fișier (backend/)
DIR_BAZA = Path(__file__).resolve().parent
FISIER_BAZA_DATE_IMPLICIT = DIR_BAZA / "omnifood.db"


def construieste_url_baza_date(fisier_baza_date: Path) -> str:
    # Returnează URL-ul de conectare SQLite pentru fișierul dat
    return f"sqlite:///{fisier_baza_date}"


FISIER_BAZA_DATE = FISIER_BAZA_DATE_IMPLICIT
URL_BAZA_DATE = construieste_url_baza_date(FISIER_BAZA_DATE)

# Motorul este punctul central de conexiune la baza de date
motor = create_engine(
    URL_BAZA_DATE,
    connect_args={"check_same_thread": False},
)


def configureaza_motorul(fisier_baza_date: Path | None = None) -> None:
    # Reconfigurează motorul cu un alt fișier de bază de date (util la teste)
    global FISIER_BAZA_DATE, URL_BAZA_DATE, motor

    motor.dispose()
    FISIER_BAZA_DATE = fisier_baza_date or FISIER_BAZA_DATE_IMPLICIT
    URL_BAZA_DATE = construieste_url_baza_date(FISIER_BAZA_DATE)
    motor = create_engine(
        URL_BAZA_DATE,
        connect_args={"check_same_thread": False},
    )


def obtine_sesiune() -> Generator[Session, None, None]:
    # Generator care deschide o sesiune și o închide automat după utilizare
    with Session(motor) as sesiune:
        yield sesiune
