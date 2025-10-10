-- 🔍 DEBUG: Sprawdzenie kopert w bazie danych

-- 1. Sprawdź wszystkie koperty użytkownika
SELECT 
    id,
    name,
    type,
    "group",
    icon,
    "plannedAmount",
    "currentAmount",
    "createdAt"
FROM "Envelope" 
WHERE "userId" = 'YOUR_USER_ID_HERE'
ORDER BY type, name;

-- 2. Sprawdź koperty miesięczne z grupami
SELECT 
    name,
    type,
    "group",
    "plannedAmount"
FROM "Envelope" 
WHERE "userId" = 'YOUR_USER_ID_HERE' 
  AND type = 'monthly'
ORDER BY name;

-- 3. Sprawdź koperty roczne z grupami  
SELECT 
    name,
    type,
    "group",
    "plannedAmount"
FROM "Envelope" 
WHERE "userId" = 'YOUR_USER_ID_HERE' 
  AND type = 'yearly'
ORDER BY name;

-- 4. Sprawdź koperty bez grupy (problem!)
SELECT 
    name,
    type,
    "group",
    "plannedAmount"
FROM "Envelope" 
WHERE "userId" = 'YOUR_USER_ID_HERE' 
  AND "group" IS NULL
ORDER BY name;

-- 5. Sprawdź koperty z grupami
SELECT 
    name,
    type,
    "group",
    "plannedAmount"
FROM "Envelope" 
WHERE "userId" = 'YOUR_USER_ID_HERE' 
  AND "group" IS NOT NULL
ORDER BY "group", name;

-- 6. Sprawdź ile kopert ma każda grupa
SELECT 
    "group",
    type,
    COUNT(*) as count
FROM "Envelope" 
WHERE "userId" = 'YOUR_USER_ID_HERE'
GROUP BY "group", type
ORDER BY "group", type;

-- 7. Sprawdź czy użytkownik ma koperty w ogóle
SELECT 
    COUNT(*) as total_envelopes,
    COUNT(CASE WHEN type = 'monthly' THEN 1 END) as monthly_count,
    COUNT(CASE WHEN type = 'yearly' THEN 1 END) as yearly_count,
    COUNT(CASE WHEN group IS NOT NULL THEN 1 END) as with_group_count,
    COUNT(CASE WHEN group IS NULL THEN 1 END) as without_group_count
FROM "Envelope" 
WHERE "userId" = 'YOUR_USER_ID_HERE';

-- 8. Sprawdź konfigurację użytkownika
SELECT 
    "defaultSalary",
    "defaultToJoint", 
    "defaultToSavings",
    "defaultToVacation",
    "defaultToWedding",
    "defaultToGroceries",
    "defaultToInvestment"
FROM "UserConfig" 
WHERE "userId" = 'YOUR_USER_ID_HERE';
