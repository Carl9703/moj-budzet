'use client';

import { LineChart } from '@tremor/react';
import { ANALYTICS_COLORS } from '@/lib/constants/colors';
import { EmptyState } from '@/components/shared/ui/EmptyState';
import { TrendingUp } from 'lucide-react';

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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number)}`;

  // Przygotowanie danych dla wykresu
  const chartData = data.map(item => ({
    period: formatPeriod(item.period),
    wydatki: selectedEnvelope ? item[selectedEnvelope] || 0 : item.totalExpenses
  }));

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
        title="Brak danych trendów"
        description="Dodaj transakcje z różnych okresów, aby zobaczyć trendy."
        icon={TrendingUp}
        className="mb-6"
      />
    );
  }

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/30 shadow-md mb-6 hover:border-slate-600/50 transition-colors">
      {/* Nagłówek */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 m-0">
          📈 Analiza Trendów
        </h3>
      </div>

      {/* Wykres Tremor */}
      <div className="w-full h-96 pl-2 tabular-nums">
        <LineChart
          data={chartData}
          index="period"
          categories={['wydatki']}
          colors={[selectedEnvelope ? ANALYTICS_COLORS[0] : ANALYTICS_COLORS[1]]}
          valueFormatter={valueFormatter}
          className="h-full w-full"
          showAnimation
          yAxisWidth={62}
          showLegend={false}
          autoMinValue={true}
          curveType="monotone"
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

    </div>
  );
};

export default TrendsChart;
