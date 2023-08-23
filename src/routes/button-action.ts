import express from "express";
import {
  APIInteraction,
  InteractionType,
  MessageFlags,
} from "discord-api-types/v10";
import { SignatureVerifier } from "../helpers";
import {
  APIInteractionResponse,
  ApplicationCommandType,
  DiscordActionMetadata,
  InteractionResponseType,
} from "@collabland/discord";
import { MiniAppManifest } from "@collabland/models";

const router = express.Router();

function handle(interaction: APIInteraction) {
  switch (interaction.type) {
    case InteractionType.ApplicationCommand: {
      return handleApplicationCommand();
    }
    case InteractionType.MessageComponent: {
      return handleMessageComponent();
    }
  }
}

function handleMessageComponent(): APIInteractionResponse {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: "You just clicked Test Button.",
    },
  };
}

function handleApplicationCommand(): APIInteractionResponse {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
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
              type: 2,
            },
          ],
        },
      ],
    },
  };
}

router.get("/metadata", function (req, res) {
  const manifest = new MiniAppManifest({
    appId: "button-action",
    developer: "collab.land",
    name: "ButtonAction",
    platforms: ["discord"],
    shortName: "button-action",
    version: { name: "0.0.1" },
    website: "https://collab.land",
    description: "An example Collab.Land action",
  });
  const metadata: DiscordActionMetadata = {
    /**
     * Miniapp manifest
     */
    manifest,
    /**
     * Supported Discord interactions. They allow Collab.Land to route Discord
     * interactions based on the type and name/custom-id.
     */
    supportedInteractions: [
      {
        // Handle `/button-action` slash command
        type: InteractionType.ApplicationCommand,
        names: ["button-action"],
      },
      {
        type: InteractionType.MessageComponent,
        ids: ["test-button"],
      },
    ],
    /**
     * Supported Discord application commands. They will be registered to a
     * Discord guild upon installation.
     */
    applicationCommands: [
      // `/button-action <your-name>` slash command
      {
        metadata: {
          name: "ButtonAction",
          shortName: "button-action",
        },
        name: "button-action",
        type: ApplicationCommandType.ChatInput,
        description: "/button-action",
        options: [],
      },
    ],
  };
  res.send(metadata);
});

router.post("/interactions", async function (req, res) {
  const verifier = new SignatureVerifier();
  const verified = verifier.verify(req, res);
  if (verified) {
    const result = await handle(req.body);
    res.send(result);
  }
});

export default router;
