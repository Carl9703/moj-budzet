'use client';

import { DonutChart, Legend } from '@tremor/react';

// Definiujemy typy dla danych wejściowych
interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface SpendingBreakdownChartProps {
  data: ChartData[];
  onEnvelopeSelect?: (envelopeName: string) => void;
  selectedEnvelope?: string;
  loading?: boolean;
}

// Funkcja do formatowania waluty w tooltipie
const valueFormatter = (number: number) =>
  `${new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(number)}`;

const SpendingBreakdownChart = ({ 
  data, 
  onEnvelopeSelect, 
  selectedEnvelope, 
  loading = false 
}: SpendingBreakdownChartProps) => {
  // Wyciągamy nazwy kategorii dla legendy
  const categories = data.map((item) => item.name);
  // Wyciągamy kolory dla legendy
  const colors = data.map((item) => item.color);

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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            Brak danych do wyświetlenia
          </div>
          <div style={{ fontSize: '14px' }}>
            Dodaj transakcje, aby zobaczyć analizy
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
          📊 Główna Wizualizacja
        </h3>
      </div>

      {/* Wykres Tremor */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        <DonutChart
          data={data}
          category="value"
          index="name"
          valueFormatter={valueFormatter}
          colors={colors}
          className="h-48 w-48"
          showAnimation
          onValueChange={(value) => {
            if (onEnvelopeSelect && value) {
              onEnvelopeSelect(value.name);
            }
          }}
        />
        <Legend 
          categories={categories} 
          colors={colors} 
          className="max-w-xs"
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)'
          }}
        />
      </div>

      <div style={{
        fontSize: '12px',
        color: 'var(--text-secondary)',
        textAlign: 'center',
        marginTop: '16px'
      }}>
        💡 <strong>Wskazówka:</strong> Kliknij na segment wykresu, aby zobaczyć szczegóły w tabeli poniżej.
      </div>
    </div>
  );
};

export default SpendingBreakdownChart;