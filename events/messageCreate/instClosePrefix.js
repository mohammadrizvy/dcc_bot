const { EmbedBuilder, AttachmentBuilder, ChannelType } = require("discord.js");
const fs = require("fs");
const path = require("path");
const ticketSetup = require("../../schema/ticketSchema");
const channelData = require("../../schema/ticketDetail");

module.exports = async (message) => {
  const guildId = message.guild.id;
  const channel = message.channel;
  const member = message.member;

  const guild = message.guild;
  const prefix = "^";
  const command = "inst-close";
  const channelId = channel.id;
  const channelEntry = await channelData.findOne({ channelId });

  // Make sure it's the right command
  if (!message.content.toLowerCase().startsWith(`${prefix}${command}`)) return;

  const entry = await ticketSetup.findOne({ guildId });

  if (!entry) {
    return message.reply("❌ Ticket system is not set up in this server.");
  }

  const staffRoleId = entry.staffRole;
  const highStaffRoleId = entry.highStaffRole;
  const transcriptChannelId = entry.transcriptChannelId;

  // Validate ticket channel
  if (!channelEntry) {
    return console.log(`Invalid Ticket Channel ${channel}`);
  }

  // Check staff role
  if (!member || !member.roles.cache.has(highStaffRoleId)) {
    return message.reply("❌ You don't have access to this command.");
  }

  // Notify about ticket closure
  await message.reply("✅ This ticket will be closed in 3 Seconds....");
  try {
    await channelEntry.deleteOne();
  } catch (error) {
    console.log(error);
  }
  // Delete the channel after 15 seconds
  setTimeout(() => {
    channel.delete().catch(console.error);
  }, 3000);
};
