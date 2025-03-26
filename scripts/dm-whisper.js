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
	console.log(game.settings.get("dm-whisper-monitor", "enableWhisperSharing"));
	if(!game.settings.get("dm-whisper-monitor", "enableWhisperSharing")){
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
    const recipientName = originalRecipient ? originalRecipient.name : game.i18n.localize("dm-whisper-monitor.lang.unknown");


    // Hinweis für den Spieler senden, je nach Einstellung
    if (userId === game.user.id && game.settings.get("dm-whisper-monitor", "notifyPlayer")) {
        ui.notifications.info(game.i18n.localize("dm-whisper-monitor.notification"), { permanent: false });
    
    } 
	
		    // Kopie der Nachricht nur für den GM senden
    ChatMessage.create({
        content: `[${game.i18n.localize("dm-whisper-monitor.lang.hintdmcopy")}]: ${messageContent}<br><br><i>${game.i18n.localize("dm-whisper-monitor.lang.originalRecipient")}: ${recipientName}</i><br><br>IdentifierForDMWhisper`,  // Inhalt und Empfängername
        speaker: [],
        whisper: [gmUser.id]
    }).catch((err) => {
        console.error("[DMWhisperMonitor] Error:", err);
    });
	
});

Hooks.on("renderChatMessage", (message, html, data) => {
    // Prüfen, ob es sich um eine DM-Kopie handelt
    if (message.whisper.length > 0 && message.content.includes("IdentifierForDMWhisper")) {

        // Falls der aktuelle User kein GM ist und die Einstellung aktiv ist, Nachricht verstecken
        if (!game.user.isGM && !game.settings.get("dm-whisper-monitor", "notifyPlayer")) {
            html.hide(); // Nachricht nur im Chat ausblenden
        }
    }
});
