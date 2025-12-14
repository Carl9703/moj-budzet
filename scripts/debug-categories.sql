-- Skrypt diagnostyczny
-- Pokaże dokładną zawartość pola category (długość, kody ASCII/HEX), aby wykryć ukryte znaki.

SELECT 
    "category",
    LENGTH("category") as char_length,
    OCTET_LENGTH("category") as byte_length,
    encode("category"::bytea, 'hex') as hex_value   -- Pokaże dokładny zapis binarny
FROM "Transaction" 
WHERE "category" NOT IN (
    'housing-bills', 'housing-equipment', 'housing-repairs',
    'shared-groceries', 'personal-groceries',
    'fuel', 'public-transport', 'parking',
    'healthcare', 'drugstore',
    'phone', 'subscriptions',
    'hobby', 'entertainment', 'books', 'sport', 'beauty',
    'restaurants', 'work-lunch',
    'clothes', 'shoes', 'accessories',
    'ike', 'crypto',
    'car-insurance', 'car-repairs',
    'vacation', 'weekend-trips',
    'wedding', 'gifts', 'emergency',
    'salary', 'bonus', 'other-income', 'investments', 'other'
)
ORDER BY "category"
LIMIT 50;
