const mongoose = require("mongoose");

const setup = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
  },
  highStaffRole: {
    type: String,
    required: true,
  },
  staffRole: {
    type: String,
    required: true,
  },
  transcriptChannelId: {
    type: String,
    required: true,
  },
  giveawayClaimC: {
    type: String,
    required: true,
  },
  punishmentAppealC: {
    type: String,
    required: true,
  },
  otherC: {
    type: String,
    required: true,
  },
  pointsLog: {
    type: String,
  },
});
module.exports = new mongoose.model("ticketSchema", setup);
