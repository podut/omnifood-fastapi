# Omnifood — Proiect Full-Stack

Site Omnifood cu backend FastAPI + bază de date SQLite.

## Structură

```
09-Omnifood-Optimizations/
├── backend/
│   ├── main.py          # API FastAPI (endpoint-uri, modele)
│   ├── database.py      # Conexiune SQLite + sesiuni
│   ├── menu.json        # Date inițiale meniuri (seed)
│   └── test_main.py     # Teste automate
├── frontend/
│   ├── index.html       # Site Omnifood
│   ├── css/             # Stiluri
│   ├── js/script.js     # Logică frontend + apeluri API
│   └── img/             # Imagini
└── start.sh             # Script pornire server
```

## Pornire

```bash
bash start.sh
```

Deschide browserul la: **http://localhost:8000**

## Endpoint-uri API

| Metodă | URL | Descriere |
|--------|-----|-----------|
| GET | `/api/status` | Status server + număr înregistrări |
| GET | `/api/menu` | Toate meniurile |
| GET | `/api/menu?category=Vegan` | Meniuri filtrate după categorie |
| GET | `/api/menu/{id}` | Un singur element din meniu |
| POST | `/api/reservations` | Creează o comandă nouă |

Documentație interactivă: **http://localhost:8000/docs**

## Tehnologii

- **Backend:** Python, FastAPI, SQLModel, SQLite
- **Frontend:** HTML, CSS, JavaScript (Fetch API)

## Vizualizare bază de date

- **DB Browser for SQLite** — deschide `backend/omnifood.db`
- **VS Code** — extensia *SQLite Viewer*
- **API** — `http://localhost:8000/api/status`
# omnifood-fastapi
