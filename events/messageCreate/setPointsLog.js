const { EmbedType, PermissionsBitField, EmbedBuilder } = require("discord.js");

const ticketSetup = require("../../schema/ticketSchema");
const staffPoints = require("../../schema/staffPoints");

module.exports = async (message) => {
  const guild = message.guild;
  const guildId = message.guild.id;
  const member = message.member;
  const prefix = "^";
  const command = "setpointslog";
  if (!message.content.toLowerCase().startsWith(`${prefix}${command}`)) return;
  const entry = await ticketSetup.findOne({ guildId });
  if (!entry) return;
  const highStaffId = entry.highStaffRole;
  if (!member.roles.cache.has(highStaffId)) {
    return message.reply("❌ You don't have access to this command.");
  }
  // Split the message content into an array
  const args = message.content.trim().split(/ +/);

  // The first argument will be "^points", we shift it away
  args.shift();
  const providedChannel = args[0];
  if (!providedChannel) {
    return message.reply("Please Provide Channel Or It's Id!");
  }
  const logChannelId = providedChannel.replace(/[<#@!>]/g, "");
  if (!entry.pointsLog) {
    entry.pointsLog = logChannelId;
  } else {
    entry.pointsLog = logChannelId;
  }
  await entry.save();
  message.reply("Entry Saved SuccessFully! ✅");
};
