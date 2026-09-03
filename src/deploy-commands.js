import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { data as massCommand } from './commands/mass.js';

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  throw new Error('DISCORD_TOKEN und DISCORD_CLIENT_ID müssen in .env gesetzt sein.');
}

const rest = new REST().setToken(DISCORD_TOKEN);
const route = DISCORD_GUILD_ID
  ? Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID)
  : Routes.applicationCommands(DISCORD_CLIENT_ID);

await rest.put(route, { body: [massCommand.toJSON()] });
console.log(
  DISCORD_GUILD_ID
    ? `Command auf Testserver ${DISCORD_GUILD_ID} registriert.`
    : 'Command global registriert (die Anzeige kann bis zu einer Stunde dauern).'
);
