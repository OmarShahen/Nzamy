const { formatNumber, formatMoney } = require("../utils/format-number");

function generateOrderEmail(order) {
  const {
    customerName,
    customerPhone,
    deliveryAddress,
    items,
    totalPrice,
    currency,
  } = order;

  const itemRows = items
    .map((item) => {
      return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${formatNumber(
          item.quantity
        )}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${formatMoney(
          item.price,
          `en`,
          currency
        )}</td>
      </tr>
    `;
    })
    .join("");

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const subject = `New Order from ${customerName} - ${items.length} Item(s)`;

  const body = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto;">
      <h2 style="color: #4CAF50;">📦 New Order Received</h2>
      
      <p><strong>Customer Name:</strong> ${customerName}</p>
      <p><strong>Phone Number:</strong> ${customerPhone}</p>
      <p><strong>Delivery Address:</strong> ${deliveryAddress}</p>
      
      <h3 style="margin-top: 30px;">🛍️ Items Ordered</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; border: 1px solid #ddd;">Item</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Quantity</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <p style="margin-top: 20px;"><strong>Total Items:</strong> ${totalItems}</p>
      <p><strong>Total Price:</strong> ${formatMoney(
        totalPrice,
        `en`,
        currency
      )}</p>

      <p style="margin-top: 30px;">📝 Please prepare the order and arrange for delivery.</p>
    </div>
  `;

  return {
    subject,
    body,
  };
}

module.exports = { generateOrderEmail };
