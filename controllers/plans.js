const config = require("../config/config");
const PlanModel = require("../models/PlanModel");
const { addPlanSchema, updatePlanSchema } = require("../validations/plans");
const { AppError } = require("../middlewares/errorHandler");

const getPlans = async (request, response, next) => {
  try {
    let { name, isActive, limit, page } = request.query;

    let searchQuery = {};

    limit = limit ? Number.parseInt(limit) : config.PAGINATION_LIMIT;
    page = page ? Number.parseInt(page) : 1;

    const skip = (page - 1) * limit;

    if (name) {
      searchQuery.name = { $regex: name, $options: "i" };
    }

    if (isActive == "true") {
      searchQuery.isActive = true;
    } else if (isActive == "false") {
      searchQuery.isActive = false;
    }

    const plans = await PlanModel.aggregate([
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
    ]);

    const total = await PlanModel.countDocuments(searchQuery);

    return response.status(200).json({
      accepted: true,
      total,
      plans,
    });
  } catch (error) {
    next(error);
  }
};

const addPlan = async (request, response, next) => {
  try {
    const validatedData = addPlanSchema.parse(request.body);

    const totalNames = await PlanModel.countDocuments({
      name: validatedData.name,
    });
    if (totalNames != 0) {
      throw new AppError("Plan name is already registered", 400);
    }

    const planObj = new PlanModel(validatedData);
    const newPlan = await planObj.save();

    return response.status(200).json({
      accepted: true,
      message: "Plan is added successfully!",
      plan: newPlan,
    });
  } catch (error) {
    next(error);
  }
};

const updatePlan = async (request, response, next) => {
  try {
    const validatedData = updatePlanSchema.parse(request.body);
    const { planId } = request.params;

    const plan = await PlanModel.findById(planId);
    if (!plan) {
      throw new AppError("Plan not found", 404);
    }

    if (validatedData.name && plan.name != validatedData.name) {
      const totalNames = await PlanModel.countDocuments({
        name: validatedData.name,
      });
      if (totalNames != 0) {
        throw new AppError("Plan name is already registered", 400);
      }
    }

    const updatedPlan = await PlanModel.findByIdAndUpdate(
      planId,
      validatedData,
      { new: true }
    );

    return response.status(200).json({
      accepted: true,
      message: "Plan is updated successfully!",
      plan: updatedPlan,
    });
  } catch (error) {
    next(error);
  }
};

const deletePlan = async (request, response, next) => {
  try {
    const { planId } = request.params;

    const deletedPlan = await PlanModel.findByIdAndDelete(planId);
    if (!deletedPlan) {
      throw new AppError("Plan not found", 404);
    }

    return response.status(200).json({
      accepted: true,
      message: "Plan is deleted successfully!",
      plan: deletedPlan,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlans,
  addPlan,
  updatePlan,
  deletePlan,
};
