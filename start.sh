#!/bin/bash

# Găsește directorul în care se află acest script, indiferent de unde e rulat
DIR_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIR_BACKEND="$DIR_SCRIPT/backend"

echo "================================================"
echo "  Omnifood API - Pornire Server"
echo "================================================"
echo ""

# Verifică dacă folderul backend există
if [ ! -d "$DIR_BACKEND" ]; then
    echo "EROARE: Folderul backend/ nu a fost găsit la: $DIR_BACKEND"
    exit 1
fi

echo "Se instalează/verifică toate dependențele..."
pip install fastapi uvicorn sqlmodel "pydantic[email]" aiofiles

echo ""
echo "================================================"
echo ""
echo "Serverul pornește la:  http://localhost:8000"
echo "Documentație API:      http://localhost:8000/docs"
echo "Apasă CTRL+C pentru a opri serverul."
echo ""

cd "$DIR_BACKEND"
uvicorn main:app --reload
