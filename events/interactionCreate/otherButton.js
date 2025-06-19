const ticketSetup = require("../../schema/ticketSchema");

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
const channelData = require("../../schema/ticketDetail");
require("dotenv").config();
const EMOJI = require("../../emoji");

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;
  const entry = await ticketSetup.findOne({ guildId });
  let staffRoleId = entry.staffRole;
  // Button Interaction Handling
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "ticket_select_menu"
  ) {
    const selected = interaction.values[0]; // Get selected option

    if (selected === "other_ticket") {
      const modal = new ModalBuilder()
        .setCustomId("other_modal")
        .setTitle("Other Ticket");

      const otherType = new TextInputBuilder()
        .setCustomId("other_type")
        .setLabel("Ticket Topic: (Eg.Member Report,etc)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const otherIssue = new TextInputBuilder()
        .setCustomId("other_issue")
        .setLabel("Explain Your Issue: ")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      // const otherOptional = new TextInputBuilder()
      //   .setCustomId("other_optional")
      //   .setLabel("Anything Else We Should Know ? (Optional)")
      //   .setStyle(TextInputStyle.Paragraph)
      //   .setRequired(false);

      const firstRow = new ActionRowBuilder().addComponents(otherType);
      const secondRow = new ActionRowBuilder().addComponents(otherIssue);
      // const thirdRow = new ActionRowBuilder().addComponents(otherOptional);

      modal.addComponents(firstRow, secondRow);

      await interaction.showModal(modal);
    }
  }
  if (interaction.isButton() && interaction.customId === "other_button") {
    const modal = new ModalBuilder()
      .setCustomId("other_modal")
      .setTitle("Other Ticket");

    const otherType = new TextInputBuilder()
      .setCustomId("other_type")
      .setLabel("Ticket Topic: (Eg.Member Report,etc)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const otherIssue = new TextInputBuilder()
      .setCustomId("other_issue")
      .setLabel("Explain Your Issue: ")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    // const otherOptional = new TextInputBuilder()
    //   .setCustomId("other_optional")
    //   .setLabel("Anything Else We Should Know ? (Optional)")
    //   .setStyle(TextInputStyle.Paragraph)
    //   .setRequired(false);

    const firstRow = new ActionRowBuilder().addComponents(otherType);
    const secondRow = new ActionRowBuilder().addComponents(otherIssue);
    // const thirdRow = new ActionRowBuilder().addComponents(otherOptional);

    modal.addComponents(firstRow, secondRow);

    await interaction.showModal(modal);
  }

  // Modal Submission Handling
  if (interaction.isModalSubmit() && interaction.customId === "other_modal") {
    const other_type = interaction.fields.getTextInputValue("other_type");
    const other_matter = interaction.fields.getTextInputValue("other_issue");
    // const other_optional =
    //   interaction.fields.getTextInputValue("other_optional") || "N/A";

    const openerResponse = new EmbedBuilder()
      .setTitle(`${EMOJI.other} Other`)
      .setDescription("Response provided by ticket opener")
      .setColor(0x2dfbd2)
      .addFields(
        { name: "Ticket Topic:", value: other_type },
        { name: "Issue:", value: other_matter }
      );

    try {
      // ✅ Defer the reply first!
      await interaction.deferReply({ flags: 1 << 6 });

      const sanitizedUsername = interaction.user.username
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();

      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
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
          {
            id: staffRoleId, // Staff role
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
          },
        ],
      });

      await channel.setParent(entry.otherC, {
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
            .setDescription('👋 Welcome! Your support ticket has been created. The staff team will be with you shortly. Please be patient.')
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

      // ✅ Edit the deferred reply instead of reply()
      await interaction.editReply({
        content: `✅ Your ticket has been created: <#${channel.id}>`,
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
