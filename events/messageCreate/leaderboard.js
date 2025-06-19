const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const staffPoints = require("../../schema/staffPoints");
const ticketSetup = require("../../schema/ticketSchema");

module.exports = async (message, client) => {
  const prefix = "^";
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  const guildId = message.guild.id;
  const member = message.member;
  const entry = await ticketSetup.findOne({ guildId });
  if (!entry) return;

  const highStaffRoleId = entry.highStaffRole;
  if (!member.roles.cache.has(highStaffRoleId)) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  if (command === "leaderboard" || command === "lb") {
    if (process.env.lb === "false") {
      message.reply("Leaderboard Is Set To `FALSE` In Config"),
        console.log(`${message.author.tag} Used ^lb But its set to FALSE`);
      return;
    }
    try {
      let leaderboard = await staffPoints.find().sort({ points: -1 });
      if (!leaderboard.length) {
        return message.reply("No staff points have been recorded yet.");
      }

      const pageSize = 10;
      let currentPage = 0;
      let totalPages = Math.ceil(leaderboard.length / pageSize);

      const generateEmbed = async (page) => {
        leaderboard = await staffPoints.find().sort({ points: -1 });
        totalPages = Math.ceil(leaderboard.length / pageSize);

        const embed = new EmbedBuilder()
          .setTitle("🏆 Staff Leaderboard 🏆")
          .setColor("Gold")
          .setFooter({
            text: `Page ${page + 1} of ${totalPages} | Points LeaderBoard Of Staffs`,
            iconURL: client.user.displayAvatarURL(),
          });

        const start = page * pageSize;
        const end = start + pageSize;
        let position = start + 1;

        for (const staff of leaderboard.slice(start, end)) {
          const user = await client.users.fetch(staff.staffId).catch(() => null);
          embed.addFields({
            name: `#${position} ${user ? user.tag : "Unknown User"}`,
            value: `Points: **${staff.points}**`,
            inline: false,
          });
          position++;
        }

        return embed;
      };

      const createButtons = (disabled = false) =>
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("⬅️ Previous")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("Next ➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled)
        );

      const firstEmbed = await generateEmbed(currentPage);
      const row = createButtons(false);

      const leaderboardMessage = await message.channel.send({
        embeds: [firstEmbed],
        components: [row],
      });

      const filter = (interaction) =>
        interaction.user.id === message.author.id;

      const collector = leaderboardMessage.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (interaction) => {
        try {
          await interaction.deferUpdate(); // ✅ Fix: Acknowledge the interaction

          if (interaction.customId === "prev" && currentPage > 0) {
            currentPage--;
          } else if (
            interaction.customId === "next" &&
            currentPage < totalPages - 1
          ) {
            currentPage++;
          }

          const newEmbed = await generateEmbed(currentPage);
          await leaderboardMessage.edit({
            embeds: [newEmbed],
            components: [createButtons(false)],
          });

        } catch (err) {
          console.error("Error updating leaderboard:", err);
        }
      });

      collector.on("end", async () => {
        const disabledRow = createButtons(true);
        leaderboardMessage.edit({
          components: [disabledRow],
        }).catch(() => { });
      });
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      message.reply("An error occurred while fetching the leaderboard.");
    }
  }
};
