const mongoose = require("mongoose");

const statsQueryGenerator = (
  entityIdKey = "none",
  entityIdValue = 0,
  datesQuery,
  dateField = "createdAt"
) => {
  const { from, to, until, specific } = datesQuery;

  let searchQuery = {};

  if (entityIdKey == "none") {
  } else if (typeof entityIdValue == "string") {
    searchQuery[entityIdKey] = mongoose.Types.ObjectId(entityIdValue);
  } else if (typeof entityIdValue == "object") {
    searchQuery[entityIdKey] = { $in: entityIdValue };
  }

  let toDate = new Date();
  let fromDate = new Date();

  if (until) {
    toDate = new Date(until);

    const dateQuery = { $lte: toDate };
    searchQuery[dateField] = dateQuery;
  } else if (from && to) {
    fromDate = new Date(from);
    toDate = new Date(to);

    const dateQuery = { $gte: fromDate, $lte: toDate };
    searchQuery[dateField] = dateQuery;
  } else if (specific) {
    let fromDateTemp = new Date(specific);
    toDate = new Date(fromDateTemp.setDate(fromDateTemp.getDate() + 1));
    fromDate = new Date(specific);

    const dateQuery = { $gte: fromDate, $lte: toDate };
    searchQuery[dateField] = dateQuery;
  }

  return { searchQuery, fromDate, toDate };
};

const growthDatePicker = (until, to, specific) => {
  let growthUntilDate;

  if (until) {
    growthUntilDate = until;
  } else if (to) {
    growthUntilDate = to;
  } else if (specific) {
    growthUntilDate = specific;
  }

  return growthUntilDate;
};

module.exports = { statsQueryGenerator, growthDatePicker };
