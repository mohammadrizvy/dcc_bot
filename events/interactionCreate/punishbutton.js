const {
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");
const ticketSetup = require("../../schema/ticketSchema");
const channelData = require("../../schema/ticketDetail");
const EMOJI = require("../../emoji");
require("dotenv").config();

module.exports = async (interaction) => {
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "ticket_select_menu"
  ) {
    const selected = interaction.values[0]; // Get selected option

    if (selected === "punish_appeal") {
      const modal = new ModalBuilder()
        .setCustomId("appeal_modal")
        .setTitle("Punishment Appeal");

      const punishmentType = new TextInputBuilder()
        .setCustomId("punishment_Type")
        .setLabel("What punishment did you get?(Eg:Ban,Timeout)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const reason = new TextInputBuilder()
        .setCustomId("punish_reason")
        .setLabel("What's the reason for your punishment?")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const duration = new TextInputBuilder()
        .setCustomId("punish_duration")
        .setLabel("What's the duration of punishment? (Optional)")
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const firstRow = new ActionRowBuilder().addComponents(punishmentType);
      const secondRow = new ActionRowBuilder().addComponents(reason);
      const thirdRow = new ActionRowBuilder().addComponents(duration);

      modal.addComponents(firstRow, secondRow, thirdRow);

      await interaction.showModal(modal);
    }
  }

  // Button Interaction Handling
  if (
    interaction.isButton() &&
    interaction.customId === "punish_appeal_button"
  ) {
    const modal = new ModalBuilder()
      .setCustomId("appeal_modal")
      .setTitle("Punishment Appeal");

    const punishmentType = new TextInputBuilder()
      .setCustomId("punishment_Type")
      .setLabel("What punishment did you get?(Eg:Ban,Timeout)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const reason = new TextInputBuilder()
      .setCustomId("punish_reason")
      .setLabel("What's the reason for your punishment?")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const duration = new TextInputBuilder()
      .setCustomId("punish_duration")
      .setLabel("What's the duration of punishment? (Optional)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const firstRow = new ActionRowBuilder().addComponents(punishmentType);
    const secondRow = new ActionRowBuilder().addComponents(reason);
    const thirdRow = new ActionRowBuilder().addComponents(duration);

    modal.addComponents(firstRow, secondRow, thirdRow);

    await interaction.showModal(modal);
  }

  const guildId = interaction.guild.id;
  const entry = await ticketSetup.findOne({ guildId });
  let staffRoleId = entry.staffRole;

  // Modal Submission Handling
  if (interaction.isModalSubmit() && interaction.customId === "appeal_modal") {
    const p_type = interaction.fields.getTextInputValue("punishment_Type");
    const p_reason = interaction.fields.getTextInputValue("punish_reason");
    const p_duration =
      interaction.fields.getTextInputValue("punish_duration") || "N/A";

    const openerResponse = new EmbedBuilder()
      .setTitle(`${EMOJI.pray} Punishment Appeal`)
      .setDescription("Response provided by ticket opener")
      .setColor(0x2dfbd2)
      .addFields(
        { name: "Punishment Type", value: p_type },
        { name: "Reason", value: p_reason },
        { name: "Duration", value: p_duration }
      );

    try {
      // ✅ Defer the reply first!
      await interaction.deferReply({ flags: 1 << 6 });

      const sanitizedUsername = interaction.user.username
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();

      const channel = await interaction.guild.channels.create({
        name: `appeal-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id, // @everyone
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: interaction.user.id, // Ticket creator
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
          },
        ],
      });

      await channel.setParent(entry.punishmentAppealC, {
        lockPermissions: false,
      });

      const newChannelData = new channelData({
        channelId: channel.id,
        userId: interaction.user.id,
      });
      await newChannelData.save();

      const close = new ButtonBuilder()
        .setCustomId("close_button")
        .setLabel("Close")
        .setStyle(ButtonStyle.Danger);

      const claim = new ButtonBuilder()
        .setCustomId("claim_button")
        .setLabel("Claim")
        .setStyle(ButtonStyle.Primary);

      const ccButton = new ActionRowBuilder().addComponents(close, claim);

      const channelName = interaction.channel.name;

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setDescription('👋 Welcome! Your punishment appeal ticket has been created. The staff team will be with you shortly. Please be patient.')
            .setColor(0x5865f2)
        ]
      });
      await channel.send({
        content: `Dear <@${interaction.user.id}>, the <@&${staffRoleId}> will be here soon to help you.`
      });
      await channel.send({
        embeds: [openerResponse],
        components: [ccButton],
      });

      // ✅ Edit the deferred reply
      await interaction.editReply({
        content: `✅ Your appeal ticket has been created: <#${channel.id}>`,
      });
    } catch (error) {
      console.error("Error creating appeal ticket:", error);

      // ✅ Edit reply for error handling too!
      await interaction.editReply({
        content: "❌ Failed to create ticket. Please contact staff.",
      });
    }
  }
};
