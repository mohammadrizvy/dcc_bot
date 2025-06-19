const ticketSetup = require("../schema/ticketSchema");
const {
  PermissionFlagsBits,
  PermissionOverwrites,
  PermissionsBitField,
  SlashCommandBuilder,
  ApplicationCommandOptionType,
} = require("discord.js");

const channelData = require("../schema/ticketDetail");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("removeuser")
    .setDescription("Removes a user to the current ticket channel")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User you want to add to this ticket")
        .setRequired(true)
    ),

  run: async ({ interaction }) => {
    const guildId = interaction.guild.id;
    const entry = await ticketSetup.findOne({ guildId });
    const staffRoleId = entry.staffRole;
    const user = interaction.options.getUser("user");
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const channel = interaction.channel;

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
      interaction.commandName === "removeuser" &&
      member.roles.cache.has(staffRoleId)
    ) {
      const channel = interaction.channel;
      const permissions = channel.permissionOverwrites.cache.get(user.id);

      // If there's no permissions overwrite or they can't view the channel
      if (
        !permissions ||
        !permissions.allow.has(PermissionFlagsBits.ViewChannel)
      ) {
        return interaction.reply({
          content: `❗ <@${user.id}> is not in this ticket!`,
          flags: 1 << 6,
        });
      }
      // Grant permissions to the user
      await channel.permissionOverwrites.edit(user.id, {
        ViewChannel: false,
      });

      await interaction.reply({
        content: `<@${user.id}> has been removed from the ticket!`,
        flags: 1 << 6,
      });
    } else {
      return interaction.reply({
        content: "You Dont Have Access To This Command",
        flags: 1 << 6,
      });
    }
  },
};
