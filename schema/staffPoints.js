const mongoose = require("mongoose");

const staffPoints = new mongoose.Schema({
  staffId: {
    type: String,
  },
  points: {
    type: Number,
    default: 0,
  },
});
module.exports = new mongoose.model("staffPoints", staffPoints);
