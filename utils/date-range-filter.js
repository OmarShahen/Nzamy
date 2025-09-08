// utils/buildDateRangeFilter.js

function buildDateRangeFilters(query) {
  const { startDate, endDate } = query;

  if (!startDate || !endDate) {
    return {
      current: {},
      previous: {},
      days: 0,
    };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate difference in days (inclusive)
  const days =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Previous range = same length before current
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);

  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (days - 1));

  return {
    current: {
      createdAt: {
        $gte: start,
        $lte: end,
      },
    },
    previous: {
      createdAt: {
        $gte: prevStart,
        $lte: prevEnd,
      },
    },
    days,
  };
}

module.exports = buildDateRangeFilters;
