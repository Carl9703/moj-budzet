#!/bin/bash

# 🧹 RESET BAZY MAIN - Czysty start
# Wykonaj na bazie MAIN

echo "🚨 UWAGA: To usunie wszystkie dane z bazy MAIN!"
echo "Czy na pewno chcesz kontynuować? (y/N)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "🧹 Czyszczenie bazy MAIN..."
    
    # Opcja 1: Prisma Reset (REKOMENDOWANE)
    echo "📦 Uruchamianie Prisma Reset..."
    npx prisma migrate reset --force
    
    echo "✅ Baza MAIN została wyczyszczona!"
    echo "🚀 Możesz teraz uruchomić aplikację z czystą bazą"
    
else
    echo "❌ Anulowano czyszczenie bazy"
fi
