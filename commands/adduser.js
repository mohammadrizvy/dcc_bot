const ticketSetup = require("../schema/ticketSchema");
const {
  PermissionOverwrites,
  PermissionsBitField,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ApplicationCommandOptionType,
} = require("discord.js");
const channelData = require("../schema/ticketDetail");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("adduser")
    .setDescription("Add a user to the current ticket channel")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User you want to add to this ticket")
        .setRequired(true)
    ),

  run: async ({ interaction }) => {
    const channel = interaction.channel;
    const guildId = interaction.guild.id;
    const entry = await ticketSetup.findOne({ guildId });
    const staffRoleId = entry.staffRole;
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const user = interaction.options.getUser("user");

    const channelId = channel.id;
    const channelEntry = await channelData.findOne({ channelId });
    if (!channelEntry) {
      return interaction.reply({
        content: "This Is Not A Valid Ticket Channel!",
        flags: 1 << 6,
      });
    }
    if (!user) {
      return interaction.reply({
        content: "You need to specify a user!",
        flags: 1 << 6,
      });
    }
    if (
      interaction.commandName === "adduser" &&
      member.roles.cache.has(staffRoleId)
    ) {
      const channel = interaction.channel;
      const permissions = channel.permissionOverwrites.cache.get(user.id);
      const hasAccess =
        permissions && permissions.allow.has(PermissionFlagsBits.ViewChannel);
      if (hasAccess) {
        return interaction.reply({
          content: `❗ <@${user.id}> is Already in this ticket!`,
          flags: 1 << 6,
        });
      }

      // Grant permissions to the user
      await channel.permissionOverwrites.edit(user.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      });

      await interaction.reply({
        content: `<@${user.id}> has been added to the ticket!`,
      });
    } else {
      return interaction.reply({
        content: "You Dont Have Access To That Command",
        flags: 1 << 6,
      });
    }
  },
};
