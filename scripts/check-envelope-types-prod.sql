-- SPRAWDŹ JAKIE TYPY KOPERT SĄ NA PRODUKCJI
SELECT 
    id,
    name,
    type,
    "envelopeType",
    "group"
FROM "Envelope"
WHERE name ILIKE '%Wakacje%' 
   OR name ILIKE '%Wesele%' 
   OR name ILIKE '%Podróże%'
   OR name ILIKE '%Fundusz%'
   OR name ILIKE '%Budowanie%';
