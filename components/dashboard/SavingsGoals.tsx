'use client'

interface SavingsGoal {
    id: string
    name: string
    current: number
    target: number
    monthlyContribution: number
    icon: string
}

interface Props {
    goals: SavingsGoal[]
}

export function SavingsGoals({ goals }: Props) {
    return (
        <div className="bg-white rounded-lg p-6" style={{
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
            border: '1px solid #f3f4f6'
        }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
                🎯 Cele oszczędnościowe
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {goals.map(goal => {
                    const progress = Math.min(Math.round((goal.current / goal.target) * 100), 100)
                    const monthsLeft = Math.ceil(Math.max(goal.target - goal.current, 0) / goal.monthlyContribution)
                    const isCompleted = goal.current >= goal.target

                    return (
                        <div key={goal.id} style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '16px',
                            backgroundColor: isCompleted ? '#f0fdf4' : '#ffffff'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h4 style={{ fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '20px' }}>{goal.icon}</span>
                                    {goal.name}
                                </h4>
                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: isCompleted ? '#10b981' : '#059669' }}>
                                    {progress}%{isCompleted && ' ✓'}
                                </span>
                            </div>

                            <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '10px', marginBottom: '12px' }}>
                                <div style={{
                                    width: `${progress}%`,
                                    backgroundColor: isCompleted ? '#10b981' : '#3b82f6',
                                    height: '100%',
                                    borderRadius: '9999px',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                                <span>{goal.current.toLocaleString()} / {goal.target.toLocaleString()} zł</span>
                                {!isCompleted && (
                                    <span>{monthsLeft === 1 ? '1 miesiąc' : monthsLeft < 5 ? `${monthsLeft} miesiące` : `${monthsLeft} miesięcy`}</span>
                                )}
                                {isCompleted && (
                                    <span style={{ color: '#10b981', fontWeight: '600' }}>Cel osiągnięty! 🎉</span>
                                )}
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '12px',
                                color: '#9ca3af',
                                backgroundColor: '#f9fafb',
                                padding: '8px',
                                borderRadius: '4px'
                            }}>
                                <span>💳 Miesięczna wpłata: <strong>{goal.monthlyContribution.toLocaleString()} zł</strong></span>
                                {!isCompleted && (
                                    <span>Brakuje: <strong>{Math.max(goal.target - goal.current, 0).toLocaleString()} zł</strong></span>
                                )}
                            </div>

                            {isCompleted && goal.current > goal.target && (
                                <div style={{
                                    marginTop: '8px',
                                    padding: '6px 8px',
                                    backgroundColor: '#d1fae5',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    color: '#065f46',
                                    textAlign: 'center'
                                }}>
                                    💰 Nadwyżka: {(goal.current - goal.target).toLocaleString()} zł
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}