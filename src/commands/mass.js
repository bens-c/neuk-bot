import {
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder
} from 'discord.js';
import { parseDuration } from '../utils.js';

const MAX_ROLE_TARGETS = 100;

const commonRoleOption = (option) =>
  option
    .setName('role')
    .setDescription('Alle moderierbaren Mitglieder mit dieser Rolle')
    .setRequired(true);

const commonReasonOption = (option) =>
  option
    .setName('reason')
    .setDescription('Grund für das Audit-Log')
    .setRequired(true)
    .setMaxLength(400);

const confirmOption = (option) =>
  option
    .setName('confirm')
    .setDescription('Muss auf true gesetzt werden')
    .setRequired(true);

export const data = new SlashCommandBuilder()
  .setName('mass')
  .setDescription('Mitglieder einer ausgewählten Rolle moderieren')
  .setDMPermission(false)
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((command) =>
    command
      .setName('ban')
      .setDescription('Mitglieder einer ausgewählten Rolle bannen')
      .addRoleOption(commonRoleOption)
      .addStringOption(commonReasonOption)
      .addBooleanOption(confirmOption)
      .addIntegerOption((option) =>
        option
          .setName('delete_days')
          .setDescription('Nachrichten der letzten 0 bis 7 Tage löschen')
          .setMinValue(0)
          .setMaxValue(7)
      )
  )
  .addSubcommand((command) =>
    command
      .setName('timeout')
      .setDescription('Mitglieder einer ausgewählten Rolle timeouten')
      .addRoleOption(commonRoleOption)
      .addStringOption((option) =>
        option
          .setName('duration')
          .setDescription('Dauer: z. B. 10m, 2h oder 7d (maximal 28d)')
          .setRequired(true)
          .setMaxLength(10)
      )
      .addStringOption(commonReasonOption)
      .addBooleanOption(confirmOption)
  );

function formatResults(successes, failures) {
  const lines = [`Erfolgreich: **${successes.length}**`, `Fehlgeschlagen/übersprungen: **${failures.length}**`];
  if (failures.length > 0) {
    lines.push('', ...failures.slice(0, 15).map(({ id, reason }) => `• \`${id}\`: ${reason}`));
    if (failures.length > 15) lines.push(`• … und ${failures.length - 15} weitere`);
  }
  return lines.join('\n').slice(0, 1900);
}

async function resolveTargets(interaction, role, action) {
  const invoker = await interaction.guild.members.fetch(interaction.user.id);
  const botMember = interaction.guild.members.me;
  const targets = [];
  const failures = [];

  if (role.id === interaction.guild.id) {
    throw new Error('Die Rolle @everyone darf nicht als Ziel verwendet werden.');
  }
  if (role.managed) {
    throw new Error('Von Discord oder einer Integration verwaltete Rollen sind nicht erlaubt.');
  }
  if (
    interaction.user.id !== interaction.guild.ownerId &&
    role.comparePositionTo(invoker.roles.highest) >= 0
  ) {
    throw new Error('Die Zielrolle muss unter deiner höchsten Rolle stehen.');
  }

  await interaction.guild.members.fetch();
  const members = role.members;
  if (members.size === 0) {
    throw new Error('Diese Rolle hat keine Mitglieder.');
  }
  if (members.size > MAX_ROLE_TARGETS) {
    throw new Error(
      `Diese Rolle hat ${members.size} Mitglieder. Erlaubt sind maximal ${MAX_ROLE_TARGETS} pro Ausführung.`
    );
  }

  for (const member of members.values()) {
    const id = member.id;
    if (id === interaction.user.id || id === interaction.client.user.id) {
      failures.push({ id, reason: 'Selbstaktion bzw. Aktion gegen den Bot ist gesperrt.' });
      continue;
    }
    if (id === interaction.guild.ownerId) {
      failures.push({ id, reason: 'Der Serverinhaber ist geschützt.' });
      continue;
    }
    if (
      interaction.user.id !== interaction.guild.ownerId &&
      member.roles.highest.comparePositionTo(invoker.roles.highest) >= 0
    ) {
      failures.push({ id, reason: 'Die Rolle ist gleich hoch oder höher als deine.' });
      continue;
    }
    if (action === 'ban' && !member.bannable) {
      failures.push({ id, reason: 'Der Bot kann dieses Mitglied nicht bannen.' });
      continue;
    }
    if (action === 'timeout' && !member.moderatable) {
      failures.push({ id, reason: 'Der Bot kann dieses Mitglied nicht timeouten.' });
      continue;
    }
    if (botMember && member.roles.highest.comparePositionTo(botMember.roles.highest) >= 0) {
      failures.push({ id, reason: 'Die Rolle ist gleich hoch oder höher als die Bot-Rolle.' });
      continue;
    }

    targets.push(member);
  }

  return { targets, failures };
}

function requireBotPermission(interaction, permission, label) {
  if (!interaction.guild.members.me?.permissions.has(permission)) {
    throw new Error(`Dem Bot fehlt die Berechtigung „${label}“.`);
  }
}

export async function execute(interaction) {
  if (!interaction.inCachedGuild()) {
    await interaction.reply({ content: 'Dieser Befehl funktioniert nur auf einem Server.', flags: MessageFlags.Ephemeral });
    return;
  }
  if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({ content: 'Nur Administratoren dürfen diesen Befehl verwenden.', flags: MessageFlags.Ephemeral });
    return;
  }
  if (!interaction.options.getBoolean('confirm', true)) {
    await interaction.reply({ content: 'Abgebrochen: `confirm` muss auf `true` stehen.', flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const action = interaction.options.getSubcommand(true);
    const role = interaction.options.getRole('role', true);
    const { targets, failures } = await resolveTargets(interaction, role, action);
    const successes = [];

    if (action === 'ban') {
      requireBotPermission(interaction, PermissionFlagsBits.BanMembers, 'Mitglieder bannen');
      const reason = interaction.options.getString('reason', true);
      const deleteMessageSeconds = (interaction.options.getInteger('delete_days') ?? 0) * 86_400;
      for (const member of targets) {
        try {
          await member.ban({ deleteMessageSeconds, reason: `${reason} | durch ${interaction.user.tag}` });
          successes.push(member.id);
        } catch {
          failures.push({ id: member.id, reason: 'Discord hat den Bann abgelehnt.' });
        }
      }
    }

    if (action === 'timeout') {
      requireBotPermission(interaction, PermissionFlagsBits.ModerateMembers, 'Mitglieder moderieren');
      const duration = parseDuration(interaction.options.getString('duration', true));
      const reason = interaction.options.getString('reason', true);
      for (const member of targets) {
        try {
          await member.timeout(duration, `${reason} | durch ${interaction.user.tag}`);
          successes.push(member.id);
        } catch {
          failures.push({ id: member.id, reason: 'Discord hat den Timeout abgelehnt.' });
        }
      }
    }

    await interaction.editReply(formatResults(successes, failures));
  } catch (error) {
    console.error(error);
    await interaction.editReply(`Fehler: ${error.message ?? 'Unbekannter Fehler'}`);
  }
}
