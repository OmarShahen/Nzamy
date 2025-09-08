function addDays(date, days) {
  const result = new Date(date); // clone so you don't modify original
  result.setDate(result.getDate() + days);
  return result;
}

module.exports = { addDays };
