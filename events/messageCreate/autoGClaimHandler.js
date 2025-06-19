const ticketSetup = require("../../schema/ticketSchema");
const channelData = require("../../schema/ticketDetail");
const { EmbedBuilder, ActionRowBuilder } = require("discord.js");
const EMOJI = require("../../emoji");

module.exports = async (message) => {
  const guildId = message.guild.id;
  const channel = message.channel;
  const channelId = channel.id;
  const channelEntry = await channelData.findOne({ channelId });
  const entry = await ticketSetup.findOne({ guildId });
  try {
    const autoClaim = new EmbedBuilder()
      .setTitle(`🎉 Congratulations For Winning Giveaway!`)
      .setDescription("Please Wait For Staffs.");

    // Check if entry exists
    if (!entry) {
      return;
    }

    // Check if giveawayClaimC exists
    if (!entry.giveawayClaimC) {
      console.log("giveawayClaimC is missing in the entry.");
      return;
    }

    const categoryId = entry.giveawayClaimC;
    const staffRoleId = entry.staffRole;

    // Parent category check
    if (channel.parentId !== categoryId) {
      return;
    }
    // if (message.mentions.roles.has(staffRoleId) && message.author.bot) {
    //   channel.send({
    //     content: `Hi, <@${channelEntry.userId}>
    // > 🎉 Congratulations for winning the giveaway! 🎉
    // > \n> ${EMOJI.tick} Please provide **proof** of your winning. ${EMOJI.tick}\n> After giving proof, please **create an auction (BIN)** ${EMOJI.moneybag} of your winning amount **for 48 hours** & **ping the giveaway host** ${EMOJI.bluecrown}.`,
    //   });
    // }
    // if (
    //   message.content.toLowerCase() === "proof" &&
    //   message.author.id === channelEntry.userId
    // ) {
    //   channel.send({
    //     content: `<@${channelEntry.userId}> Thanks For Proof. \n >>> Please Create An Auction Of Your Winning Amount For 24 Hours & Ping The Giveaway Host.`,
    //   });
    // }
  } catch (error) {
    console.error("An error occurred:", error);
    return;
  }
};
