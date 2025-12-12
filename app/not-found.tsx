import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 text-center">
            <div className="text-6xl mb-6">🔍</div>
            <h1 className="text-3xl font-bold text-slate-100 mb-3">
                404 - Nie znaleziono strony
            </h1>
            <p className="text-base text-slate-400 mb-8 max-w-md">
                Strona, której szukasz, nie istnieje lub została przeniesiona.
            </p>
            <Link
                href="/"
                className="py-3 px-6 bg-indigo-600 text-white rounded-lg text-base font-semibold shadow-lg hover:bg-indigo-700 transition-colors"
            >
                🏠 Wróć na stronę główną
            </Link>
        </div>
    )
}
