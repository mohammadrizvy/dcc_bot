const ticketSchema = require("../schema/ticketSchema");
const ticketSetup = require("../schema/ticketSchema");
const {
  EmbedBuilder,
  SlashCommandBuilder,
  PermissionsBitField,
  EntitlementOwnerType,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticketsetup")
    .setDescription("Setup Tickets")

    // Subcommand: check
    .addSubcommand((subcommand) =>
      subcommand.setName("check").setDescription("Check your setup.")
    )

    // Subcommand: set
    .addSubcommand((subcommand) =>
      subcommand
        .setName("id")
        .setDescription("Set the Staff Role ID.")
        .addStringOption((option) =>
          option
            .setName("highstaff")
            .setDescription("Role Id Will Have Access To /panel Command")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("ticketstaff")
            .setDescription(
              "Role Id Will Have Permission To Ticket Related Commands."
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("transcriptchannel")
            .setDescription("Channel Id Of Ticket Transcript Channel ")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("giveawaycategory")
            .setDescription(
              "Category Where All Giveaway Tickets Will Be Created"
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("punishmentcategory")
            .setDescription(
              "Category Where All Punishment Appeal Tickets Will Be Created"
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("othercategory")
            .setDescription("Category Where Other Type Tickets Will Be Created")
            .setRequired(true)
        )
    ),

  run: async ({ interaction }) => {
    try {
      // Check if it's a chat input command first
      if (!interaction.isChatInputCommand()) return;

      const guildId = interaction.guild.id;

      // Check for administrator permissions once
      const hasAdmin = interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      );
      if (!hasAdmin) {
        return interaction.reply({
          content: "You don't have permission to use this command.",
          flags: 1 << 6,
        });
      }
      const setup = await ticketSetup.findOne({ guildId });

      // Now it's safe to get the subcommand
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === "id") {
        const highStaffRoleId = interaction.options.getString("highstaff");
        const ticketStaffRoleId = interaction.options.getString("ticketstaff");
        const tcId = interaction.options.getString("transcriptchannel");
        const gcId = interaction.options.getString("giveawaycategory");
        const pacId = interaction.options.getString("punishmentcategory");
        const ocId = interaction.options.getString("othercategory");

        let existingId = await ticketSetup.findOne({ guildId });

        if (existingId) {
          existingId.highStaffRole = highStaffRoleId;
          existingId.staffRole = ticketStaffRoleId;
          existingId.transcriptChannelId = tcId;
          existingId.giveawayClaimC = gcId;
          existingId.punishmentAppealC = pacId;
          existingId.otherC = ocId;
          await existingId.save();
          console.log(`Updated Id's Of Guild: ${guildId},\n
             highStaffRole: ${highStaffRoleId},\n
            staffRole: ${ticketStaffRoleId},\n
            transcriptChannelId: ${tcId},\n
            giveawayClaimC: ${gcId},\n
            punishmentAppealC: ${pacId},\n
            otherC: ${ocId},\n
            ----------END----------`);

          return interaction.reply({
            content: `Role ID updated,\n High Staff:**${highStaffRoleId}** \n Staff Id: **${ticketStaffRoleId}** \n Transcript ChannelID: ${tcId}\n PunishmentAppealC-ID: ${pacId}\n GiveawayClaimC-ID: ${gcId}\n OtherC-ID: ${ocId}.`,
          });
        } else {
          const newEntry = new ticketSetup({
            guildId,
            highStaffRole: highStaffRoleId,
            staffRole: ticketStaffRoleId,
            transcriptChannelId: tcId,
            giveawayClaimC: gcId,
            punishmentAppealC: pacId,
            otherC: ocId,
          });

          await newEntry.save();
          console.log(`Created New  Id's Setup Of Guild: ${guildId},\n
            highStaffRole: ${highStaffRoleId},\n
            staffRole: ${ticketStaffRoleId},\n
            transcriptChannelId: ${tcId},\n
            giveawayClaimC: ${gcId},\n
            punishmentAppealC: ${pacId},\n
            otherC: ${ocId},\n
            ----------END----------`);

          return interaction.reply({
            content: `New Data Saved! Use Command **/ticketsetup check** To Check New Set Of Id's`,
          });
        }
      } else if (subcommand === "check") {
        const entry = await ticketSetup.findOne({ guildId });

        if (entry) {
          console.log(` Guild: ${guildId} Has Tried To View Their Setup,\n
             highStaffRole: ${entry.highStaffRole},\n
            staffRole: ${entry.staffRole},\n
            transcriptChannelId: ${entry.transcriptChannelId},\n
            giveawayClaimC: ${entry.giveawayClaimC},\n
            punishmentAppealC: ${entry.punishmentAppealC},\n
            otherC: ${entry.otherC},\n
            ----------END----------`);
          const checkEmbed = new EmbedBuilder()
            .setTitle(
              `Ticket Setup! Of Your Guild: ***${interaction.guild.name}***`
            )
            .setDescription("Id Allowence Setup Of Your Guild")
            .addFields(
              { name: "High-Staff-RoleID:", value: entry.highStaffRole },
              { name: "Ticket-Staff-RoleID:", value: entry.staffRole },
              {
                name: "Transcript-Channel-ID:",
                value: entry.transcriptChannelId,
              },
              { name: "Giveaway-Category-ID:", value: entry.giveawayClaimC },
              {
                name: "PunishmentAppeal-Category-ID:",
                value: entry.punishmentAppealC,
              },
              { name: "Other-Ticket-Category-ID:", value: entry.otherC }
            )
            .setColor(0x7ffb3f);

          return interaction.reply({
            //   content: `Your Role ID is currently set to \n High Staff:**${entry.highStaffRole}** \n Staff Id: **${entry.staffRole}** \n Transcript ChannelID: ${entry.transcriptChannelId}\n PunishmentAppealC-ID: ${entry.punishmentAppealC}\n GiveawayClaimC-ID: ${entry.giveawayClaimC}\n OtherC-ID: ${entry.otherC}.`,
            embeds: [checkEmbed],
          });
        } else {
          console.log(
            `Guild: ${guildId} Has Tried To Check Their Setup But The Have'nt Setted It up Yet.`
          );
          return interaction.reply({
            content: "No Role ID found. Please set one first!",
          });
        }
      }

      // Default fallback (shouldn't be reached)
      return interaction.reply({
        content: "Unknown subcommand used.",
        flags: 1 << 6,
      });
    } catch (error) {
      console.error("Error in ticketsetup command:", error);
      return interaction.reply({
        content: "An error occurred while processing your request.",
        flags: 1 << 6,
      });
    }
  },
};
