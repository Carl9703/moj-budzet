-- Sprawdź schemat tabeli Envelope
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'Envelope'
ORDER BY ordinal_position;

-- Sprawdź schemat tabeli Transaction  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'Transaction'
ORDER BY ordinal_position;

-- Prosty test - sprawdź wszystkie kolumny w Envelope
SELECT * FROM "Envelope" LIMIT 1;
