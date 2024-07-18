"use strict";

var utils = require('../utils/utils');

var addClinicOwner = function addClinicOwner(clinicOwnerData) {
  var clinicId = clinicOwnerData.clinicId,
      ownerId = clinicOwnerData.ownerId;
  if (!clinicId) return {
    isAccepted: false,
    message: 'clinic Id is required',
    field: 'clinicId'
  };
  if (!utils.isObjectId(clinicId)) return {
    isAccepted: false,
    message: 'clinic Id format is invalid',
    field: 'clinicId'
  };
  if (!ownerId) return {
    isAccepted: false,
    message: 'doctor Id is required',
    field: 'ownerId'
  };
  if (!utils.isObjectId(ownerId)) return {
    isAccepted: false,
    message: 'doctor Id format is invalid',
    field: 'ownerId'
  };
  return {
    isAccepted: true,
    message: 'data is valid',
    data: clinicOwnerData
  };
};

module.exports = {
  addClinicOwner: addClinicOwner
};