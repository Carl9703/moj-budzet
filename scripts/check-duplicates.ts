
import { EXPENSE_CATEGORIES } from '@/lib/constants/categories'

const names = EXPENSE_CATEGORIES.map(c => c.name)
const duplicates = names.filter((item, index) => names.indexOf(item) !== index)

if (duplicates.length > 0) {
    console.log('Znaleziono duplikaty:', Array.from(new Set(duplicates)))
} else {
    console.log('Brak duplikatów w nazwach kategorii.')
}
