const ticketSetup = require("../schema/ticketSchema");
const {
  SlashCommandBuilder,
  EmbedBuilder,
  TextInputBuilder,
  ModalBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextInputStyle,
  ActionRowBuilder,
  PermissionsBitField,
  ChannelType,
  Embed,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Form's A Ticket Panel In Current Channel."),

  run: async ({ interaction }) => {
    try {
      const guildId = interaction.guild.id;
      const entry = await ticketSetup.findOne({ guildId });

      if (!entry) {
        return interaction.reply({
          content: "❌ Ticket setup not found. Please run `/ticketsetup id` first to configure the bot.",
          flags: 1 << 6,
        });
      }

      let highStaffRoleId = entry.highStaffRole;
      const member = await interaction.guild.members.fetch(interaction.user.id);

      // Handle slash command /ticket
      if (interaction.isChatInputCommand()) {
        if (
          interaction.commandName === "panel" &&
          member.roles.cache.has(highStaffRoleId)
        ) {
          await interaction.reply({
            content: "⏳ Loading Panel...",
            flags: 1 << 6,
          });

          const panelEmbed = new EmbedBuilder()
            .setTitle("🎫 Ticket Options")
            .setDescription("Options For Opening Ticket")
            .addFields(
              {
                name: "📋 Choose Ticket Type:",
                value: "Choose Ticket Type As Per Your Requirements",
              },
              {
                name: "1. 🎉 Giveaway Claim:",
                value:
                  "Select This If You Want To Claim A Giveaway You Won in FxG",
              },
              {
                name: "2. 🙏 Punishment Appeal:",
                value:
                  "Select This If You Want To Appeal For A Punishment You Got In FxG",
              },
              {
                name: "3. 📌 Other:",
                value: "Select This If You Want To Open Ticket For Other Issues.",
              }
            )
            .setThumbnail(
              "https://cdn.discordapp.com/icons/1246452712653062175/a_31b8d1bbd6633b72eff08a3a35f3bb0b.gif"
            )
            .setColor(0x4ffb3c)
            .setFooter({ text: "FxG Ticket System" });

          const ticketButton = new ButtonBuilder()
            .setCustomId("giveaway_claim_button")
            .setLabel("Giveaway Claim")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("🎉");

          const appealTicketButton = new ButtonBuilder()
            .setCustomId("punish_appeal_button")
            .setLabel("Punishment Appeal")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🙏");

          const otherButton = new ButtonBuilder()
            .setCustomId("other_button")
            .setLabel("Other")
            .setStyle(ButtonStyle.Success)
            .setEmoji("📌");

          const row = new ActionRowBuilder().addComponents(
            ticketButton,
            appealTicketButton,
            otherButton
          );

          await interaction.channel.send({
            components: [row],
            embeds: [panelEmbed],
          });
        } else {
          return interaction.reply({
            content: "❌ You don't have permission to use this command. You need the High Staff role.",
            flags: 1 << 6,
          });
        }
      }
    } catch (error) {
      console.error("Error in panel command:", error);
      return interaction.reply({
        content: "❌ An error occurred while creating the panel.",
        flags: 1 << 6,
      });
    }
  },
};
