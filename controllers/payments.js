const config = require("../config/config");
const { concatenateHmacString } = require("../utils/utils");
const crypto = require("crypto");
const PaymentModel = require("../models/PaymentModel");
const paymentValidation = require("../validations/payments");
const axios = require("axios");
const UserModel = require("../models/UserModel");
const PlanModel = require("../models/PlanModel");
const SubscriptionModel = require("../models/SubscriptionModel");
const { format } = require("date-fns");
const utils = require("../utils/utils");
const email = require("../mails/send-email");
const mongoose = require("mongoose");
const paymentMailTemplate = require("../mails/templates/payment");
const { AppError } = require("../middlewares/errorHandler");

const createPaymentURL = async (request, response, next) => {
  try {
    const validatedData = paymentValidation.createPaymentURLSchema.parse(request.body);

    const { userId, planId } = validatedData;

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User ID is not registered", 400)
    }

    const plan = await PlanModel.findById(planId);
    if (!plan) {
      throw new AppError("Plan ID is not registered", 400)
    }

    const firstName = user.firstName;
    const lastName = user.firstName;
    const email = user.email;
    const phone = user.phone;

    const authData = {
      api_key: config.PAYMOB_API_KEYS,
    };

    const authResponse = await axios.post(
      "https://accept.paymob.com/api/auth/tokens",
      authData
    );

    const orderData = {
      auth_token: authResponse.data.token,
      delivery_needed: "false",
      amount_cents: `${plan.price}`,
      currency: "EGP",
      items: [
        {
          name: plan._id,
          description: user._id,
          quantity: 1,
          amount_cents: plan.price,
        },
      ],
    };

    const orderResponse = await axios.post(
      "https://accept.paymob.com/api/ecommerce/orders",
      orderData
    );

    const token = authResponse.data.token;
    const orderId = orderResponse.data.id;

    let paymentData = {
      auth_token: token,
      amount_cents: `${plan.price}`,
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        apartment: "NA",
        email: email,
        floor: "NA",
        first_name: firstName,
        street: "NA",
        building: "NA",
        phone_number: phone,
        shipping_method: "NA",
        postal_code: "NA",
        city: "NA",
        country: "EGYPT",
        last_name: lastName,
        state: "NA",
      },
      currency: "EGP",
      integration_id: config.PAYMOB.LOCAL_CARDS_INTEGRATION_ID,
    };

    const paymentRequest = await axios.post(
      "https://accept.paymob.com/api/acceptance/payment_keys",
      paymentData
    );
    const paymentToken = paymentRequest.data.token;

    iFrameURL = `https://accept.paymob.com/api/acceptance/iframes/767779?payment_token=${paymentToken}`;

    return response.status(200).json({
      accepted: true,
      iFrameURL,
    });
  } catch (error) {
    next(error)
  }
};

const processPayment = async (request, response, next) => {
  try {
    const payment = request.body.obj;
    const paymobHmac = request.query.hmac;

    const paymentHmacData = {
      amount_cents: payment.amount_cents,
      created_at: payment.created_at,
      currency: payment.currency,
      error_occured: payment.error_occured,
      has_parent_transaction: payment.has_parent_transaction,
      id: payment.id,
      integration_id: payment.integration_id,
      is_3d_secure: payment.is_3d_secure,
      is_auth: payment.is_auth,
      is_capture: payment.is_capture,
      is_refunded: payment.is_refunded,
      is_standalone_payment: payment.is_standalone_payment,
      is_voided: payment.is_voided,
      order: { id: payment.order.id },
      owner: payment.owner,
      pending: payment.pending,
      source_data: {
        pan: payment.source_data.pan,
        sub_type: payment.source_data.sub_type,
        type: payment.source_data.type,
      },
      success: payment.success,
    };

    const concatenatedString = concatenateHmacString(paymentHmacData);
    const hash = crypto.createHmac("sha512", config.PAYMOB_HMAC);
    hash.update(concatenatedString);

    const verifiedPaymentHmac = hash.digest("hex");

    if (paymobHmac != verifiedPaymentHmac) {
      throw new AppError("invalid payment hmac", 400)
    }

    if (!payment.success) {
      throw new AppError("payment is not successful", 400)
    }

    const items = payment.order.items;

    if (items.length == 0) {
      throw new AppError("no item is registered in the order", 400)
    }

    const item = items[0];
    const planId = item.name;
    const userId = item.description;

    const paymentData = {
      userId,
      transactionId: payment.id,
      status: "success",
      gateway: "paymob",
      method: payment.data.klass,
      orderId: payment.order.id,
      amountCents: payment.amount_cents,
      currency: payment.currency,
      createdAt: payment.created_at,
    };
    const paymentObj = new PaymentModel(paymentData);
    const newPayment = await paymentObj.save();

    const plan = await PlanModel.findById(planId);
    const user = await UserModel.findById(userId);

    const todayDate = new Date();

    const activeSubscription = await SubscriptionModel.findOne({
      userId,
      status: "paid",
      endDate: { $gte: todayDate },
    });

    const startDate = activeSubscription
      ? new Date(activeSubscription.endDate)
      : todayDate;
    const endDate = utils.addDays(startDate, plan.duration);

    const subscriptionData = {
      paymentId: newPayment._id,
      userId,
      planId,
      status: "paid",
      startDate,
      endDate,
      tokensLimit: plan.tokensLimit,
    };
    const subscriptionObj = new SubscriptionModel(subscriptionData);
    const newSubscription = await subscriptionObj.save();

    const emailBodyData = {
      name: user.firstName,
      amount: newPayment.amountCents / 100,
      currency: newPayment.currency,
      paymentId: newPayment.paymentId,
      date: format(new Date(newPayment.createdAt), "yyyy-MM-dd hh:mm a"),
    };
    const emailBody =
      paymentMailTemplate.generatePaymentSuccessEmail(emailBodyData);
    const emailSubject = `Payment Receipt – ${utils.formatMoney(
      newPayment.amountCents / 100,
      `en`,
      newPayment.currency
    )} Paid Successfull`;

    const emailData = {
      receiverEmail: user.email,
      subject: emailSubject,
      mailBodyHTML: emailBody,
    };

    await email.sendEmail(emailData);

    return response.status(200).json({
      accepted: true,
      message: "Processed payment successfully!",
      payment: newPayment,
      subscription: newSubscription,
    });
  } catch (error) {
    next(error)
  }
};

