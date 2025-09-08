const ShippingPolicyModel = require("../models/ShippingPolicyModel");
const StoreModel = require("../models/StoreModel");
const { 
  addShippingPolicySchema, 
  updateShippingPolicySchema, 
  shippingPolicyParamsSchema,
  storeParamsSchema
} = require("../validations/shippingPolicies");
const { AppError } = require("../middlewares/errorHandler");

const getShippingPolicy = async (request, response, next) => {
  try {
    const { storeId } = storeParamsSchema.parse(request.params);

    const shippingPolicy = await ShippingPolicyModel.findOne({ storeId });
    
    if (!shippingPolicy) {
      throw new AppError("Shipping policy not found", 404);
    }

    return response.status(200).json({
      accepted: true,
      shippingPolicy,
    });
  } catch (error) {
    next(error);
  }
};

const addShippingPolicy = async (request, response, next) => {
  try {
    const validatedData = addShippingPolicySchema.parse(request.body);

    // Check if store exists
    const store = await StoreModel.findById(validatedData.storeId);
    if (!store) {
      throw new AppError("Store not found", 404);
    }

    // Check if shipping policy already exists for this store
    const existingPolicy = await ShippingPolicyModel.findOne({ storeId: validatedData.storeId });
    if (existingPolicy) {
      throw new AppError("Shipping policy already exists for this store", 400);
    }

    const shippingPolicy = new ShippingPolicyModel(validatedData);
    const newShippingPolicy = await shippingPolicy.save();

    // Update store reference
    await StoreModel.findByIdAndUpdate(
      validatedData.storeId, 
      { shippingPolicyId: newShippingPolicy._id }
    );

    return response.status(201).json({
      accepted: true,
      message: "Shipping policy created successfully!",
      shippingPolicy: newShippingPolicy,
    });
  } catch (error) {
    next(error);
  }
};

const updateShippingPolicy = async (request, response, next) => {
  try {
    const { policyId } = shippingPolicyParamsSchema.parse(request.params);
    const validatedData = updateShippingPolicySchema.parse(request.body);

    const shippingPolicy = await ShippingPolicyModel.findById(policyId);
    if (!shippingPolicy) {
      throw new AppError("Shipping policy not found", 404);
    }

    const updatedPolicy = await ShippingPolicyModel.findByIdAndUpdate(
      policyId,
      validatedData,
      { new: true, runValidators: true }
    );

    return response.status(200).json({
      accepted: true,
      message: "Shipping policy updated successfully!",
      shippingPolicy: updatedPolicy,
    });
  } catch (error) {
    next(error);
  }
};

const updateShippingPolicyByStore = async (request, response, next) => {
  try {
    const { storeId } = storeParamsSchema.parse(request.params);
    const validatedData = updateShippingPolicySchema.parse(request.body);

    const shippingPolicy = await ShippingPolicyModel.findOne({ storeId });
    if (!shippingPolicy) {
      throw new AppError("Shipping policy not found", 404);
    }

    const updatedPolicy = await ShippingPolicyModel.findByIdAndUpdate(
      shippingPolicy._id,
      validatedData,
      { new: true, runValidators: true }
    );

    return response.status(200).json({
      accepted: true,
      message: "Shipping policy updated successfully!",
      shippingPolicy: updatedPolicy,
    });
  } catch (error) {
    next(error);
  }
};

const deleteShippingPolicy = async (request, response, next) => {
  try {
    const { policyId } = shippingPolicyParamsSchema.parse(request.params);

    const shippingPolicy = await ShippingPolicyModel.findById(policyId);
    if (!shippingPolicy) {
      throw new AppError("Shipping policy not found", 404);
    }

    // Remove reference from store
    await StoreModel.findByIdAndUpdate(
      shippingPolicy.storeId, 
      { $unset: { shippingPolicyId: 1 } }
    );

    await ShippingPolicyModel.findByIdAndDelete(policyId);

    return response.status(200).json({
      accepted: true,
      message: "Shipping policy deleted successfully!",
      shippingPolicy,
    });
  } catch (error) {
    next(error);
  }
};

const deleteShippingPolicyByStore = async (request, response, next) => {
  try {
    const { storeId } = storeParamsSchema.parse(request.params);

    const shippingPolicy = await ShippingPolicyModel.findOne({ storeId });
    if (!shippingPolicy) {
      throw new AppError("Shipping policy not found", 404);
    }

    // Remove reference from store
    await StoreModel.findByIdAndUpdate(
      storeId, 
      { $unset: { shippingPolicyId: 1 } }
    );

    await ShippingPolicyModel.findByIdAndDelete(shippingPolicy._id);

    return response.status(200).json({
      accepted: true,
      message: "Shipping policy deleted successfully!",
      shippingPolicy,
    });
  } catch (error) {
    next(error);
  }
};

const getShippingMethods = async (request, response, next) => {
  try {
    const { storeId } = storeParamsSchema.parse(request.params);

    const shippingPolicy = await ShippingPolicyModel.findOne({ storeId });
    if (!shippingPolicy) {
      throw new AppError("Shipping policy not found", 404);
    }

    const activeMethods = shippingPolicy.methods.filter(method => method.isActive);

    return response.status(200).json({
      accepted: true,
      methods: activeMethods,
    });
  } catch (error) {
    next(error);
  }
};

const calculateShippingCost = async (request, response, next) => {
  try {
    const { storeId } = storeParamsSchema.parse(request.params);
    const { country, city, weight, orderAmount } = request.query;

    const shippingPolicy = await ShippingPolicyModel.findOne({ 
      storeId, 
      isActive: true,
      isShippingEnabled: true 
    });
    
    if (!shippingPolicy) {
      throw new AppError("Shipping not available for this store", 404);
    }

    const applicableMethods = [];

    for (const method of shippingPolicy.methods) {
      if (!method.isActive) continue;

      for (const zone of method.zones) {
        if (!zone.isActive) continue;
        
        if (zone.countries.includes(country)) {
          let cost = zone.cost;
          
          // Check for free shipping
          if (shippingPolicy.freeShipping?.enabled && 
              orderAmount >= shippingPolicy.freeShipping.minimumAmount) {
            cost = 0;
          }

          applicableMethods.push({
            methodName: method.name,
            type: method.type,
            provider: method.provider,
            zoneName: zone.name,
            cost,
            estimatedDays: zone.estimatedDays,
            trackingEnabled: method.trackingEnabled
          });
        }
      }
    }

    if (applicableMethods.length === 0) {
      throw new AppError("No shipping methods available for this location", 400);
    }

    return response.status(200).json({
      accepted: true,
      shippingMethods: applicableMethods,
      freeShippingApplied: shippingPolicy.freeShipping?.enabled && 
                           orderAmount >= shippingPolicy.freeShipping.minimumAmount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShippingPolicy,
  addShippingPolicy,
  updateShippingPolicy,
  updateShippingPolicyByStore,
  deleteShippingPolicy,
  deleteShippingPolicyByStore,
  getShippingMethods,
  calculateShippingCost,
};