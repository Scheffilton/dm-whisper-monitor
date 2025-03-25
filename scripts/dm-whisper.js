Hooks.once("init", () => {
  // Register settings
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
    // Check if module is active
    if (!game.settings.get("dm-whisper-monitor", "enableWhisperSharing")) {
        return;
    }

    // Ensure that message is a whisper
    if (!data.whisper || !Array.isArray(data.whisper) || data.whisper.length === 0) {
        return;
    }

    // Lets get the GM
    const gmUser = game.users.find(u => u.isGM && u.active);
    if (!gmUser) {
        return;
    }

    // Save the message and ensure it's saved (adding GM to the recipients did not work)
    const messageContent = data.content || message.content;
    if (!messageContent) {
        return;
    }

    // Avoid loop
    if (message.whisper && message.whisper.includes(gmUser.id)) {
        return; 
    }

    // Get initial recipient to handover the information to the GM
    const originalRecipient = game.users.get(data.whisper[0]);
    const recipientName = originalRecipient ? originalRecipient.name : "Unbekannt";



    // Hint towards the player that message is shared (if enabled in settings)
    if (userId === game.user.id && game.settings.get("dm-whisper-monitor", "notifyPlayer")) {
            // Send a copy of the message to the GM and show it within the senders chat
            ChatMessage.create({
                speaker: data.speaker,
                whisper: [gmUser.id]
            }).catch((err) => {
                console.error("[DMWhisperMonitor] Error:", err);
            });
        ui.notifications.info(game.i18n.localize("dm-whisper-monitor.notification"), { permanent: false });
    } else {
            // Send a copy of the message to the GM and hide it from senders chat
    ChatMessage.create({
        speaker: gmUser.id,
        whisper: [gmUser.id]
    }).catch((err) => {
        console.error("[DMWhisperMonitor] Error:", err);
    });
    }
});
