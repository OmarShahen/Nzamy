const config = require("../config/config");
const { concatenateHmacString } = require("../utils/utils");
const crypto = require("crypto");
const PaymentModel = require("../models/PaymentModel");
const CounterModel = require("../models/CounterModel");
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

const createPaymentURL = async (request, response) => {
  try {
    const dataValidation = paymentValidation.createPaymentURL(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { userId, planId } = request.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      return response.status(400).json({
        accepted: false,
        message: "User ID is not registered",
        field: "userId",
      });
    }

    const plan = await PlanModel.findById(planId);
    if (!plan) {
      return response.status(400).json({
        accepted: false,
        message: "Plan ID is not registered",
        field: "planId",
      });
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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const processPayment = async (request, response) => {
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
      return response.status(400).json({
        accepted: false,
        message: "invalid payment hmac",
        field: "hmac",
      });
    }

    if (!payment.success) {
      return response.status(400).json({
        accepted: false,
        message: "payment is not successful",
        field: "payment.success",
      });
    }

    const items = payment.order.items;

    if (items.length == 0) {
      return response.status(400).json({
        accepted: false,
        message: "no item is registered in the order",
        field: "payment.order.items",
      });
    }

    const item = items[0];
    const planId = item.name;
    const userId = item.description;

    const counter = await CounterModel.findOneAndUpdate(
      { name: "payment" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const paymentData = {
      paymentId: counter.value,
      userId,
      transactionId: payment.id,
      status: "SUCCESS",
      gateway: "PAYMOB",
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
      status: "PAID",
      endDate: { $gte: todayDate },
    });

    const startDate = activeSubscription
      ? new Date(activeSubscription.endDate)
      : todayDate;
    const endDate = utils.addDays(startDate, plan.duration);

    const subscriptionCounter = await CounterModel.findOneAndUpdate(
      { name: "subscription" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const subscriptionData = {
      subscriptionId: subscriptionCounter.value,
      paymentId: newPayment._id,
      userId,
      planId,
      status: "PAID",
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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const getPayments = async (request, response) => {
  try {
    let { userId, status, gateway, method, limit, page } = request.query;

    let searchQuery = {};

    limit = limit ? Number.parseInt(limit) : config.PAGINATION_LIMIT;
    page = page ? Number.parseInt(page) : 1;

    const skip = (page - 1) * limit;

    if (userId) {
      searchQuery.userId = mongoose.Types.ObjectId(userId);
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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};
/*
const getPaymentsStatistics = async (request, response) => {
  try {
    const { searchQuery } = utils.statsQueryGenerator("none", 0, request.query);

    const matchQuery = { ...searchQuery };

    const totalAmountPaidList = await PaymentModel.aggregate([
      {
        $match: matchQuery,
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amountCents" },
        },
      },
    ]);

    const totalAmountPaidActiveList = await PaymentModel.aggregate([
      {
        $match: { ...matchQuery, isRefunded: false },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amountCents" },
        },
      },
    ]);

    const totalAmountPaidRefundedList = await PaymentModel.aggregate([
      {
        $match: { ...matchQuery, isRefunded: true },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amountCents" },
        },
      },
    ]);

    const totalAmountPaidCommissionList = await PaymentModel.aggregate([
      {
        $match: { ...matchQuery, isRefunded: false },
      },
      {
        $project: {
          commissionAmount: { $multiply: ["$commission", "$amountCents"] },
        },
      },
      {
        $group: {
          _id: null,
          totalCommission: { $sum: "$commissionAmount" },
        },
      },
    ]);

    let totalAmountPaid = 0;
    let totalAmountPaidActive = 0;
    let totalAmountPaidRefunded = 0;
    let totalAmountPaidCommission = 0;

    if (totalAmountPaidList.length != 0) {
      totalAmountPaid = totalAmountPaidList[0].total / 100;
    }

    if (totalAmountPaidActiveList.length != 0) {
      totalAmountPaidActive = totalAmountPaidActiveList[0].total / 100;
    }

    if (totalAmountPaidRefundedList.length != 0) {
      totalAmountPaidRefunded = totalAmountPaidRefundedList[0].total / 100;
    }

    if (totalAmountPaidCommissionList.length != 0) {
      totalAmountPaidCommission =
        totalAmountPaidCommissionList[0].totalCommission / 100;
    }

    return response.status(200).json({
      accepted: true,
      totalAmountPaid,
      totalAmountPaidActive,
      totalAmountPaidRefunded,
      totalAmountPaidCommission,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};*/

const refundPayment = async (request, response) => {
  try {
    const { paymentId } = request.params;

    const payment = await PaymentModel.findById(paymentId);

    if (payment.status != "SUCCESS") {
      return response.status(400).json({
        accepted: false,
        message:
          "Refund cannot be processed because the payment is not successful",
        field: "paymentId",
      });
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
      return response.status(400).json({
        accepted: false,
        message: "There was a problem refunding",
        error: error?.response?.data?.message,
      });
    }

    const updatedSubscription = await SubscriptionModel.findOneAndUpdate(
      { paymentId },
      { status: "REFUNDED" },
      { new: true }
    );

    const refundDate = new Date();
    const updatePaymentData = { status: "REFUNDED", refundDate };

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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const deletePayment = async (request, response) => {
  try {
    const { paymentId } = request.params;

    const deletedPayment = await PaymentModel.findByIdAndDelete(paymentId);

    return response.status(200).json({
      accepted: true,
      message: "Payment is deleted successfully!",
      payment: deletedPayment,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createPaymentURL,
  processPayment,
  getPayments,
  refundPayment,
  deletePayment,
};
