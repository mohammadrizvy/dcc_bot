# Discord Ticket Bot

A Discord bot for managing support tickets with MongoDB integration.

## Features

- 🎫 Ticket creation system
- 🎁 Giveaway claim tickets
- ⚖️ Punishment appeal tickets
- 📝 Other support tickets
- 📊 Staff points system
- 📄 Transcript generation
- 🔐 Role-based permissions

## Setup Instructions

### 1. Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- Discord Bot Token

### 2. Installation

1. Clone or download this repository
2. Navigate to the bot directory:
   ```bash
   cd bot
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### 3. Environment Configuration

Create a `.env` file in the bot directory with the following variables:

```env
# Discord Bot Token
TOKEN=your_discord_bot_token_here

# MongoDB Connection URI
MONGODB_URI=your_mongodb_connection_string_here
```

**Important:** Replace the placeholder values with your actual credentials.

### 4. Bot Setup

1. **Invite the bot to your server** with the following permissions:
   - Administrator (recommended) or specific permissions:
     - Manage Channels
     - Send Messages
     - Read Message History
     - Use Slash Commands
     - Manage Roles

2. **Configure the bot** using the setup command:
   ```
   /ticketsetup id
   ```
   
   You'll need to provide:
   - High Staff Role ID (for panel access)
   - Ticket Staff Role ID (for ticket management)
   - Transcript Channel ID
   - Giveaway Category ID
   - Punishment Appeal Category ID
   - Other Category ID

3. **Create the ticket panel**:
   ```
   /panel
   ```

### 5. Running the Bot

```bash
node index.js
```

## Commands

### Admin Commands
- `/ticketsetup id` - Configure bot settings
- `/ticketsetup check` - View current configuration
- `/panel` - Create ticket panel (requires High Staff role)

### Staff Commands
- `/claim` - Claim a ticket
- `/unclaim` - Unclaim a ticket
- `/close` - Close a ticket
- `/adduser` - Add user to ticket
- `/removeuser` - Remove user from ticket
- `/transcript` - Generate ticket transcript

## Troubleshooting

### Common Issues

1. **"MONGODB_URI not found"**
   - Make sure your `.env` file exists and contains the MONGODB_URI variable
   - Check that the MongoDB connection string is correct

2. **"TOKEN not found"**
   - Ensure your `.env` file contains the TOKEN variable
   - Verify your Discord bot token is correct

3. **"Ticket setup not found"**
   - Run `/ticketsetup id` to configure the bot first
   - Make sure you have Administrator permissions

4. **Permission errors**
   - Check that the bot has the required permissions
   - Verify role IDs are correct in the setup

5. **Database connection issues**
   - Ensure MongoDB is running and accessible
   - Check your MongoDB connection string
   - Verify network connectivity

### Error Logs

The bot logs errors to the console. Common error messages:

- `❌ Failed to connect to MongoDB` - Database connection issue
- `❌ Discord client error` - Discord API issue
- `❌ Unhandled promise rejection` - Unexpected error

## Support

If you encounter issues:

1. Check the console for error messages
2. Verify all environment variables are set correctly
3. Ensure the bot has proper permissions
4. Check that MongoDB is accessible

## License

This project is licensed under the ISC License. 