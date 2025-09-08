const formatNumber = (number = 0) => {
  return new Intl.NumberFormat().format(number);
};

const formatMoney = (number = 0, lang = "en", currency = "EGP") => {
  return new Intl.NumberFormat(lang, { style: "currency", currency }).format(
    number
  );
};

module.exports = { formatNumber, formatMoney };
