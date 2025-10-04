export function roundToCents(amount: number): number {
    return Math.round(amount * 100) / 100
}

export function formatMoney(amount: number, showCurrency: boolean = true): string {
    const rounded = roundToCents(amount)
    const formatted = rounded.toFixed(2).replace('.', ',')
    return showCurrency ? `${formatted} zł` : formatted
}

export function formatMoneyShort(amount: number, showCurrency: boolean = true): string {
    const rounded = roundToCents(amount)
    const formatted = rounded % 1 === 0
        ? rounded.toString().replace('.', ',')
        : rounded.toFixed(2).replace('.', ',')
    return showCurrency ? `${formatted} zł` : formatted
}

export function formatMoneyWithSeparators(amount: number, showCurrency: boolean = true): string {
    const rounded = roundToCents(amount)
    const formatted = rounded.toLocaleString('pl-PL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
    return showCurrency ? `${formatted} zł` : formatted
}