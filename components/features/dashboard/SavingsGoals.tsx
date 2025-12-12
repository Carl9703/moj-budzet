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
        <div className="bg-theme-secondary card rounded-lg p-6" style={{
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-primary)'
        }}>
            <h3 className="section-header" style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
                🎯 Cele oszczędnościowe
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {goals.map(goal => {
                    const progress = Math.min(Math.round((goal.current / goal.target) * 100), 100)
                    const monthsLeft = Math.ceil(Math.max(goal.target - goal.current, 0) / goal.monthlyContribution)
                    const isCompleted = goal.current >= goal.target

                    return (
                        <div key={goal.id} className="savings-goal-card" style={{
                            border: '1px solid var(--border-primary)',
                            borderRadius: '8px',
                            padding: '16px',
                            backgroundColor: isCompleted ? 'var(--bg-tertiary)' : 'var(--bg-secondary)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h4 className="text-theme-primary" style={{ fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '20px' }}>{goal.icon}</span>
                                    {goal.name}
                                </h4>
                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-success)' }}>
                                    {progress}%{isCompleted && ' ✓'}
                                </span>
                            </div>

                            <div className="savings-goal-progress" style={{ width: '100%', backgroundColor: 'var(--bg-tertiary)', borderRadius: '9999px', height: '10px', marginBottom: '12px' }}>
                                <div className="savings-goal-fill" style={{
                                    width: `${progress}%`,
                                    backgroundColor: isCompleted ? 'var(--accent-success)' : 'var(--accent-primary)',
                                    height: '100%',
                                    borderRadius: '9999px',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>

                            <div className="text-theme-secondary" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                                <span>{goal.current.toLocaleString()} / {goal.target.toLocaleString()} zł</span>
                                {!isCompleted && (
                                    <span>{monthsLeft === 1 ? '1 miesiąc' : monthsLeft < 5 ? `${monthsLeft} miesiące` : `${monthsLeft} miesięcy`}</span>
                                )}
                                {isCompleted && (
                                    <span style={{ color: 'var(--accent-success)', fontWeight: '600' }}>Cel osiągnięty! 🎉</span>
                                )}
                            </div>

                            <div className="text-theme-tertiary" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '12px',
                                backgroundColor: 'var(--bg-tertiary)',
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
                                    backgroundColor: 'var(--bg-success)',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    color: 'var(--accent-success)',
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