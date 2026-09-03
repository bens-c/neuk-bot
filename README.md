# Discord Mass-Moderationsbot

Ein Discord.js-Bot für PM2 mit den Slash-Commands:

- `/mass ban role:<Rolle> reason:<Grund> confirm:true`
- `/mass timeout role:<Rolle> duration:<10m|2h|7d> reason:<Grund> confirm:true`

Alle Antworten sind nur für den ausführenden Administrator sichtbar. Aktionen gelten für moderierbare Mitglieder der ausdrücklich ausgewählten Rolle. Rollen-Hierarchie und Bot-Rechte werden geprüft. `@everyone` und verwaltete Rollen sind gesperrt; pro Aufruf sind maximal 100 Rollenmitglieder möglich.

## Einrichtung

Voraussetzung: Node.js 22.12 oder neuer.

1. Abhängigkeiten installieren:

   ```bash
   npm install
   ```

2. `.env.example` als `.env` kopieren und Token, Application-ID sowie zum Testen die Server-ID eintragen.

3. Im [Discord Developer Portal](https://discord.com/developers/applications) unter **Bot → Privileged Gateway Intents** den **Server Members Intent** aktivieren.

4. Den Bot mit den Scopes `bot` und `applications.commands` einladen. Benötigte Bot-Rechte: **View Channels**, **Ban Members** und **Moderate Members**. Die Bot-Rolle muss über den zu moderierenden Rollen stehen.

5. Slash-Command registrieren:

   ```bash
   npm run deploy
   ```

6. Mit PM2 starten und den Autostart speichern:

   ```bash
   npx pm2 start ecosystem.config.cjs
   npx pm2 save
   npx pm2 startup
   ```

`pm2 startup` zeigt anschließend einen plattformspezifischen Befehl an, der einmal mit den nötigen Rechten ausgeführt werden muss.

## Beispiele

```text
/mass ban role:@Spam reason:Spam delete_days:1 confirm:true
/mass timeout role:@Timeout duration:2h reason:Beleidigungen confirm:true
```
