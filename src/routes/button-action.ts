import express from "express";
import {SignatureVerifier} from "../utils";
import {
    APIChatInputApplicationCommandInteraction,
    APIInteraction,
    InteractionType,
    MessageFlags
} from "discord-api-types/v10";

const router = express.Router();

function handle(interaction: APIInteraction) {
    switch (interaction.type){
        case InteractionType.ApplicationCommand: {
            return handleApplicationCommand();
        }
        case InteractionType.MessageComponent: {
            return handleMessageComponent();
        }
    }
}

function handleMessageComponent(){
    return {
        type: 4,
        data: {
            content: 'You just clicked Test Button.'
        }
    };
}
function handleApplicationCommand(){
    return {
        type: 4,
        data: {
            flags: MessageFlags.Ephemeral,
            components: [
                {
                    type: 1,
                    components: [
                        {
                            style: 1,
                            label: `Test`,
                            custom_id: `test-button`,
                            disabled: false,
                            type: 2
                        }
                    ]
                }
            ]
        }
    };
}

function getSupportedInteractions() {
    return [
        {
            // Handle `/button-action` slash command
            type: InteractionType.ApplicationCommand,
            names: ["button-action"],
        },
        {
            type: InteractionType.MessageComponent,
            ids: ["test-button"]
        }
    ];
}

function getApplicationCommands() {
    return [
        // `/button-action <your-name>` slash command
        {
            metadata: {
                name: "ButtonAction",
                shortName: "button-action",
            },
            name: "button-action",
            type: 1,
            description: "/button-action",
            options: [],
        },
    ];
}

router.get("/metadata", function (req, res) {
    const metadata = {
        /**
         * Miniapp manifest
         */
        manifest: {
            appId: "button-action",
            developer: "collab.land",
            name: "ButtonAction",
            platforms: ["discord"],
            shortName: "button-action",
            version: {name: "0.0.1"},
            website: "https://collab.land",
            description: "An example Collab.Land action",
        },
        /**
         * Supported Discord interactions. They allow Collab.Land to route Discord
         * interactions based on the type and name/custom-id.
         */
        supportedInteractions: getSupportedInteractions(),
        /**
         * Supported Discord application commands. They will be registered to a
         * Discord guild upon installation.
         */
        applicationCommands: getApplicationCommands(),
    };
    res.send(metadata);
});

router.post("/interactions", async function (req, res) {
    const verifier = new SignatureVerifier();
    verifier.verify(req, res);
    const result = await handle(req.body);
    res.send(result);
});

export default router;
