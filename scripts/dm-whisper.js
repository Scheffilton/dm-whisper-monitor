Hooks.once("init", () => {
  // Register module settings
  game.settings.register("dm-whisper-monitor", "enableWhisperSharing", {
    name: game.i18n.localize("dm-whisper-monitor.settings.enableWhisperSharing"),
    hint: game.i18n.localize("dm-whisper-monitor.settings.enableWhisperSharingHint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("dm-whisper-monitor", "notifyPlayer", {
    name: game.i18n.localize("dm-whisper-monitor.settings.notifyPlayer"),
    hint: game.i18n.localize("dm-whisper-monitor.settings.notifyPlayerHint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
});

Hooks.on("preCreateChatMessage", (message, data, options, userId) => {
    if (!game.settings.get("dm-whisper-monitor", "enableWhisperSharing")) {
        return;
    }

    // Sicherstellen, dass es sich um eine Flüsternachricht handelt
    if (!data.whisper || !Array.isArray(data.whisper) || data.whisper.length === 0) {
        return;
    }

    // Alle aktiven GMs finden
    const gmUsers = game.users.filter(user => user.isGM && user.active).map(user => user.id);

    if (gmUsers.length === 0) {
        return;
    }

    // Den Inhalt der ursprünglichen Nachricht sichern
    const messageContent = data.content || message.content;
    if (!messageContent) {
        return;
    }

    // Prüfen, ob einer der GMs bereits in der Flüsterliste ist (um Endlosschleife zu verhindern)
    if (data.whisper.some(id => gmUsers.includes(id))) {
        return; // GM hat die Nachricht bereits erhalten
    }

    // Empfänger der ursprünglichen Flüsternachricht ermitteln
    const originalRecipients = data.whisper.map(id => game.users.get(id)?.name || game.i18n.localize("dm-whisper-monitor.lang.unknown")).join(", ");

    // Hinweis für den Spieler senden, falls aktiviert
    if (userId === game.user.id && game.settings.get("dm-whisper-monitor", "notifyPlayer")) {
        ui.notifications.info(game.i18n.localize("dm-whisper-monitor.notification"), { permanent: false });
    }

    // Kopie der Nachricht nur für die GMs senden
    ChatMessage.create({
        content: `[${game.i18n.localize("dm-whisper-monitor.lang.hintdmcopy")}]: ${messageContent}<br><br><i>${game.i18n.localize("dm-whisper-monitor.lang.originalRecipient")}: ${originalRecipients}</i>`,
        speaker: { alias: "Flüstermonitor" },
        whisper: gmUsers
    }).catch((err) => {
        console.error("[DMWhisperMonitor] Fehler:", err);
    });
});

Hooks.on("renderChatMessage", (message, html, data) => {
    // Prüfen, ob es sich um eine DM-Kopie handelt
    if (message.whisper.length > 0 && message.content.includes(`[${game.i18n.localize("dm-whisper-monitor.lang.hintdmcopy")}]`)) {
        // Falls der aktuelle User kein GM ist und "notifyPlayer" deaktiviert ist, Nachricht verstecken
        if (!game.user.isGM && !game.settings.get("dm-whisper-monitor", "notifyPlayer")) {
            html.hide(); // Nachricht nur für Spieler ausblenden
        }
    }
});
