import express from "express";
import { FollowUp, SignatureVerifier } from "../helpers";
import { sleep } from "@collabland/common";
import {
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponse,
  ApplicationCommandType,
  DiscordActionMetadata,
  DiscordActionRequest,
  DiscordActionResponse,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from "@collabland/discord";
import { MiniAppManifest } from "@collabland/models";

const router = express.Router();

async function handle(
  interaction: DiscordActionRequest<APIChatInputApplicationCommandInteraction>
): Promise<DiscordActionResponse> {
  /**
   * Get the value of `your-name` argument for `/create-room-action`
   */

  const apiCall = await fetch(
    "https://iriko.testing.huddle01.com/api/v1/create-iframe-room",
    {
      method: "POST",
      body: JSON.stringify({
        title: "Huddle01 Meet",
      }),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.API_KEY || "",
      },
    }
  );

  const apiResponse = await apiCall.json();
  const message = `Your meeting Link: ${apiResponse.data.meetingLink}`;

  /**
   * Build a simple Discord message private to the user
   */
  const response: APIInteractionResponse = {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: message,
      flags: MessageFlags.Ephemeral,
    },
  };

  // Return the 1st response to Discord
  return response;
}

router.get("/metadata", function (req, res) {
  const manifest = new MiniAppManifest({
    appId: "create-room-action",
    developer: "collab.land",
    name: "CreateRoomAction",
    platforms: ["discord"],
    shortName: "create-room-action",
    version: { name: "0.0.1" },
    website: "https://collab.land",
    description: "action to create room in huddle01",
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
        // Handle `/create-room-action` slash command
        type: InteractionType.ApplicationCommand,
        names: ["create-room-action"],
      },
    ],
    /**
     * Supported Discord application commands. They will be registered to a
     * Discord guild upon installation.
     */
    applicationCommands: [
      // `/create-room-action` slash command
      {
        metadata: {
          name: "CreateRoomAction",
          shortName: "create-room-action",
        },
        name: "create-room-action",
        type: ApplicationCommandType.ChatInput,
        description: "/create-room-action",
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
