const { EmbedBuilder, AttachmentBuilder, ChannelType } = require("discord.js");
const fs = require("fs");
const path = require("path");
const ticketSetup = require("../../schema/ticketSchema");
const channelData = require("../../schema/ticketDetail");

module.exports = async (message) => {
  const guild = message.guild;
  const prefix = "^";
  const command = "rename";

  // Make sure it's the right command
  if (!message.content.toLowerCase().startsWith(`${prefix}${command}`)) return;

  const args = message.content
    .slice(prefix.length + command.length)
    .trim()
    .split(/ +/);
  const newName = args.join(" ") || "Ticket";

  const guildId = message.guild.id;
  const channel = message.channel;
  const member = message.member;
  const channelId = channel.id;
  const channelEntry = await channelData.findOne({ channelId });
  const entry = await ticketSetup.findOne({ guildId });

  if (!entry) {
    return message.reply("❌ Ticket system is not set up in this server.");
  }

  const staffRoleId = entry.staffRole;
  // Validate ticket channel
  if (!channelEntry) {
    return message.reply("❌ This is not a valid ticket channel.");
  }

  // Check staff role
  if (!member.roles.cache.has(staffRoleId)) {
    return message.reply("❌ You don't have access to this command.");
  }

  channel.setName(newName.toLowerCase());
};
