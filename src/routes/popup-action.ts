import express from "express";
import { APIInteraction, InteractionType } from "discord-api-types/v10";
import { SignatureVerifier } from "../helpers";
import {
  APIInteractionResponse,
  APIModalSubmitInteraction,
  ApplicationCommandType,
  DiscordActionMetadata,
  InteractionResponseType,
  TextInputStyle,
} from "@collabland/discord";
import { MiniAppManifest } from "@collabland/models";
import {
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
} from "discord.js";

const router = express.Router();

function handle(interaction: APIInteraction) {
  switch (interaction.type) {
    case InteractionType.ApplicationCommand: {
      return handleApplicationCommand();
    }
    case InteractionType.ModalSubmit: {
      return handleModalSubmit(interaction);
    }
  }
}

function handleModalSubmit(
  interaction: APIModalSubmitInteraction
): APIInteractionResponse {
  const components = interaction.data.components;
  const name = components[0]?.components[0]?.value;

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: `You submitted ${name}`,
    },
  };
}

function handleApplicationCommand(): APIInteractionResponse {
  const modal = new ModalBuilder().setCustomId(`submit`).setTitle("Submit");

  const name = new TextInputBuilder()
    .setCustomId("name")
    .setLabel("Name")
    .setPlaceholder("What's your name")
    .setMaxLength(100)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const firstActionRow =
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(name);
  modal.addComponents(firstActionRow);
  return {
    type: InteractionResponseType.Modal,
    data: {
      ...modal.toJSON(),
    },
  };
}

router.get("/metadata", function (req, res) {
  const manifest = new MiniAppManifest({
    appId: "popup-action",
    developer: "collab.land",
    name: "PopUpAction",
    platforms: ["discord"],
    shortName: "popup-action",
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
        // Handle `/popup-action` slash command
        type: InteractionType.ApplicationCommand,
        names: ["popup-action"],
      },
      {
        type: InteractionType.ModalSubmit,
        ids: ["submit"],
      },
    ],
    /**
     * Supported Discord application commands. They will be registered to a
     * Discord guild upon installation.
     */
    applicationCommands: [
      // `/popup-action <your-name>` slash command
      {
        metadata: {
          name: "PopUpAction",
          shortName: "popup-action",
        },
        name: "popup-action",
        type: ApplicationCommandType.ChatInput,
        description: "/popup-action",
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
