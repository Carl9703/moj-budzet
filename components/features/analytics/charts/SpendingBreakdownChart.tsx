'use client';

import { DonutChart, Legend } from '@tremor/react';
import { EmptyState } from '@/components/shared/ui/EmptyState';
import { PieChart } from 'lucide-react';

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
  // Wyciągamy kolory z danych, aby przekazać je do wykresu
  const chartColors = data.map((item) => item.color);
  // Wyciągamy nazwy kategorii dla legendy
  const categories = data.map((item) => item.name);

  if (loading) {
    return (
      <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/30 shadow-md mb-6 flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 bg-slate-700 rounded-full animate-pulse" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Brak danych do wizualizacji"
        description="Dodaj transakcje, aby zobaczyć szczegółową analizę wydatków."
        icon={PieChart}
        className="mb-6"
      />
    );
  }

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/30 shadow-md mb-6 hover:border-slate-600/50 transition-colors">
      {/* Nagłówek */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 m-0">
          📊 Główna Wizualizacja
        </h3>
      </div>

      {/* Wykres Tremor */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 min-h-[360px]">
        <div className="flex-1 flex justify-center min-w-[280px]">
          <DonutChart
            data={data}
            category="value"
            index="name"
            valueFormatter={valueFormatter}
            colors={chartColors}
            className="h-80 w-80"
            showAnimation
            variant="donut"
            onValueChange={(value) => {
              if (onEnvelopeSelect && value) {
                onEnvelopeSelect(value.name);
              }
            }}
          />
        </div>
        <div className="flex-1 min-w-[240px] w-full max-h-[320px] overflow-y-auto no-scrollbar pr-2">
          <Legend
            categories={categories}
            colors={chartColors}
            className="max-w-full"
          />
        </div>
      </div>

      <div className="text-xs text-slate-400 text-center mt-6 pt-4 border-t border-slate-700/30">
        💡 <strong>Wskazówka:</strong> Kliknij na segment wykresu, aby zobaczyć szczegóły w tabeli poniżej.
      </div>
    </div>
  );
};

export default SpendingBreakdownChart;
