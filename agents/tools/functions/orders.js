const { sendEmail } = require("../../../mails/send-email");
const StoreModel = require("../../../models/StoreModel");
const { generateOrderEmail } = require("../../../utils/email-formatters");
const { formatMoney } = require("../../../utils/format-number");

const sendOrderByEmail = async (orderData) => {
  const { storeId, items } = orderData;

  const store = await StoreModel.findById(storeId);

  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  orderData.totalPrice = totalPrice;
  orderData.currency = store.currency;

  const { subject, body } = generateOrderEmail(orderData);

  const emailData = {
    receiverEmail: store.email,
    subject,
    mailBodyHTML: body,
  };

  await sendEmail(emailData);

  return {
    message: `Order is confirmed and the total price is ${formatMoney(
      totalPrice,
      `en`,
      store.currency
    )}`,
  };
};

module.exports = { sendOrderByEmail };
