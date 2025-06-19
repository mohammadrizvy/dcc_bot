require("dotenv/config");
const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const { CommandHandler } = require("djs-commander");
const path = require("path");
const mongoose = require("mongoose");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Remember to enable in Dev Portal!
    GatewayIntentBits.GuildMembers,   // Add this if you need member data
  ],
});

// MongoDB Connection
async function connectToDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI not found in environment variables!");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully!");
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// Initialize djs-commander for command + event handling
new CommandHandler({
  client,
  commandsPath: path.join(__dirname, "commands"),
  eventsPath: path.join(__dirname, "events"), // Optional if you have events
});

// ================================  No Staff Ping LOGIC ==========================================
// client.on("messageCreate", async (message) => {
//   if (message.author.bot) return;

//   const staffRoleId = '1295341291994873886';
//   if (message.mentions.roles.has(staffRoleId)) {
//     if (!message.member.roles.cache.has(staffRoleId)) {
//       try {
//         await message.delete();

//         await message.author.send({
//           content: `You are not allowed to ping the staff role in **${message.guild.name}**.`,
//         });
//       } catch (err) {
//         console.error('Failed to delete message or send DM:', err);
//       }
//     }
//   }
// });

client.on("ready", () => {
  console.log("✅ Bot Online Successfully!");

  client.user.setActivity({
    name: "FxG  Made By Mr_Vari",
    type: ActivityType.Watching,
  });
});

// Error handling for the bot
client.on("error", (error) => {
  console.error("❌ Discord client error:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled promise rejection:", error);
});

// Initialize bot
async function startBot() {
  try {
    await connectToDatabase();

    if (!process.env.TOKEN) {
      console.error("❌ TOKEN not found in environment variables!");
      process.exit(1);
    }

    await client.login(process.env.TOKEN);
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
}

startBot();
