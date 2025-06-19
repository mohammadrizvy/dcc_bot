const { claimedChannels } = require("../claimedChannels");
const ticketSetup = require("../schema/ticketSchema");
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedType,
} = require("discord.js");
const channelData = require("../schema/ticketDetail");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unclaim")
    .setDescription("Unclaims the ticket."),
  // .addMentionableOption((option) =>
  //   option
  //     .setName("opener")
  //     .setDescription("Add user who opened the ticket.")
  //     .setRequired(true)
  // ),
  run: async ({ interaction }) => {
    try {
      const guildId = interaction.guild.id;
      const entry = await ticketSetup.findOne({ guildId });
      const staffRoleId = entry.staffRole;
      const member = await interaction.guild.members.fetch(interaction.user.id);
      // const opener = interaction.options.getUser("opener");
      const channel = interaction.channel;
      const channelId = channel.id;
      const channelEntry = await channelData.findOne({ channelId });
      let openerId = channelEntry.userId;
      // ✅ UNCLAIM Command
      if (
        interaction.commandName === "unclaim" &&
        member.roles.cache.has(staffRoleId)
      ) {
        if (!channelEntry) {
          return interaction.reply("It's Not A Valid Ticket Channel!");
        }
        if (!channelEntry.claimer) {
          return interaction.reply({
            content: "❌ Ticket is not claimed yet.",
          });
        }
        if (channelEntry.claimer !== interaction.user.id) {
          return interaction.reply("This Ticket Is Alredy Claimed By A Staff");
        }
        // let channelNameParts = channel.name.split("-");
        // let openerId = channelNameParts.reverse()[0];
        if (interaction.channel.parentId !== entry.punishmentAppealC) {
          try {
            await channel.permissionOverwrites.set([
              {
                id: openerId,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ReadMessageHistory,
                ],
              },
              {
                id: staffRoleId,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ReadMessageHistory,
                ],
              },
              {
                id: interaction.guild.roles.everyone,
                deny: [PermissionFlagsBits.ViewChannel],
              },
            ]);
            channelEntry.claimer = "";
            channelEntry.save();

            claimedChannels.delete(channel.id); // ✅ Remove from claimed channels!

            await interaction.reply({
              content: `<@${interaction.user.id}> has unclaimed this ticket.`,
            });
          } catch (error) {
            console.error(error);
            await interaction.reply({
              content: "❌ An error occurred. Please contact Bot Dev.",
            });
          }
        } else {
          try {
            await channel.permissionOverwrites.set([
              {
                id: openerId,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ReadMessageHistory,
                ],
              },
              {
                id: interaction.guild.roles.everyone,
                deny: [PermissionFlagsBits.ViewChannel],
              },
            ]);
            channelEntry.claimer = "";
            channelEntry.save();

            claimedChannels.delete(channel.id); // ✅ Remove from claimed channels!

            await interaction.reply({
              content: `<@${interaction.user.id}> has unclaimed this ticket.`,
            });
          } catch (error) {
            console.error(error);
            await interaction.reply({
              content: "❌ An error occurred. Please contact Bot Dev.",
            });
          }
        }
      } else {
        return interaction.reply({
          content: "❌You Can't Use That Command.",
          flags: 1 << 6,
        });
      }
    } catch (error) {
      await interaction.reply({
        flags: 1 << 6,
        content: "Error While Using Un-Claim Command."
      })
    }
  }
};
