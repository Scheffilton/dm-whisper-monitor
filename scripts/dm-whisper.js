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
    // Wenn das Modul in den Einstellungen deaktiviert ist, nichts tun
    if (!game.settings.get("dm-whisper-monitor", "enableWhisperSharing")) {
        return;
    }

    // Sicherstellen, dass die Nachricht eine Flüsternachricht ist
    if (!data.whisper || !Array.isArray(data.whisper) || data.whisper.length === 0) {
        return;
    }

    // Den GM finden
    const gmUser = game.users.find(u => u.isGM && u.active);
    if (!gmUser) {
        return;
    }

    // Wenn der GM noch nicht in der Whisper-Liste ist, füge ihn hinzu
    if (!data.whisper.includes(gmUser.id)) {
        data.whisper.push(gmUser.id);
        options.whisper = data.whisper;
        options.visibleTo = data.whisper;
    } 

    // Den Inhalt der ursprünglichen Nachricht explizit sichern
    const messageContent = data.content || message.content;
    if (!messageContent) {
        return;
    }

    // Verhindern von Endlosschleifen, falls die Nachricht bereits für den GM gesendet wurde
    if (message.whisper && message.whisper.includes(gmUser.id)) {
        return; // Verhindert das erneute Senden
    }

    // Empfänger der ursprünglichen Flüsternachricht ermitteln
    const originalRecipient = game.users.get(data.whisper[0]);
    const recipientName = originalRecipient ? originalRecipient.name : "Unbekannt";

    // Kopie der Nachricht nur für den GM senden
    ChatMessage.create({
        content: `[Whisper-Kopie an den GM]: ${messageContent}<br><br><i>Ursprünglicher Empfänger: ${recipientName}</i>`,  // Inhalt und Empfängername
        speaker: data.speaker,
        whisper: [gmUser.id]
    }).catch((err) => {
        console.error("[DMWhisperMonitor] Error:", err);
    });

    // Hinweis für den Spieler senden, je nach Einstellung
    if (userId === game.user.id && game.settings.get("dm-whisper-monitor", "notifyPlayer")) {
        ui.notifications.info(game.i18n.localize("dm-whisper-monitor.notification"), { permanent: false });
    }
});
