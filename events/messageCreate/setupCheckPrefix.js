const { EmbedType, PermissionsBitField, EmbedBuilder } = require("discord.js");

const ticketSetup = require("../../schema/ticketSchema");
module.exports = async (message) => {
  const guild = message.guild;
  const guildId = message.guild.id;
  const prefix = "^";
  const command = "ticketsetup-check";
  if (!message.content.toLowerCase().startsWith(`${prefix}${command}`)) return;
  const entry = await ticketSetup.findOne({ guildId });
  if (!entry) {
    return message.reply({
      content: "SetUp Your Ticket System First!",
      flags: 1 << 6,
    });
  }
  if (!message.member?.permissions.has(PermissionsBitField.Flags.Administrator))
    return;
  try {
    const checkEmbed = new EmbedBuilder()
      .setTitle(`Ticket Setup! Of Your Guild: ***${guild.name}***`)
      .setDescription("Id Allowence Setup Of Your Guild")
      .addFields(
        { name: "High-Staff-RoleID:", value: entry.highStaffRole },
        { name: "Ticket-Staff-RoleID:", value: entry.staffRole },
        {
          name: "Transcript-Channel-ID:",
          value: entry.transcriptChannelId,
        },
        { name: "Giveaway-Category-ID:", value: entry.giveawayClaimC },
        {
          name: "PunishmentAppeal-Category-ID:",
          value: entry.punishmentAppealC,
        },
        { name: "Other-Ticket-Category-ID:", value: entry.otherC }
      )
      .setColor(0x7ffb3f);
    message.reply({
      embeds: [checkEmbed],
      flags: 1 << 6,
    });
  } catch (error) {
    console.log(error);
  }
};
