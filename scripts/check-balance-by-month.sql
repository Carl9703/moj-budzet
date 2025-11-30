-- Skrypt SQL do sprawdzenia salda konta głównego w rozbiciu na miesiące
-- Dla użytkownika: cmgm8hqws00006gcj13vo7jqn (można zmienić)

-- 1. Pobierz wszystkie transakcje od września 2025 (bez zamknięć miesiąca)
WITH transactions_from_september AS (
    SELECT 
        t.id,
        t.type,
        t.amount,
        t.description,
        t.date,
        t."transferPairId",
        t."includeInStats",
        DATE_TRUNC('month', t.date) as month,
        TO_CHAR(t.date, 'YYYY-MM') as month_label
    FROM "Transaction" t
    WHERE t."userId" = 'cmgm8hqws00006gcj13vo7jqn'
        AND t.type IN ('income', 'expense')
        AND t.date >= '2025-09-01'
        AND t.description NOT LIKE '%Zamknięcie miesiąca%'
        AND t.description NOT LIKE '%przeniesienie bilansu%'
),
-- 2. Przychody bez transferPairId (tak jak w aplikacji)
income_by_month AS (
    SELECT 
        month_label,
        month,
        COUNT(*) as transaction_count,
        SUM(amount) as total_income
    FROM transactions_from_september
    WHERE type = 'income'
        AND "transferPairId" IS NULL
        -- NIE filtrujemy po includeInStats - wszystkie przychody są liczone
    GROUP BY month_label, month
),
-- 3. Wydatki bez transferPairId (tak jak w aplikacji)
expenses_by_month AS (
    SELECT 
        month_label,
        month,
        COUNT(*) as transaction_count,
        SUM(amount) as total_expenses
    FROM transactions_from_september
    WHERE type = 'expense'
        AND "transferPairId" IS NULL
        -- NIE filtrujemy po includeInStats - wszystkie wydatki są liczone
    GROUP BY month_label, month
),
-- 4. Saldo dla każdego miesiąca
monthly_balance AS (
    SELECT 
        COALESCE(i.month_label, e.month_label) as month_label,
        COALESCE(i.month, e.month) as month,
        COALESCE(i.total_income, 0) as income,
        COALESCE(e.total_expenses, 0) as expenses,
        COALESCE(i.total_income, 0) - COALESCE(e.total_expenses, 0) as monthly_balance,
        COALESCE(i.transaction_count, 0) as income_count,
        COALESCE(e.transaction_count, 0) as expense_count
    FROM income_by_month i
    FULL OUTER JOIN expenses_by_month e ON i.month_label = e.month_label
),
-- 5. Fundusz Awaryjny
emergency_fund AS (
    SELECT 
        COALESCE("currentAmount", 0) as amount
    FROM "Envelope"
    WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn'
        AND name = 'Fundusz Awaryjny'
    LIMIT 1
),
-- 6. Suma wszystkich przychodów i wydatków
totals AS (
    SELECT 
        SUM(CASE WHEN type = 'income' AND "transferPairId" IS NULL THEN amount ELSE 0 END) as total_income_all,
        SUM(CASE WHEN type = 'expense' AND "transferPairId" IS NULL THEN amount ELSE 0 END) as total_expenses_all
    FROM transactions_from_september
)
-- 7. Wynik: rozbicie na miesiące + suma + fundusz + saldo główne
SELECT * FROM (
    SELECT 
        month_label::text as "Miesiąc",
        income as "Przychody",
        expenses as "Wydatki",
        monthly_balance as "Saldo miesiąca",
        income_count as "Liczba przychodów",
        expense_count as "Liczba wydatków"
    FROM monthly_balance

    UNION ALL

    SELECT 
        '--- SUMA ---'::text as "Miesiąc",
        t.total_income_all as "Przychody",
        t.total_expenses_all as "Wydatki",
        t.total_income_all - t.total_expenses_all as "Saldo miesiąca",
        0 as "Liczba przychodów",
        0 as "Liczba wydatków"
    FROM totals t

    UNION ALL

    SELECT 
        '--- FUNDUSZ AWARYJNY ---'::text as "Miesiąc",
        0 as "Przychody",
        ef.amount as "Wydatki",
        -ef.amount as "Saldo miesiąca",
        0 as "Liczba przychodów",
        0 as "Liczba wydatków"
    FROM emergency_fund ef

    UNION ALL

    SELECT 
        '=== SALDO GŁÓWNE ==='::text as "Miesiąc",
        t.total_income_all as "Przychody",
        t.total_expenses_all + ef.amount as "Wydatki",
        t.total_income_all - t.total_expenses_all - ef.amount as "Saldo miesiąca",
        0 as "Liczba przychodów",
        0 as "Liczba wydatków"
    FROM totals t
    CROSS JOIN emergency_fund ef
) AS all_results
ORDER BY 
    CASE 
        WHEN "Miesiąc" = '=== SALDO GŁÓWNE ===' THEN 999
        WHEN "Miesiąc" = '--- FUNDUSZ AWARYJNY ---' THEN 998
        WHEN "Miesiąc" = '--- SUMA ---' THEN 997
        ELSE 0
    END,
    "Miesiąc";
