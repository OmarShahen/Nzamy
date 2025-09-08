const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const concatenateHmacString = (hmacPayment) => {
  const {
    amount_cents,
    created_at,
    currency,
    error_occured,
    has_parent_transaction,
    id,
    integration_id,
    is_3d_secure,
    is_auth,
    is_capture,
    is_refunded,
    is_standalone_payment,
    is_voided,
    owner,
    pending,
    success,
  } = hmacPayment;

  const orderId = hmacPayment.order.id;
  const sourceDataPan = hmacPayment.source_data.pan;
  const sourceDataSubType = hmacPayment.source_data.sub_type;
  const sourceDataType = hmacPayment.source_data.type;

  return `${amount_cents}${created_at}${currency}${error_occured}${has_parent_transaction}${id}${integration_id}${is_3d_secure}${is_auth}${is_capture}${is_refunded}${is_standalone_payment}${is_voided}${orderId}${owner}${pending}${sourceDataPan}${sourceDataSubType}${sourceDataType}${success}`;
};

function formatResponseForMessenger(text) {
  return (
    text
      // Remove bold/italic markdown
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")

      // Remove inline & block code
      .replace(/`{1,3}([^`]*)`{1,3}/g, "$1")

      // Remove strikethrough
      .replace(/~~(.*?)~~/g, "$1")

      // Remove images ![alt](url)
      .replace(/!\[.*?\]\(.*?\)/g, "")

      // Remove links but keep text
      .replace(/\[([^\]]+)\]\((.*?)\)/g, "$1")

      // Remove headings (#, ##, ###)
      .replace(/(^|\n)#+\s+/g, "$1")

      // Remove blockquotes (>)
      .replace(/(^|\n)>\s+/g, "$1")

      // Remove list markers (*, -, 1.)
      .replace(/(^|\n)[*-]\s+/g, "$1")
      .replace(/(^|\n)\d+\.\s+/g, "$1")

      // Remove HTML tags
      .replace(/<\/?[^>]+(>|$)/g, "")

      // Trim start & end
      .trim()
  );
}

module.exports = {
  capitalizeFirstLetter,
  concatenateHmacString,
  formatResponseForMessenger,
};
