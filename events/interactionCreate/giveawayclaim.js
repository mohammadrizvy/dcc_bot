const {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  EmbedBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
} = require("discord.js");
require("dotenv").config();
const ticketSetup = require("../../schema/ticketSchema");
const channelData = require("../../schema/ticketDetail");
const EMOJI = require("../../emoji");

module.exports = async (interaction) => {
  try {
    // SELECT MENU INTERACTION
    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "ticket_select_menu"
    ) {
      const selected = interaction.values[0];

      if (selected === "giveaway_claim") {
        const modal = new ModalBuilder()
          .setCustomId("giveaway_claim")
          .setTitle("Giveaway Claim Ticket");

        const winnerIGN = new TextInputBuilder()
          .setCustomId("winner_ign")
          .setLabel("What's Your IGN:")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const hostName = new TextInputBuilder()
          .setCustomId("host_name")
          .setLabel("What's the Name of the Giveaway Host:")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const winningItem = new TextInputBuilder()
          .setCustomId("winning_item")
          .setLabel("What Have You Won? (Coins/Items):")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const winningAmount = new TextInputBuilder()
          .setCustomId("winning_amount")
          .setLabel("Give Name/Amount of Items/Coins You Won:")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(winnerIGN);
        const secondActionRow = new ActionRowBuilder().addComponents(hostName);
        const thirdActionRow = new ActionRowBuilder().addComponents(winningItem);
        const fourthActionRow = new ActionRowBuilder().addComponents(winningAmount);

        modal.addComponents(
          firstActionRow,
          secondActionRow,
          thirdActionRow,
          fourthActionRow
        );

        await interaction.showModal(modal);
        return;
      }
    }

    // BUTTON INTERACTION
    if (
      interaction.isButton() &&
      interaction.customId === "giveaway_claim_button"
    ) {
      const modal = new ModalBuilder()
        .setCustomId("giveaway_claim")
        .setTitle("Giveaway Claim Ticket");

      const winnerIGN = new TextInputBuilder()
        .setCustomId("winner_ign")
        .setLabel("What's Your IGN:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const hostName = new TextInputBuilder()
        .setCustomId("host_name")
        .setLabel("What's the Name of the Giveaway Host:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const winningItem = new TextInputBuilder()
        .setCustomId("winning_item")
        .setLabel("What Have You Won? (Coins/Items):")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const winningAmount = new TextInputBuilder()
        .setCustomId("winning_amount")
        .setLabel("Give Name/Amount of Items/Coins You Won:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const firstActionRow = new ActionRowBuilder().addComponents(winnerIGN);
      const secondActionRow = new ActionRowBuilder().addComponents(hostName);
      const thirdActionRow = new ActionRowBuilder().addComponents(winningItem);
      const fourthActionRow = new ActionRowBuilder().addComponents(winningAmount);

      modal.addComponents(
        firstActionRow,
        secondActionRow,
        thirdActionRow,
        fourthActionRow
      );

      await interaction.showModal(modal);
      return;
    }

    // MODAL SUBMIT INTERACTION
    if (
      interaction.isModalSubmit() &&
      interaction.customId === "giveaway_claim"
    ) {
      await interaction.deferReply({ flags: 1 << 6 }); // Prevent interaction timeout

      const guildId = interaction.guild.id;
      const entry = await ticketSetup.findOne({ guildId });

      if (!entry) {
        return interaction.editReply({
          content: "❌ Ticket setup not found. Please contact an administrator.",
        });
      }

      const staffRoleId = entry.staffRole;

      const g_winnerIGN = interaction.fields.getTextInputValue("winner_ign");
      const g_hostName = interaction.fields.getTextInputValue("host_name");
      const g_winningItem = interaction.fields.getTextInputValue("winning_item");
      const g_winningAmount = interaction.fields.getTextInputValue("winning_amount");

      const giveawayDetails = new EmbedBuilder()
        .setTitle(`🎉 Giveaway Claim`)
        .setDescription("Response Provided By Ticket Opener")
        .setColor(0x2dfbd2)
        .addFields(
          { name: "Your IGN (In Game Name):", value: g_winnerIGN },
          { name: "Host Name:", value: g_hostName },
          { name: "Winning Prize (Coins Or Item):", value: g_winningItem },
          { name: "Winning Coin Amount/Item Name:", value: g_winningAmount }
        );

      try {
        const channel = await interaction.guild.channels.create({
          name: `${g_hostName}-${g_winningAmount}-${g_winningItem}`.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase().slice(0, 90),
          type: 0, // GUILD_TEXT
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
            {
              id: staffRoleId,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
          ],
        });

        const close = new ButtonBuilder()
          .setCustomId("close_button")
          .setLabel("Close")
          .setStyle(ButtonStyle.Danger);
        const claim = new ButtonBuilder()
          .setCustomId("claim_button")
          .setLabel("Claim")
          .setStyle(ButtonStyle.Primary);
        const ccButton = new ActionRowBuilder().addComponents(close, claim);

        await channel.setParent(entry.giveawayClaimC, {
          lockPermissions: false,
        });

        const newChannelData = new channelData({
          channelId: channel.id,
          userId: interaction.user.id,
        });
        await newChannelData.save();

        await channel.send({
          content: `Dear <@${interaction.user.id}> please be patient, the <@&${staffRoleId}> will arrive here shortly.`,
        });
        await channel.send({
          embeds: [giveawayDetails],
          components: [ccButton],
        });
        await channel.send({
          content: `Hi, <@${interaction.user.id}>
🎉 Congratulations for winning the giveaway! 🎉

${EMOJI.tick} Please provide proof of your winning. ${EMOJI.tick}
After giving proof, please create an auction (BIN) ${EMOJI.moneybag} of your winning amount for 48 hours & ping the giveaway host ${EMOJI.bluecrown}.`,
        });

        await interaction.editReply({
          content: `✅ Your giveaway claim ticket has been created: ${channel}`,
        });
      } catch (error) {
        console.error("Error creating giveaway ticket:", error);
        await interaction.editReply({
          content: "❌ Failed to create ticket. Please try again or contact an administrator.",
        });
      }
    }
  } catch (error) {
    console.error("Error in giveaway claim handler:", error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: "❌ An error occurred while processing your request.",
        });
      } else {
        await interaction.reply({
          content: "❌ An error occurred while processing your request.",
          ephemeral: true,
        });
      }
    } catch (replyError) {
      console.error("Error sending error reply:", replyError);
    }
  }
};
