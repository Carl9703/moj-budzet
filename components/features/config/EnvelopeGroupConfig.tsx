'use client'

interface Envelope {
    id: string
    name: string
    icon: string | null
    plannedAmount: number
    currentAmount: number
    group?: string
}

interface Props {
    title: string
    icon: string
    color: string
    envelopes: Envelope[]
    onEnvelopeChange: (envelopeId: string, plannedAmount: number) => void
}

export function EnvelopeGroupConfig({ title, icon, color, envelopes, onEnvelopeChange }: Props) {
    if (envelopes.length === 0) return null

    return (
        <div className="rounded-3xl p-6 border border-white/5 bg-zinc-900/50 backdrop-blur-xl shadow-xl space-y-6" style={{ marginBottom: '24px' }}>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-950/50 border border-white/5 shadow-inner">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-zinc-900 shadow-inner" style={{ color: color }}>
                    {icon}
                </div>
                <div>
                    <h2 className="text-lg font-black text-white tracking-tight uppercase tracking-widest leading-none mb-1">
                        {title}
                    </h2>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{envelopes.length} {envelopes.length === 1 ? 'Koperta' : 'Koperty'}</p>
                </div>
            </div>
            <div className="space-y-3">
                {envelopes.map((e) => (
                    <div key={e.id} className="grid grid-cols-[1fr_auto] gap-4 items-center p-3 rounded-2xl bg-white/5 hover:bg-white/[0.08] transition-all border border-white/5 group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                                {e.icon || '📦'}
                            </div>
                            <span className="font-bold text-zinc-200 text-sm tracking-tight">{e.name}</span>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                inputMode="numeric"
                                value={e.plannedAmount}
                                onChange={(ev) => {
                                    const v = Number((ev.target as HTMLInputElement).value || 0)
                                    onEnvelopeChange(e.id, v)
                                }}
                                className="w-[140px] text-right p-3 pr-10 rounded-xl bg-zinc-950/50 border border-white/10 text-white font-black hover:border-amber-500/50 focus:border-amber-500 transition-all outline-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-600 uppercase">PLN</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
