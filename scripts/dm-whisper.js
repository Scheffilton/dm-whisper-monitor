Hooks.once("init", () => {
    game.settings.register("whisper-to-gm", "enableWhisperSharing", {
        name: game.i18n.localize("whisper-to-gm.setting.name"),
        hint: game.i18n.localize("whisper-to-gm.setting.hint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });
});

Hooks.on("chatMessage", (chatLog, message, chatData) => {
    if (!game.settings.get("whisper-to-gm", "enableWhisperSharing")) return;

    // Überprüfen, ob die Nachricht geflüstert wurde
    if (chatData.whisper.length > 0) {
        const gmUser = game.users.find(u => u.isGM);
        if (!gmUser) return; // Kein GM im Spiel

        // GM als Empfänger hinzufügen
        chatData.whisper.push(gmUser.id);

        // Hinweis an den Spieler senden
        ChatMessage.create({
            content: `<i>${game.i18n.localize("whisper-to-gm.notification")}</i>`,
            whisper: [chatData.speaker.actor]
        });
    }
});
