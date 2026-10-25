let stats = {
  usersCount: 1247,
  ordersCount: 3892,
  revenue: 156780,
  activeUsers: 892,
  newOrders: 43,
  conversionRate: 4.2,
};

export function getStats() {
  return { ...stats };
}

export function updateStats(updates) {
  stats = { ...stats, ...updates };
  return stats;
}

export function getChartData(period = 'week') {
  const base = {
    line: [
      { month: 'Пн', value: 120 },
      { month: 'Вт', value: 180 },
      { month: 'Ср', value: 150 },
      { month: 'Чт', value: 220 },
      { month: 'Пт', value: 290 },
      { month: 'Сб', value: 340 },
      { month: 'Вс', value: 260 },
    ],
    bar: [
      { name: 'Пн', value: 65 },
      { name: 'Вт', value: 78 },
      { name: 'Ср', value: 90 },
      { name: 'Чт', value: 81 },
      { name: 'Пт', value: 95 },
      { name: 'Сб', value: 70 },
      { name: 'Вс', value: 55 },
    ],
  };
  if (period === 'week') return base;
  const labels = period === 'day' ? ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'] : ['1–5', '6–10', '11–15', '16–20', '21–25', '26–31'];
  return {
    line: labels.map((label, i) => ({ month: label, value: Math.round(base.line[i].value * (period === 'day' ? 0.2 : 4)) })),
    bar: labels.map((label, i) => ({ name: label, value: Math.round(base.bar[i].value * (period === 'day' ? 0.2 : 4)) })),
  };
}
