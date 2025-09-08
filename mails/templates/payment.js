const utils = require("../../utils/utils");

function generatePaymentSuccessEmail({
  name,
  amount,
  currency,
  paymentId,
  date,
}) {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9fafb;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background: #ffffff;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .header h1 {
          color: #4CAF50;
          margin: 0;
        }
        .details {
          margin: 20px 0;
        }
        .details p {
          margin: 8px 0;
          font-size: 15px;
        }
        .highlight {
          font-weight: bold;
          color: #111;
        }
        .footer {
          text-align: center;
          font-size: 13px;
          color: #888;
          margin-top: 30px;
          border-top: 1px solid #eee;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Payment Successful</h1>
          <p>Thank you for your payment, ${name}!</p>
        </div>
        <div class="details">
          <p><span class="highlight">Amount:</span> ${utils.formatMoney(
            amount,
            `en`,
            currency
          )}</p>
          <p><span class="highlight">Payment ID:</span> ${paymentId}</p>
          <p><span class="highlight">Date:</span> ${date}</p>
        </div>
        <p>We appreciate your trust in us.</p>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Converto. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>
  `;
}

function generateRefundEmail({
  name,
  amount,
  currency,
  paymentId,
  refundDate,
  reason,
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Refund Processed</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: #e53e3e;
            color: #ffffff;
            text-align: center;
            padding: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px;
          }
          .content h2 {
            margin-top: 0;
            color: #2d3748;
          }
          .details {
            margin: 20px 0;
            padding: 15px;
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
          }
          .details p {
            margin: 6px 0;
            font-size: 15px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 13px;
            color: #718096;
            background: #f9f9f9;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Refund Processed</h1>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>We have successfully processed your refund. Please find the details below:</p>

            <div class="details">
              <p><strong>Refund Amount:</strong> ${amount} ${currency}</p>
              <p><strong>Payment ID:</strong> ${paymentId}</p>
              <p><strong>Refund Date:</strong> ${refundDate}</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
            </div>

            <p>The refunded amount may take a few business days to appear in your account, depending on your payment provider.</p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>Thank you for your trust. <br/> The Support Team</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

module.exports = { generatePaymentSuccessEmail, generateRefundEmail };
