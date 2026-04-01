import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import jwt from 'jsonwebtoken'
import { env } from '@/lib/env'
import { EXPENSE_CATEGORIES } from '@/lib/constants/categories'
import { rateLimit } from '@/lib/middleware/rateLimit'

const JWT_SECRET = env.JWT_SECRET

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
        const limitResult = rateLimit(ip, { limit: 5, windowMs: 60 * 60 * 1000 }) // 5 requests per hour
        if (!limitResult.success) {
            return NextResponse.json(
                { error: 'Zbyt wiele prób. Spróbuj ponownie później.' },
                { status: 429 }
            )
        }

        const demoEmail = 'demo@example.com'
        const demoName = 'Użytkownik Demo'

        // 1. Find or Create User
        let user = await prisma.user.findUnique({
            where: { email: demoEmail }
        })

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: demoEmail,
                    name: demoName,
                    role: 'USER',
                    isActive: true,
                }
            })
        }

        // 2. Clean up ALL existing data for this user to ensure fresh state
        await prisma.transaction.deleteMany({ where: { userId: user.id } })
        await prisma.recurringPayment.deleteMany({ where: { userId: user.id } })
        await prisma.investmentAsset.deleteMany({ where: { userId: user.id } })
        await prisma.envelope.deleteMany({ where: { userId: user.id } })
        await prisma.userConfig.deleteMany({ where: { userId: user.id } })
        await prisma.category.deleteMany({ where: { userId: user.id } })

        // 3. Seed Fresh Data

        // Config
        await prisma.userConfig.create({
            data: {
                userId: user.id,
                defaultSalary: 8500,
                bonusDistribution: '50-30-20'
            }
        })

        // ========== KOPERTY ==========

        // --- POTRZEBY (needs) ---
        const zywnosc = await prisma.envelope.create({
            data: { userId: user.id, name: 'Żywność', type: 'monthly', plannedAmount: 1000, currentAmount: 425.84, icon: '🛒', group: 'needs' }
        })
        const transport = await prisma.envelope.create({
            data: { userId: user.id, name: 'Transport', type: 'monthly', plannedAmount: 300, currentAmount: 117.49, icon: '🚗', group: 'needs' }
        })
        const rachunki = await prisma.envelope.create({
            data: { userId: user.id, name: 'Rachunki i Subskrypcje', type: 'monthly', plannedAmount: 100, currentAmount: 68.01, icon: '🧾', group: 'needs' }
        })
        const zdrowie = await prisma.envelope.create({
            data: { userId: user.id, name: 'Zdrowie i Higiena', type: 'monthly', plannedAmount: 150, currentAmount: 26.33, icon: '💊', group: 'needs' }
        })
        const mieszkanie = await prisma.envelope.create({
            data: { userId: user.id, name: 'Mieszkanie', type: 'monthly', plannedAmount: 900, currentAmount: 0, icon: '🏠', group: 'needs' }
        })

        // --- STYL ŻYCIA (lifestyle) ---
        const gastronomia = await prisma.envelope.create({
            data: { userId: user.id, name: 'Gastronomia', type: 'monthly', plannedAmount: 200, currentAmount: 126.03, icon: '🍕', group: 'lifestyle' }
        })
        const ubrania = await prisma.envelope.create({
            data: { userId: user.id, name: 'Ubrania i Akcesoria', type: 'monthly', plannedAmount: 150, currentAmount: 150, icon: '👕', group: 'lifestyle' }
        })
        const osobiste = await prisma.envelope.create({
            data: { userId: user.id, name: 'Wydatki Osobiste', type: 'monthly', plannedAmount: 500, currentAmount: 500, icon: '🎯', group: 'lifestyle' }
        })

        // --- CELE I MAJĄTEK (assets/goals) ---
        const budowanie = await prisma.envelope.create({
            data: { userId: user.id, name: 'Budowanie Przyszłości', type: 'yearly', plannedAmount: 600, currentAmount: 1105.05, icon: '📈', group: 'assets', envelopeType: 'savings', isAccumulating: true }
        })
        const auto = await prisma.envelope.create({
            data: { userId: user.id, name: 'Auto: Serwis i Ubezpieczenie', type: 'yearly', plannedAmount: 2000, currentAmount: 362, icon: '🚘', group: 'goals', envelopeType: 'goal' }
        })
        const podroze = await prisma.envelope.create({
            data: { userId: user.id, name: 'Podróże', type: 'yearly', plannedAmount: 5000, currentAmount: 25.49, icon: '✈️', group: 'goals', envelopeType: 'goal' }
        })
        const prezenty = await prisma.envelope.create({
            data: { userId: user.id, name: 'Prezenty i Okazje', type: 'yearly', plannedAmount: 1500, currentAmount: 639.38, icon: '🎁', group: 'goals', envelopeType: 'goal' }
        })
        const wesele = await prisma.envelope.create({
            data: { userId: user.id, name: 'Wesele', type: 'yearly', plannedAmount: 24000, currentAmount: 6000, icon: '💍', group: 'goals', envelopeType: 'goal' }
        })

        // Fundusz Awaryjny
        await prisma.envelope.create({
            data: { userId: user.id, name: 'Fundusz Awaryjny', type: 'monthly', plannedAmount: 1000, currentAmount: 15000, icon: '🚨', group: 'assets', isAccumulating: true, envelopeType: 'emergency' }
        })

        // Wolne Środki
        const wolneSrodki = await prisma.envelope.create({
            data: { userId: user.id, name: 'Wolne Środki', type: 'monthly', plannedAmount: 0, currentAmount: 1250.50, icon: '💸', group: 'needs' }
        })

        // Wolne Środki (roczne)
        await prisma.envelope.create({
            data: { userId: user.id, name: 'Wolne środki (roczne)', type: 'yearly', plannedAmount: 0, currentAmount: 450, icon: '💰', group: 'goals', envelopeType: 'goal' }
        })

        // ========== KATEGORIE ==========
        // Seed categories from the constants file
        const uniqueCategories = EXPENSE_CATEGORIES.filter((c, index, self) =>
            index === self.findIndex((t) => t.name === c.name)
        )
        await prisma.category.createMany({
            data: uniqueCategories.map(c => ({
                userId: user.id,
                name: c.name,
                icon: c.icon,
                type: c.type,
                defaultEnvelope: c.defaultEnvelope || null
            }))
        })

        // ========== TRANSAKCJE ==========
        const today = new Date()
        const daysAgo = (d: number, hour: number = 12, minute: number = 0) => {
            const date = new Date(today.getTime() - d * 24 * 60 * 60 * 1000)
            date.setHours(hour, minute, 0, 0)
            return date
        }

        // --- HISTORYCZNE PRZYCHODY I WYDATKI (Sep 2025 – Jan 2026) ---
        // Potrzebne żeby uzasadnić nagromadzone oszczędności w kopertach
        const historicalMonths = [
            { year: 2025, month: 8 },  // Wrzesień 2025
            { year: 2025, month: 9 },  // Październik 2025
            { year: 2025, month: 10 }, // Listopad 2025
            { year: 2025, month: 11 }, // Grudzień 2025
            { year: 2026, month: 0 },  // Styczeń 2026
        ]

        for (const { year, month } of historicalMonths) {
            // Przychód
            await prisma.transaction.create({
                data: {
                    userId: user.id, type: 'income', amount: 8500,
                    description: 'Wynagrodzenie',
                    date: new Date(year, month, 1, 8, 0),
                    includeInStats: true
                }
            })
            // Wydatki historyczne z kopertami i kategoriami
            await prisma.transaction.create({
                data: { userId: user.id, type: 'expense', amount: 900, description: 'Czynsz + media', date: new Date(year, month, 5, 10, 30), envelopeId: mieszkanie.id, category: 'housing-bills', includeInStats: true }
            })
            await prisma.transaction.create({
                data: { userId: user.id, type: 'expense', amount: 1000, description: 'Zakupy spożywcze', date: new Date(year, month, 10, 17, 45), envelopeId: zywnosc.id, category: 'shared-groceries', includeInStats: true }
            })
            await prisma.transaction.create({
                data: { userId: user.id, type: 'expense', amount: 300, description: 'Paliwo i transport', date: new Date(year, month, 12, 14, 20), envelopeId: transport.id, category: 'fuel', includeInStats: true }
            })
            await prisma.transaction.create({
                data: { userId: user.id, type: 'expense', amount: 150, description: 'Zdrowie i higiena', date: new Date(year, month, 15, 11, 0), envelopeId: zdrowie.id, category: 'healthcare', includeInStats: true }
            })
            await prisma.transaction.create({
                data: { userId: user.id, type: 'expense', amount: 100, description: 'Subskrypcje i rachunki', date: new Date(year, month, 7, 9, 15), envelopeId: rachunki.id, category: 'subscriptions', includeInStats: true }
            })
            await prisma.transaction.create({
                data: { userId: user.id, type: 'expense', amount: 200, description: 'Gastronomia', date: new Date(year, month, 18, 19, 30), envelopeId: gastronomia.id, category: 'restaurants', includeInStats: true }
            })
            await prisma.transaction.create({
                data: { userId: user.id, type: 'expense', amount: 150, description: 'Ubrania', date: new Date(year, month, 20, 15, 0), envelopeId: ubrania.id, category: 'clothes', includeInStats: true }
            })
            await prisma.transaction.create({
                data: { userId: user.id, type: 'expense', amount: 500, description: 'Wydatki osobiste', date: new Date(year, month, 22, 16, 45), envelopeId: osobiste.id, category: 'hobby', includeInStats: true }
            })
        }
        // Historyczne: 5 × 8500 = 42500 income, 5 × 3300 = 16500 expenses → net +26000

        // Premia grudniowa (uzasadnia duże przelewy na Wesele i FA)
        await prisma.transaction.create({
            data: {
                userId: user.id, type: 'income', amount: 5000,
                description: 'Premia roczna',
                date: new Date(2025, 11, 20, 9, 0),
                includeInStats: true
            }
        })

        // --- BIEŻĄCY MIESIĄC (Luty 2026) ---
        // Przychód
        await prisma.transaction.create({
            data: {
                userId: user.id,
                type: 'income',
                amount: 8500,
                description: 'Wynagrodzenie',
                date: new Date(today.getFullYear(), today.getMonth(), 1, 8, 0),
                includeInStats: true
            }
        })

        // --- ŻYWNOŚĆ ---
        await prisma.transaction.create({
            data: { userId: user.id, type: 'expense', amount: 287.32, description: 'Biedronka — zakupy tygodniowe', date: daysAgo(3, 17, 23), envelopeId: zywnosc.id, category: 'shared-groceries', includeInStats: true }
        })
        await prisma.transaction.create({
            data: { userId: user.id, type: 'expense', amount: 156.40, description: 'Lidl — mięso i warzywa', date: daysAgo(8, 13, 45), envelopeId: zywnosc.id, category: 'shared-groceries', includeInStats: true }
        })
        await prisma.transaction.create({
            data: { userId: user.id, type: 'expense', amount: 130.44, description: 'Żabka — zakupy drobne', date: daysAgo(14, 18, 10), envelopeId: zywnosc.id, category: 'personal-groceries', includeInStats: true }
        })

        // --- TRANSPORT ---
        await prisma.transaction.create({
            data: { userId: user.id, type: 'expense', amount: 142.51, description: 'Orlen — paliwo', date: daysAgo(5, 14, 30), envelopeId: transport.id, category: 'fuel', includeInStats: true }
        })
        await prisma.transaction.create({
            data: { userId: user.id, type: 'expense', amount: 40.00, description: 'Bilet miesięczny ZTM', date: daysAgo(20, 9, 15), envelopeId: transport.id, category: 'public-transport', includeInStats: true }
        })

        // --- RACHUNKI I SUBSKRYPCJE ---
        await prisma.transaction.create({
            data: { userId: user.id, type: 'expense', amount: 12.99, description: 'Netflix', date: daysAgo(7, 10, 0), envelopeId: rachunki.id, category: 'subscriptions', includeInStats: true }
        })
        await prisma.transaction.create({
            data: { userId: user.id, type: 'expense', amount: 19.00, description: 'Spotify + YouTube Premium', date: daysAgo(7, 10, 5), envelopeId: rachunki.id, category: 'subscriptions', includeInStats: true }
        })

        // --- ZDROWIE I HIGIENA ---
        await prisma.transaction.create({
            data: { userId: user.id, type: 'expense', amount: 89.50, description: 'Apteka — leki', date: daysAgo(11, 16, 20), envelopeId: zdrowie.id, category: 'healthcare', includeInStats: true }
        })
        await prisma.transaction.create({
            data: { userId: user.id, type: 'expense', amount: 34.17, description: 'Rossmann — drogeria', date: daysAgo(4, 12, 40), envelopeId: zdrowie.id, category: 'drugstore', includeInStats: true }
        })

        // --- MIESZKANIE ---
        await prisma.transaction.create({
            data: { userId: user.id, type: 'expense', amount: 900, description: 'Czynsz + media', date: new Date(today.getFullYear(), today.getMonth(), 5, 10, 0), envelopeId: mieszkanie.id, category: 'housing-bills', includeInStats: true }
        })

        // --- GASTRONOMIA ---
        await prisma.transaction.create({
            data: { userId: user.id, type: 'expense', amount: 48.00, description: 'Pizza Hut — obiad', date: daysAgo(2, 19, 15), envelopeId: gastronomia.id, category: 'restaurants', includeInStats: true }
        })
        await prisma.transaction.create({
            data: { userId: user.id, type: 'expense', amount: 25.97, description: 'Lunch w pracy × 2', date: daysAgo(6, 13, 10), envelopeId: gastronomia.id, category: 'work-lunch', includeInStats: true }
        })

        // ========== INWESTYCJE ==========
        await prisma.investmentAsset.create({
            data: { userId: user.id, symbol: 'BTC', quantity: 0.25, averagePurchasePrice: 45000, type: 'CRYPTO', currency: 'USD' }
        })
        await prisma.investmentAsset.create({
            data: { userId: user.id, symbol: 'AAPL', quantity: 15, averagePurchasePrice: 180, type: 'STOCK', currency: 'USD' }
        })
        await prisma.investmentAsset.create({
            data: { userId: user.id, symbol: 'WIG20', quantity: 100, averagePurchasePrice: 2200, type: 'STOCK', currency: 'PLN' }
        })

        // ========== JWT TOKEN ==========
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        )

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        })

    } catch (error) {
        console.error('Demo auth error:', error)
        return NextResponse.json(
            { error: 'Błąd podczas tworzenia konta demo' },
            { status: 500 }
        )
    }
}
