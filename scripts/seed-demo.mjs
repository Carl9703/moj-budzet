// Seed script — adds realistic transactions for the demo user
const BASE = 'http://localhost:3000'

async function main() {
    // 1. Login as demo
    const loginRes = await fetch(`${BASE}/api/auth/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    })
    const { token } = await loginRes.json()
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    console.log('✅ Logged in')

    // 2. Get dashboard data to find envelope IDs
    const dashRes = await fetch(`${BASE}/api/dashboard`, { headers })
    const dash = await dashRes.json()

    const monthly = dash.monthlyEnvelopes || []
    const yearly = dash.yearlyEnvelopes || []
    const all = [...monthly, ...yearly]

    console.log(`📦 Found ${all.length} envelopes:`)
    all.forEach(e => console.log(`   ${e.name} (${e.id})`))

    const find = (name) => all.find(e => e.name.toLowerCase().includes(name.toLowerCase()))

    // 3. Add income first (salary)
    const incomeData = {
        type: 'income',
        amount: 8500,
        description: 'Wypłata — Luty 2026',
        date: '2026-02-01',
        category: 'Wynagrodzenie'
    }
    await fetch(`${BASE}/api/transactions`, { method: 'POST', headers, body: JSON.stringify(incomeData) })
    console.log('💰 Added salary: 8500 zł')

    // Bonus income
    await fetch(`${BASE}/api/transactions`, {
        method: 'POST', headers,
        body: JSON.stringify({ type: 'income', amount: 1200, description: 'Freelance — projekt graficzny', date: '2026-02-05', category: 'Inne' })
    })
    console.log('💰 Added freelance income: 1200 zł')

    // 4. Add expenses across different envelopes
    const expenses = [
        { envelope: 'żywność', amount: 342.50, desc: 'Biedronka — zakupy tygodniowe', date: '2026-02-03' },
        { envelope: 'żywność', amount: 187.30, desc: 'Lidl — zakupy', date: '2026-02-08' },
        { envelope: 'żywność', amount: 95.00, desc: 'Piekarnia + warzywniak', date: '2026-02-12' },
        { envelope: 'żywność', amount: 263.40, desc: 'Auchan — zakupy rodzinne', date: '2026-02-15' },

        { envelope: 'mieszkanie', amount: 1500.00, desc: 'Czynsz — luty', date: '2026-02-01' },

        { envelope: 'rachunki', amount: 89.99, desc: 'Internet + TV', date: '2026-02-02' },
        { envelope: 'rachunki', amount: 45.00, desc: 'Spotify + Netflix', date: '2026-02-02' },

        { envelope: 'transport', amount: 150.00, desc: 'Paliwo — Orlen', date: '2026-02-04' },
        { envelope: 'transport', amount: 85.00, desc: 'Paliwo — BP', date: '2026-02-11' },
        { envelope: 'transport', amount: 42.00, desc: 'Myjnia + płyn do spryskiwaczy', date: '2026-02-09' },

        { envelope: 'zdrowie', amount: 120.00, desc: 'Wizyta lekarska', date: '2026-02-06' },
        { envelope: 'zdrowie', amount: 67.50, desc: 'Apteka — leki', date: '2026-02-07' },

        { envelope: 'gastronomia', amount: 85.00, desc: 'Restauracja — kolacja', date: '2026-02-08' },
        { envelope: 'gastronomia', amount: 42.00, desc: 'Pizza na wynos', date: '2026-02-13' },
        { envelope: 'gastronomia', amount: 35.00, desc: 'Kawiarnia — przerwa', date: '2026-02-15' },

        { envelope: 'ubrania', amount: 189.00, desc: 'Zara — koszula + spodnie', date: '2026-02-10' },

        { envelope: 'wydatki osobiste', amount: 299.00, desc: 'Słuchawki Sony', date: '2026-02-07' },
        { envelope: 'wydatki osobiste', amount: 79.99, desc: 'Książki — Empik', date: '2026-02-14' },
        { envelope: 'wydatki osobiste', amount: 150.00, desc: 'Fryzjer + kosmetyki', date: '2026-02-12' },
    ]

    let expenseCount = 0
    for (const exp of expenses) {
        const envelope = find(exp.envelope)
        if (!envelope) {
            console.log(`⚠️ Envelope not found: ${exp.envelope}`)
            continue
        }
        await fetch(`${BASE}/api/transactions`, {
            method: 'POST', headers,
            body: JSON.stringify({
                type: 'expense',
                amount: exp.amount,
                description: exp.desc,
                date: exp.date,
                envelopeId: envelope.id,
                category: exp.desc.split(' — ')[0] || exp.desc
            })
        })
        expenseCount++
    }
    console.log(`💸 Added ${expenseCount} expenses`)

    // 5. Add transfers to savings/goals
    const transfers = [
        { envelope: 'wesele', amount: 500, desc: 'Oszczędności na wesele' },
        { envelope: 'podróże', amount: 300, desc: 'Fundusz podróżniczy' },
        { envelope: 'auto', amount: 200, desc: 'Fundusz serwisowy auto' },
        { envelope: 'wolne środki', amount: 1500, desc: 'Wolne środki z wypłaty' },
        { envelope: 'budowanie', amount: 400, desc: 'PPK + oszczędności' },
    ]

    let transferCount = 0
    for (const tr of transfers) {
        const envelope = find(tr.envelope)
        if (!envelope) {
            console.log(`⚠️ Goal envelope not found: ${tr.envelope}`)
            continue
        }
        await fetch(`${BASE}/api/transactions`, {
            method: 'POST', headers,
            body: JSON.stringify({
                type: 'income',
                amount: tr.amount,
                description: tr.desc,
                date: '2026-02-01',
                envelopeId: envelope.id,
                category: 'Transfer'
            })
        })
        transferCount++
    }
    console.log(`↗️ Added ${transferCount} transfers to goals/savings`)

    // 6. Verify
    const dashAfter = await fetch(`${BASE}/api/dashboard`, { headers })
    const after = await dashAfter.json()
    console.log(`\n📊 Dashboard after seeding:`)
    console.log(`   Balance: ${after.balance} zł`)
    console.log(`   Income: ${after.totalIncome} zł`)
    console.log(`   Expenses: ${after.totalExpenses} zł`)
    console.log(`\n✅ Done! Refresh the dashboard to see the data.`)
}

main().catch(console.error)
