import { useEffect, useRef } from "preact/hooks";

interface BurndownChartProps {
  sprintId: number;
  startDate: Date;
  endDate: Date;
  totalStoryPoints: number;
  completedPointsData: { date: string; points: number }[];
}

declare global {
  interface Window {
    Chart: any;
  }
}

export default function BurndownChartIsland({
  sprintId,
  startDate,
  endDate,
  totalStoryPoints,
  completedPointsData,
}: BurndownChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Cargar Chart.js desde CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    script.async = true;
    script.onload = initializeChart;
    document.body.appendChild(script);

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (window.Chart && chartRef.current && completedPointsData.length > 0) {
      updateChart();
    }
  }, [completedPointsData, totalStoryPoints, startDate, endDate]);

  const initializeChart = () => {
    if (!chartRef.current || !window.Chart) return;
    updateChart();
  };

  const updateChart = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    if (!chartRef.current || !window.Chart) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Generar fechas entre startDate y endDate
    const dateLabels = generateDateRange(new Date(startDate), new Date(endDate));
    
    // Generar la línea ideal (desde totalStoryPoints hasta 0)
    const idealLine = generateIdealBurndown(dateLabels.length, totalStoryPoints);
    
    // Convertir los datos de puntos completados al formato necesario
    const actualData = convertCompletedPointsData(dateLabels, completedPointsData, totalStoryPoints);

    chartInstanceRef.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: dateLabels.map(date => formatDate(date)),
        datasets: [
          {
            label: 'Ideal Burndown',
            data: idealLine,
            borderColor: 'rgba(54, 162, 235, 0.5)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            borderDash: [5, 5],
            fill: false,
            tension: 0,
          },
          {
            label: 'Actual Burndown',
            data: actualData,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            fill: false,
            tension: 0.1,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Remaining Story Points'
            },
            max: totalStoryPoints + Math.ceil(totalStoryPoints * 0.1), // Add 10% padding
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Sprint Burndown Chart',
            font: {
              size: 16
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
          legend: {
            position: 'bottom',
          }
        }
      }
    });
  };

  // Función para generar un rango de fechas entre startDate y endDate
  const generateDateRange = (start: Date, end: Date): string[] => {
    const dates: string[] = [];
    const current = new Date(start);
    
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  // Función para generar la línea ideal de burndown
  const generateIdealBurndown = (numDays: number, totalPoints: number): number[] => {
    const idealLine: number[] = [];
    const pointsPerDay = totalPoints / (numDays - 1);
    
    for (let i = 0; i < numDays; i++) {
      idealLine.push(Math.max(0, totalPoints - (pointsPerDay * i)));
    }
    
    return idealLine;
  };

  // Función para convertir los datos de puntos completados al formato necesario
  const convertCompletedPointsData = (
    dateLabels: string[], 
    completedData: { date: string; points: number }[], 
    totalPoints: number
  ): number[] => {
    const result: number[] = [];
    let remainingPoints = totalPoints;
    
    for (const dateLabel of dateLabels) {
      const entry = completedData.find(item => item.date === dateLabel);
      if (entry) {
        remainingPoints -= entry.points;
      }
      result.push(Math.max(0, remainingPoints));
    }
    
    return result;
  };

  // Función para formatear fechas
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  return (
    <div class="w-full h-96 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <canvas ref={chartRef} width="400" height="300"></canvas>
    </div>
  );
}