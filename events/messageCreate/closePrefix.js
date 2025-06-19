const { EmbedBuilder, AttachmentBuilder, ChannelType } = require("discord.js");
const fs = require("fs");
const path = require("path");
const ticketSetup = require("../../schema/ticketSchema");
const channelData = require("../../schema/ticketDetail");
const staffPoints = require("../../schema/staffPoints");

module.exports = async (message) => {
  const guildId = message.guild.id;
  const channel = message.channel;
  const member = message.member;
  const guild = message.guild;
  const prefix = "^";
  const command = "close";
  const channelId = channel.id;
  const channelEntry = await channelData.findOne({ channelId });

  // Make sure it's the right command
  if (!message.content.toLowerCase().startsWith(`${prefix}${command}`)) return;

  const args = message.content
    .slice(prefix.length + command.length)
    .trim()
    .split(/ +/);
  const reason = args.join(" ") || "No reason provided";

  const entry = await ticketSetup.findOne({ guildId });

  if (!entry) {
    return message.reply("❌ Ticket system is not set up in this server.");
  }

  const staffPLogChannel = entry.pointsLog;
  const channelPLog = message.guild.channels.cache.get(staffPLogChannel);
  const staffRoleId = entry.staffRole;
  const transcriptChannelId = entry.transcriptChannelId;

  // Validate ticket channel
  if (!channelEntry) {
    console.log(`Invalid Ticket Channel ${channel}`);
    return message.reply("❌ This is not a valid ticket channel.");
  }

  // Check staff role
  if (!member.roles.cache.has(staffRoleId)) {
    return message.reply("❌ You don't have access to this command.");
  }

  // Notify about ticket closure
  await message.reply("✅ This ticket will be closed in 15 seconds...");

  try {
    const openerId = channelEntry.userId;
    const opener = await message.guild.members.fetch(openerId).catch(() => null);

    const messages = await fetchMessages(channel);

    if (!messages.length) {
      return message.reply("❌ No messages found in this channel.");
    }

    // Format the transcript
    const transcript = messages
      .reverse()
      .map(
        (m) =>
          `${new Date(m.createdTimestamp).toLocaleString()} | ${
            m.author.tag
          }: ${m.content || "[Embed/Attachment]"}`
      )
      .join("\n");

    // Create file
    const fileName = `transcript-${channel.name}.txt`;
    const filePath = path.join(__dirname, "..", "..", "transcripts", fileName);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, transcript);

    const attachment = new AttachmentBuilder(filePath);

    // Send transcript to ticket channel
    await channel.send({
      content: `📑 Transcript has been generated.`,
      files: [attachment],
    });

    // Send transcript to opener (if they exist)
    if (opener && opener.user) {
      await opener.user.send({
        content: `Transcript Of Your Opened Ticket: ${channel.name}`,
        files: [attachment],
      }).catch(() => {
        console.log(`❌ Could not send transcript to user ${openerId}`);
      });
    }

    // Send transcript to logs channel
    const logsChannel = await message.guild.channels
      .fetch(transcriptChannelId)
      .catch((err) => {
        console.error("Failed to fetch logs channel:", err);
      });

    if (logsChannel && logsChannel.type === ChannelType.GuildText) {
      const closeEmbed = new EmbedBuilder()
        .setTitle("🎫 Ticket Transcript")
        .setColor(0x9b7dfb)
        .addFields(
          { name: "Ticket Name:", value: channel.name },
          { name: "Ticket Type:", value: channel.parent?.name || "Unknown" },
          { name: "Ticket Closer:", value: message.author.username },
          { name: "Closing Reason:", value: reason }
        )
        .setTimestamp();

      await logsChannel.send({
        embeds: [closeEmbed],
        files: [attachment],
      });
    }

    // Delete the transcript file after sending
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error("Transcript Error:", error);
    return message.reply("❌ An error occurred while generating the transcript.");
  }

  // ✅ Get claimer ID before deleting the channelEntry
  const staffId = channelEntry.claimer;

  // Delete the channel entry from the database
  try {
    await channelEntry.deleteOne();
  } catch (error) {
    console.error("Error deleting channel entry:", error);
  }

  // Delete the channel after 15 seconds
  setTimeout(() => {
    channel.delete().catch(console.error);
  }, 15000);

  // Staff Points Logic
  if (!staffId) {
    console.log("❌ No claimer ID found for this ticket.");
    return;
  }

  let staff = await staffPoints.findOne({ staffId });

  if (!staff) {
    // Create new staff entry
    staff = new staffPoints({
      staffId: staffId,
      points: 1,
    });
    await staff.save();
  } else {
    staff.points = staff.points + 1;
    await staff.save();
  }

  const staffPEmbed = new EmbedBuilder()
    .setTitle(`Point Added To Staff:`)
    .setDescription(`Point Added **+1 Points** To <@${staffId}>`)
    .addFields(
      {
        name: "Reason:",
        value: `Handling Ticket - **${channel.name}**`,
      },
      {
        name: "Total Points:",
        value: `${staff.points}`,
      }
    )
    .setColor("Random");

  if (channelPLog) {
    channelPLog.send({
      embeds: [staffPEmbed],
    }).catch(console.error);
  } else {
    console.log("❌ Staff points log channel not found.");
  }

  // Staff-Points-Done!!!!.
};

async function fetchMessages(channel) {
  let messages = [];
  let lastId;

  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;

    const fetched = await channel.messages.fetch(options);

    if (fetched.size === 0) break;

    messages.push(...fetched.map((msg) => msg));
    lastId = fetched.last()?.id;
  }

  return messages;
}