const getPayments = async (request, response, next) => {
  try {
    let { userId, status, gateway, method, limit, page } = request.query;

    let searchQuery = {};

    limit = limit ? Number.parseInt(limit) : config.PAGINATION_LIMIT;
    page = page ? Number.parseInt(page) : 1;

    const skip = (page - 1) * limit;

    if (userId) {
      searchQuery.userId = new mongoose.Types.ObjectId(userId);
    }

    if (status) {
      searchQuery.status = status;
    }

    if (gateway) {
      searchQuery.gateway = gateway;
    }

    if (method) {
      searchQuery.method = method;
    }

    const payments = await PaymentModel.aggregate([
      {
        $match: searchQuery,
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $project: {
          'user.password': 0
        }
      }
    ]);

    payments.forEach((payment) => {
      payment.user = payment.user[0];
    });

    const total = await PaymentModel.countDocuments(searchQuery);

    return response.status(200).json({
      accepted: true,
      total,
      payments,
    });
  } catch (error) {
    next(error)
  }
};


const refundPayment = async (request, response, next) => {
  try {
    const { paymentId } = request.params;

    const payment = await PaymentModel.findById(paymentId);

    if (payment.status != "success") {
      throw new AppError("Refund cannot be processed because the payment is not successful", 400)
    }

    const authData = { api_key: config.PAYMOB_API_KEYS };

    const authResponse = await axios.post(
      "https://accept.paymob.com/api/auth/tokens",
      authData
    );
    const authToken = authResponse.data.token;

    try {
      const refundBodyData = {
        auth_token: authToken,
        amount_cents: payment.amountCents,
        transaction_id: payment.transactionId,
      };

      await axios.post(
        "https://accept.paymob.com/api/acceptance/void_refund/refund",
        refundBodyData
      );
    } catch (error) {
      throw new AppError("There was a problem refunding", 400)
    }

    const updatedSubscription = await SubscriptionModel.findOneAndUpdate(
      { paymentId },
      { status: "refunded" },
      { new: true }
    );

    const refundDate = new Date();
    const updatePaymentData = { status: "refunded", refundDate };

    const updatedPayment = await PaymentModel.findByIdAndUpdate(
      paymentId,
      updatePaymentData,
      { new: true }
    );

    const user = await UserModel.findById(payment.userId);

    const emailSubject = `Refund confirmation – ${utils.formatMoney(
      updatedPayment.amountCents,
      `en`,
      updatedPayment.currency
    )} has been returned to your account`;

    const emailBodyData = {
      name: user.firstName,
      amount: updatedPayment.amountCents / 100,
      currency: updatedPayment.currency,
      paymentId: updatedPayment.paymentId,
      refundDate: format(
        new Date(updatedPayment.refundDate),
        "yyyy-MM-dd hh:mm a"
      ),
    };
    const emailBody = paymentMailTemplate.generateRefundEmail(emailBodyData);

    const emailData = {
      receiverEmail: user.email,
      subject: emailSubject,
      mailBodyHTML: emailBody,
    };

    await email.sendEmail(emailData);

    return response.status(200).json({
      accepted: true,
      message: "Payment is refunded successfully!",
      payment: updatedPayment,
      subscription: updatedSubscription,
    });
  } catch (error) {
    next(error)
  }
};

const deletePayment = async (request, response, next) => {
  try {
    const { paymentId } = request.params;

    const deletedPayment = await PaymentModel.findByIdAndDelete(paymentId);

    return response.status(200).json({
      accepted: true,
      message: "Payment is deleted successfully!",
      payment: deletedPayment,
    });
  } catch (error) {
    next(error)
  }
};

module.exports = {
  createPaymentURL,
  processPayment,
  getPayments,
  refundPayment,
  deletePayment,
};
