function validateCurrency(currency) {
  const isoCurrencyPattern = /^[A-Z]{3}$/;

  if (typeof currency !== "string") {
    return false;
  }

  if (!isoCurrencyPattern.test(currency)) {
    return false;
  }

  return true;
}

module.exports = { validateCurrency };
