import 'dotenv/config';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { execute as executeMass } from './commands/mass.js';

if (!process.env.DISCORD_TOKEN) {
  throw new Error('DISCORD_TOKEN fehlt. Kopiere .env.example nach .env und trage den Token ein.');
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Bot ist als ${readyClient.user.tag} online.`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'mass') return;

  try {
    await executeMass(interaction);
  } catch (error) {
    console.error('Unbehandelter Command-Fehler:', error);
    const response = { content: 'Beim Ausführen ist ein unerwarteter Fehler aufgetreten.' };
    if (interaction.deferred || interaction.replied) await interaction.editReply(response);
    else await interaction.reply({ ...response, ephemeral: true });
  }
});

client.on(Events.Error, (error) => console.error('Discord-Client-Fehler:', error));

await client.login(process.env.DISCORD_TOKEN);
