const {
  EmbedBuilder,
  AttachmentBuilder,
  ChannelType,
  SlashCommandBuilder,
} = require("discord.js");

const channelData = require("../schema/ticketDetail");
const ticketSetup = require("../schema/ticketSchema");
const staffPoints = require("../schema/staffPoints");

const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("close")
    .setDescription("Close the current ticket")
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for closing the ticket")
    ),

  run: async ({ interaction }) => {
    const channel = interaction.channel;
    const guild = interaction.guild;

    console.log(
      `[DEBUG] Close command triggered by ${interaction.user.tag} in ${channel.name}`
    );

    try {
      // Fast reply so it doesn't get stuck
      await interaction.reply({
        content: "🔄 Closing ticket... Generating transcript.",
        flags: 1 << 6,
      });

      // Step 1: Fetch Ticket DB Data
      const channelEntry = await channelData.findOne({ channelId: channel.id });
      if (!channelEntry) {
        console.log(`[DEBUG] No ticket found for this channel.`);
        return interaction.editReply({
          content: "❌ This isn't a valid ticket channel.",
        });
      }

      const ticketConfig = await ticketSetup.findOne({ guildId: guild.id });
      if (!ticketConfig) {
        console.log(`[DEBUG] Ticket system not set up for guild.`);
        return interaction.editReply({
          content: "❌ Ticket system isn't properly set up.",
        });
      }

      const reason =
        interaction.options.getString("reason") || "No reason provided";
      const staffRoleId = ticketConfig.staffRole;

      // Step 2: Permission Check
      const member = await guild.members.fetch(interaction.user.id);
      if (!member.roles.cache.has(staffRoleId)) {
        console.log(`[DEBUG] User lacks permission.`);
        return interaction.editReply({
          content: "❌ You don't have permission to close tickets.",
        });
      }

      // Step 3: Fetch Messages
      const messages = await fetchMessages(channel);
      console.log(`[DEBUG] Messages fetched: ${messages.length}`);

      if (!messages.length) {
        return interaction.editReply({
          content: "❌ No messages found in this ticket.",
        });
      }

      // Step 4: Create Transcript File
      const transcript = messages
        .reverse()
        .map((msg) => {
          const content = msg.content || "[No Content]";
          return `${msg.createdAt.toLocaleString()} | ${msg.author.tag
            }: ${content}`;
        })
        .join("\n");

      const fileName = `transcript-${channel.name}.txt`;
      const filePath = path.join(__dirname, "..", "transcripts", fileName);

      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, transcript);
      console.log(`[DEBUG] Transcript file created: ${fileName}`);

      const attachment = new AttachmentBuilder(filePath);

      // Step 5: Send Closing Message in Ticket Channel
      await channel.send(
        `🔒 This ticket has been closed by <@${interaction.user.id}>. Deleting channel...`
      );

      // Step 6: Send Embed + Transcript in Logs Channel
      const logsChannel = await guild.channels
        .fetch(ticketConfig.transcriptChannelId)
        .catch(() => null);

      if (logsChannel && logsChannel.type === ChannelType.GuildText) {
        const closeEmbed = new EmbedBuilder()
          .setTitle("🎫 Ticket Transcript")
          .setColor(0x9b7dfb)
          .addFields(
            {
              name: "Ticket Name:",
              value: `${interaction.channel.name}`,
              inline: false,
            },
            {
              name: "Ticket Type:",
              value: `${channel.parent?.name || "Unknown"}`,
              inline: false,
            },
            {
              name: "Ticket Closer:",
              value: `${interaction.user.username}`,
              inline: false,
            },
            { name: "Closing Reason:", value: `${reason}`, inline: false }
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

        console.log(`[DEBUG] Embed and transcript sent to logs channel.`);
      }

      // Step 7: Award Staff Points (Optional)
      const claimerId = channelEntry.claimer;
      if (claimerId) {
        let staff = await staffPoints.findOne({ staffId: claimerId });
        if (!staff) {
          staff = new staffPoints({ staffId: claimerId, points: 1 });
        } else {
          staff.points += 1;
        }
        await staff.save();
        console.log(`[DEBUG] Staff points updated for ${claimerId}.`);
      }

      // Step 8: Delete Ticket Entry
      await channelData.deleteOne({ channelId: channel.id });
      console.log(`[DEBUG] Channel entry deleted from DB.`);

      // Step 9: Delete Channel
      await channel.delete();
      console.log(`[DEBUG] Channel deleted.`);

      // Step 10: Cleanup Transcript File
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`[ERROR] Something went wrong:`, err);
      await interaction.editReply({
        content: "❌ Something went wrong while closing the ticket.",
      });
    }
  },
};

async function fetchMessages(channel) {
  let messages = [];
  let lastId = null;

  console.log(`[DEBUG] Fetching messages from ${channel.name}`);

  while (true) {
    const fetched = await channel.messages
      .fetch({ limit: 100, before: lastId })
      .catch((err) => {
        console.error(`[ERROR] Message fetch error:`, err);
        return new Map();
      });

    if (!fetched.size) break;

    messages.push(...fetched.values());
    lastId = fetched.last().id;

    if (messages.length >= 1000) {
      console.log(`[DEBUG] Fetch capped at 1000 messages.`);
      break;
    }
  }

  console.log(`[DEBUG] Done fetching messages.`);
  return messages;
}
