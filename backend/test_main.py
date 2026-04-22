import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient
from sqlmodel import Session, select

# Adăugăm directorul backend în sys.path pentru a putea importa main și database
DIR_BACKEND = Path(__file__).resolve().parent
if str(DIR_BACKEND) not in sys.path:
    sys.path.insert(0, str(DIR_BACKEND))

import main as backend_main


class OmnifoodApiTeste(unittest.TestCase):

    def setUp(self) -> None:
        # Pregătim fișierele temporare de test (meniu și bază de date)
        self.dir_backend = DIR_BACKEND
        self.fisier_meniu = self.dir_backend / "_test_menu.json"
        self.fisier_baza_date = self.dir_backend / "_test_omnifood.db"
        fisier_meniu_sursa = self.dir_backend / "menu.json"

        # Copiem menu.json real în fișierul de test
        self.fisier_meniu.write_text(
            fisier_meniu_sursa.read_text(encoding="utf-8"), encoding="utf-8"
        )

        # Ștergem baza de date de test dacă există din rularea anterioară
        if self.fisier_baza_date.exists():
            self.fisier_baza_date.unlink()

        # Configurăm aplicația să folosească fișierele de test
        self.backend_main = backend_main
        self.backend_main.FISIER_MENIU = self.fisier_meniu
        self.backend_main.database.configureaza_motorul(self.fisier_baza_date)

        # Pornim clientul de test (declanșează și lifespan/startup)
        self.context_client = TestClient(self.backend_main.app)
        self.client = self.context_client.__enter__()

    def tearDown(self) -> None:
        # Oprim clientul și ștergem fișierele temporare după fiecare test
        self.context_client.__exit__(None, None, None)
        self.backend_main.database.motor.dispose()
        if self.fisier_meniu.exists():
            self.fisier_meniu.unlink()
        if self.fisier_baza_date.exists():
            self.fisier_baza_date.unlink()

    def test_pornire_populeaza_meniul_in_baza_de_date(self) -> None:
        # La pornire, cele 8 elemente din menu.json trebuie să fie în DB
        with Session(self.backend_main.database.motor) as sesiune:
            elemente_meniu = sesiune.exec(
                select(self.backend_main.ElementMeniu)
            ).all()

        self.assertEqual(len(elemente_meniu), 8)

    def test_status_returneaza_numaratoarea(self) -> None:
        raspuns = self.client.get("/api/status")

        self.assertEqual(raspuns.status_code, 200)
        self.assertEqual(raspuns.json()["status"], "ok")
        self.assertEqual(raspuns.json()["numar_meniuri"], 8)
        self.assertEqual(raspuns.json()["numar_comenzi"], 0)

    def test_obtine_meniu_returneaza_toate_elementele(self) -> None:
        raspuns = self.client.get("/api/menu")

        self.assertEqual(raspuns.status_code, 200)
        self.assertEqual(len(raspuns.json()), 8)

    def test_obtine_meniu_filtreaza_dupa_categorie_fara_majuscule(self) -> None:
        raspuns = self.client.get("/api/menu", params={"category": "vegan"})

        self.assertEqual(raspuns.status_code, 200)
        # Toate elementele returnate trebuie să fie din categoria "Vegan"
        self.assertTrue(all(elem["category"] == "Vegan" for elem in raspuns.json()))

    def test_obtine_element_meniu_returneaza_un_singur_element(self) -> None:
        raspuns = self.client.get("/api/menu/1")

        self.assertEqual(raspuns.status_code, 200)
        self.assertEqual(raspuns.json()["name"], "Gyoza Japoneze")

    def test_obtine_element_meniu_returneaza_404_pentru_id_inexistent(self) -> None:
        raspuns = self.client.get("/api/menu/999")

        self.assertEqual(raspuns.status_code, 404)
        self.assertEqual(raspuns.json()["detail"], "Elementul din meniu nu a fost găsit.")

    def test_post_comanda_returneaza_201_si_salveaza_in_baza_de_date(self) -> None:
        date_comanda = {
            "contact_name": "Ion Popescu",
            "contact_email": "ion@example.com",
            "date": "2026-06-15",
            "time": "14:30",
            "guest_count": 4,
            "special_requests": "Fără gluten, vă rog.",
        }

        raspuns = self.client.post("/api/reservations", json=date_comanda)

        self.assertEqual(raspuns.status_code, 201)
        date_raspuns = raspuns.json()
        self.assertEqual(date_raspuns["id"], 1)
        self.assertEqual(date_raspuns["contact_name"], date_comanda["contact_name"])

        # Verificăm că comanda a fost salvată fizic în baza de date
        with Session(self.backend_main.database.motor) as sesiune:
            comenzi_salvate = sesiune.exec(
                select(self.backend_main.Comanda)
            ).all()

        self.assertEqual(len(comenzi_salvate), 1)
        self.assertEqual(comenzi_salvate[0].contact_email, date_comanda["contact_email"])

    def test_post_comanda_respinge_numar_persoane_invalid(self) -> None:
        # guest_count=0 este sub minimul de 1 → trebuie să returneze 422
        date_comanda = {
            "contact_name": "Ion Popescu",
            "contact_email": "ion@example.com",
            "date": "2026-06-15",
            "time": "14:30",
            "guest_count": 0,
            "special_requests": None,
        }

        raspuns = self.client.post("/api/reservations", json=date_comanda)

        self.assertEqual(raspuns.status_code, 422)

    def test_post_comanda_respinge_email_invalid(self) -> None:
        # Email-ul "nu-este-email" nu este valid → trebuie să returneze 422
        date_comanda = {
            "contact_name": "Ion Popescu",
            "contact_email": "nu-este-email",
            "date": "2026-06-15",
            "time": "14:30",
            "guest_count": 4,
            "special_requests": None,
        }

        raspuns = self.client.post("/api/reservations", json=date_comanda)

        self.assertEqual(raspuns.status_code, 422)


if __name__ == "__main__":
    unittest.main()
