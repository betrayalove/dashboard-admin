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

export function getChartData() {
  return {
    line: [
      { month: 'Янв', value: 120 },
      { month: 'Фев', value: 180 },
      { month: 'Мар', value: 150 },
      { month: 'Апр', value: 220 },
      { month: 'Май', value: 290 },
      { month: 'Июн', value: 340 },
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
}
