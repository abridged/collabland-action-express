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
  MessageActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
  SelectMenuOptionBuilder,
  StringSelectMenuBuilder,
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

async function handleModalSubmit(
  interaction: APIModalSubmitInteraction
): Promise<APIInteractionResponse> {
  const components = interaction.data.components;
  const chain = components[0]?.components[0]?.value;
  const tokenType = components[1]?.components[0]?.value;
  const tokenAddress = components[2]?.components[0]?.value;

  const apiCall = await fetch(
    "https://iriko.testing.huddle01.com/api/v1/create-iframe-room",
    {
      method: "POST",
      body: JSON.stringify({
        title: "Huddle01 Meet",
        tokenType: tokenType,
        chain: chain,
        contractAddress: [tokenAddress],
      }),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.API_KEY || "",
      },
    }
  );

  const apiResponse = await apiCall.json();
  console.log(apiResponse);
  const message = `Your meeting Link: ${apiResponse.data.meetingLink}`;

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: message,
    },
  };
}

function handleApplicationCommand(): APIInteractionResponse {
  const modal = new ModalBuilder().setCustomId(`submit`).setTitle("Submit");

  const tokenType = new TextInputBuilder()
    .setCustomId("tokenType")
    .setLabel("Token Type")
    .setPlaceholder("ERC20/ERC721/ERC1155/SPL/BEP20")
    .setMaxLength(100)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const chain = new TextInputBuilder()
    .setCustomId("chain")
    .setLabel("Chain")
    .setPlaceholder("ETHEREUM/COSMOS/SOLANA/TEZOS/BSC")
    .setMaxLength(100)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const tokenAddress = new TextInputBuilder()
    .setCustomId("tokenAddress")
    .setLabel("Token Address")
    .setPlaceholder("0x0....")
    .setMaxLength(100)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const firstActionRow =
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(chain);
  modal.addComponents(firstActionRow);

  const secondActionRow =
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      tokenType
    );
  modal.addComponents(secondActionRow);

  const thirdActionRow =
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      tokenAddress
    );
  modal.addComponents(thirdActionRow);

  return {
    type: InteractionResponseType.Modal,
    data: {
      ...modal.toJSON(),
    },
  };
}

router.get("/metadata", function (req, res) {
  const manifest = new MiniAppManifest({
    appId: "token-gated-room",
    developer: "collab.land",
    name: "TokenGateRoom",
    platforms: ["discord"],
    shortName: "token-gated-room",
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
        // Handle `/token-gated-room` slash command
        type: InteractionType.ApplicationCommand,
        names: ["token-gated-room"],
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
      // `/token-gated-room <your-name>` slash command
      {
        metadata: {
          name: "TokenGatedRoom",
          shortName: "token-gated-room",
        },
        name: "token-gated-room",
        type: ApplicationCommandType.ChatInput,
        description: "/token-gated-room",
        options: [],
      },
    ],
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
