const StoreModel = require("../../../models/StoreModel");
const {
  generateShippingPolicyInstructions,
  generateStorePaymentInstructions,
} = require("../../../utils/instructions");

const getStoreShippingPolicy = async ({ storeId }) => {
  const store = await StoreModel.findById(storeId);
  if (!store) {
    return { message: "no store found" };
  }

  const shippingPolicyInstructions = generateShippingPolicyInstructions(store);

  return { message: shippingPolicyInstructions };
};

const getStoreRefundPolicy = async ({ storeId }) => {
  const store = await StoreModel.findById(storeId);
  if (!store) {
    return { message: "no store found" };
  }

  const refundingPolicyInstructions = generateReturnPolicyInstructions(store);

  return { message: refundingPolicyInstructions };
};

const getStorePaymentsOptions = async ({ storeId }) => {
  const store = await StoreModel.findById(storeId);
  if (!store) {
    return { message: "no store found" };
  }

  const paymentOptionsInstructions = generateStorePaymentInstructions(store);

  return { message: paymentOptionsInstructions };
};

module.exports = {
  getStoreShippingPolicy,
  getStoreRefundPolicy,
  getStorePaymentsOptions,
};
