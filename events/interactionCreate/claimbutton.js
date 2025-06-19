const fs = require("fs");
const path = require("path");
const ticketSetup = require("../../schema/ticketSchema");
const { claimedChannels } = require("../../claimedChannels"); // Importing the Map

const { Events, PermissionFlagsBits } = require("discord.js");
const channelData = require("../../schema/ticketDetail");

module.exports = async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId !== "claim_button") return;
  let claimer = interaction.user.id;
  const guildId = interaction.guild.id;
  const entry = await ticketSetup.findOne({ guildId });
  let staffRoleId = entry.staffRole;
  const channel = interaction.channel;
  const channelId = channel.id;

  const channelEntry = await channelData.findOne({ channelId });
  if (!channelEntry) {
    return interaction.reply({
      content: "Not A Ticket Channel",
      flags: 1 << 6,
    })
  }
  if (!interaction.member.roles.cache.has(staffRoleId)) {
    return interaction.reply({
      content: "❌ You do not have permission to use this button.",
      flags: 1 << 6,
    });
  }

  // ✅ Check if the channel is already claimed in claimedChannels Map
  try {
    if (channelEntry.claimer) {
      return interaction.reply({
        content: `⚠️ This ticket has already been claimed by A Staff Member.`,
        flags: 1 << 6,
      });
    }
  } catch (error) {

  }
  const openerId = channelEntry.userId;
  try {
    // Get @everyone role ID
    const everyoneRoleId = interaction.guild.roles.everyone.id;
    let openerId = channelEntry.userId;
    let opener;

    try {
      opener = await interaction.guild.members.fetch(openerId);
    } catch (error) {
      console.error("❌ Unable to fetch the user:", error);
      await interaction.reply({
        content:
          "❌ Failed to find the ticket opener. Please contact Bot DEV.",
        flags: 1 << 6,
      });
      return;
    }

    if (interaction.channel.parentId === entry.punishmentAppealC) {
      await channel.permissionOverwrites.set([
        {
          id: interaction.guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: opener.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ]);
    } else {
      await channel.permissionOverwrites.set([
        {
          id: interaction.guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: opener.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: entry.staffRole,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
          ],
          deny: [
            PermissionFlagsBits.SendMessages,
          ]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ]);
    }
    channelEntry.claimer = claimer;
    channelEntry.save(),
      // ✅ Add this channel to the claimedChannels Map and save to file
      claimedChannels.add(channelId);

    await interaction.reply({
      content: `✅ Ticket claimed by ${interaction.user}.`,
    });

    // Optional: Rename the channel to reflect it's claimed
    // await channel.setName(`claimed-${openerId}`);
  } catch (error) {
    console.error("Error claiming ticket:", error);
  }
};

// Function to save the claimedChannels Map to claimedChannels.js
// function saveClaimedChannelsToFile() {
//   const filePath = path.join(__dirname, "../claimedChannels.js");

//   // Convert the Map to an array for serialization
//   const mapArray = Array.from(claimedChannels.entries());

//   const content = `
// const claimedChannels = new Map(${JSON.stringify(mapArray, null, 2)});

// module.exports = { claimedChannels };
// `;

//   fs.writeFile(filePath, content, (err) => {
//     if (err) {
//       console.error("Error saving claimedChannels:", err);
//     } else {
//       console.log("✅ claimedChannels.js updated!");
//     }
//   });
// }
