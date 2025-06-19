const {
  EmbedBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const ticketSetup = require("../../schema/ticketSchema");
const channelData = require("../../schema/ticketDetail");
const staffPoints = require("../../schema/staffPoints");

module.exports = async (interaction, client) => {
  try {
    // BUTTON INTERACTION HANDLER
    if (interaction.isButton() && interaction.customId === "close_button") {
      const channel = interaction.channel;
      const guild = interaction.guild;
      const guildId = guild.id;

      // Get ticket settings and channel data
      const entry = await ticketSetup.findOne({ guildId });
      const channelEntry = await channelData.findOne({ channelId: channel.id });

      if (!entry || !channelEntry) {
        return interaction.reply({
          content: "This is not a valid ticket channel.",
          flags: 1 << 6,
        });
      }

      const staffRoleId = entry.staffRole;
      if (!interaction.member.roles.cache.has(staffRoleId)) {
        return interaction.reply({
          content: "❌ You do not have permission to use this button.",
          flags: 1 << 6,
        });
      }

      // Build and show the modal
      const modal = new ModalBuilder()
        .setCustomId("close_ticket_modal")
        .setTitle("Close Ticket");

      const reasonInput = new TextInputBuilder()
        .setCustomId("close_reason")
        .setLabel("Reason for closing the ticket")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const actionRow = new ActionRowBuilder().addComponents(reasonInput);
      modal.addComponents(actionRow);

      await interaction.showModal(modal);
    }

    // MODAL SUBMIT HANDLER
    if (
      interaction.isModalSubmit() &&
      interaction.customId === "close_ticket_modal"
    ) {
      const channel = interaction.channel;
      const guild = interaction.guild;
      const guildId = guild.id;

      const entry = await ticketSetup.findOne({ guildId });
      const channelEntry = await channelData.findOne({ channelId: channel.id });
      const staffPLogChannel = entry.pointsLog;
      const channelPLog = guild.channels.cache.get(staffPLogChannel);

      if (!entry || !channelEntry) {
        return interaction.reply({
          content: "This is not a valid ticket channel.",
          flags: 1 << 6,
        });
      }

      const reason = interaction.fields.getTextInputValue("close_reason");

      // Send initial message about transcript generation
      await interaction.reply({
        content: "📄 Transcript is generating...",
        flags: 1 << 6,
      });

      // Generate transcript
      const messages = await channel.messages.fetch({ limit: 100 });
      const sortedMessages = messages.sort(
        (a, b) => a.createdTimestamp - b.createdTimestamp
      );

      let transcriptContent = `Transcript of ${channel.name}\nClosed by: ${interaction.user.tag}\nReason: ${reason}\n\n`;

      sortedMessages.forEach((msg) => {
        transcriptContent += `[${new Date(
          msg.createdTimestamp
        ).toLocaleString()}] ${msg.author.tag}: ${msg.content}\n`;

        if (msg.attachments.size > 0) {
          msg.attachments.forEach((attachment) => {
            transcriptContent += `    📎 Attachment: ${attachment.url}\n`;
          });
        }
      });

      // Save transcript file
      const transcriptsDir = path.join(__dirname, "../../transcripts");
      if (!fs.existsSync(transcriptsDir)) {
        fs.mkdirSync(transcriptsDir);
      }

      const fileName = `transcript-${channel.name}-${Date.now()}.txt`;
      const filePath = path.join(transcriptsDir, fileName);
      fs.writeFileSync(filePath, transcriptContent);

      const attachment = new AttachmentBuilder(filePath);

      // Send transcript to log channel and opener
      const logChannelId = entry.transcriptChannelId;
      const logsChannel = client.channels.cache.get(logChannelId);

      if (logsChannel) {
        const closeEmbed = new EmbedBuilder()
          .setTitle("🎫 Ticket Transcript")
          .setColor(0x9b7dfb)
          .addFields(
            { name: "Ticket Name:", value: channel.name },
            { name: "Ticket Type:", value: channel.parent?.name || "Unknown" },
            { name: "Ticket Closer:", value: interaction.user.username },
            { name: "Closing Reason:", value: reason }
          )
          .setTimestamp();

        await logsChannel.send({
          embeds: [closeEmbed],
          files: [attachment],
        });
        try {
          // Send transcript to opener (if they exist)
          const openerId = channelEntry.userId;
          const opener = await interaction.guild.members.fetch(openerId).catch(() => null);
          if (opener && opener.user) {
            await opener.user.send({
              embeds: [closeEmbed],
              files: [attachment],
            }).catch(() => {
              console.log(`❌ Could not send transcript to user ${openerId}`);
            });
          }
        } catch (error) { console.log(error) }
      }

      // Delete transcript file after sending (optional)
      fs.unlink(filePath, (err) => {
        if (err) console.error("❗ Error deleting transcript file:", err);
      });
      // Staff Points Logic
      const staffId = channelEntry.claimer;

      if (staffId) {
        let staff = await staffPoints.findOne({ staffId });

        if (!staff) {
          staff = new staffPoints({
            staffId,
            points: 1,
          });
        } else {
          staff.points += 1;
        }

        await staff.save();

        await channelEntry.deleteOne();

        const staffPEmbed = new EmbedBuilder()
          .setTitle(`✅ Staff Point Awarded`)
          .setDescription(
            `+1 point to <@${staffId}> for handling ticket **${channel.name}**`
          )
          .addFields({ name: "Total Points", value: `${staff.points}` })
          .setColor("Random");

        if (channelPLog) {
          await channelPLog.send({ embeds: [staffPEmbed] });
        }
      }

      // Finally, delete the ticket channel
      await channel.delete(
        `Ticket closed by ${interaction.user.tag} | Reason: ${reason}`
      );
    }
  } catch (error) {
    console.error("❗ Error in ticket close flow:", error);

    if (interaction.replied || interaction.deferred) {
      interaction.followUp({
        content: "❌ Something went wrong while closing the ticket.",
        flags: 1 << 6,
      });
    } else {
      interaction.reply({
        content: "❌ Something went wrong while closing the ticket.",
        flags: 1 << 6,
      });
    }
  }
};
