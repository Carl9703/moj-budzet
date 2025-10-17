'use client';

import { LineChart } from '@tremor/react';

interface TrendData {
  period: string;
  totalExpenses: number;
  income?: number;
  balance?: number;
  [key: string]: any; // Allow dynamic envelope keys
}

interface TrendsChartProps {
  data: TrendData[];
  selectedEnvelope?: string;
  chartType?: 'line' | 'bar';
  loading?: boolean;
  onPeriodClick?: (period: string) => void;
}

const TrendsChart = ({ 
  data, 
  selectedEnvelope, 
  chartType = 'line',
  loading = false,
  onPeriodClick 
}: TrendsChartProps) => {
  // Formatowanie okresu na czytelny format
  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const monthNames = [
      'Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze',
      'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year.slice(-2)}`;
  };

  // Formatowanie waluty
  const valueFormatter = (number: number) =>
    `${new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(number)}`;

  // Przygotowanie danych dla wykresu
  const chartData = data.map(item => ({
    period: formatPeriod(item.period),
    wydatki: selectedEnvelope ? item[selectedEnvelope] || 0 : item.totalExpenses
  }));

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '50%',
          animation: 'pulse 2s infinite'
        }} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            Brak danych trendów
          </div>
          <div style={{ fontSize: '14px' }}>
            Dodaj transakcje z różnych okresów, aby zobaczyć trendy
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid var(--border-primary)',
      boxShadow: 'var(--shadow-md)',
      marginBottom: '24px'
    }}>
      {/* Nagłówek */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: '0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📈 Analiza Trendów
        </h3>
      </div>

      {/* Wykres Tremor */}
      <div style={{ width: '100%', height: '400px' }}>
        <LineChart
          data={chartData}
          index="period"
          categories={['wydatki']}
          colors={[selectedEnvelope ? 'blue' : 'red']}
          valueFormatter={valueFormatter}
          className="h-full w-full"
          showAnimation
          onValueChange={(value) => {
            if (onPeriodClick && value) {
              // Znajdź oryginalny okres na podstawie sformatowanego
              const originalPeriod = data.find(item => formatPeriod(item.period) === value.period)?.period;
              if (originalPeriod) {
                onPeriodClick(originalPeriod);
              }
            }
          }}
        />
      </div>

      {selectedEnvelope && (
        <div style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginTop: '16px',
          padding: '8px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '8px',
          border: '1px solid var(--border-primary)'
        }}>
          💡 <strong>Wskazówka:</strong> Ten wykres pokazuje trendy wydatków dla wybranej koperty "{selectedEnvelope}". 
          Kliknij na wykres kołowy powyżej, aby zmienić kopertę lub wróć do widoku wszystkich wydatków.
        </div>
      )}
    </div>
  );
};

export default TrendsChart;