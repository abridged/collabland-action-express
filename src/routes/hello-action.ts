import express from "express";
import { FollowUp, SignatureVerifier } from "../helpers";
import { sleep } from "@collabland/common";
import {
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponse,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  DiscordActionMetadata,
  DiscordActionRequest,
  DiscordActionResponse,
  getCommandOptionValue,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  RESTPatchAPIWebhookWithTokenMessageJSONBody,
  RESTPostAPIWebhookWithTokenJSONBody,
} from "@collabland/discord";
import { MiniAppManifest } from "@collabland/models";

const router = express.Router();

async function handle(
  interaction: DiscordActionRequest<APIChatInputApplicationCommandInteraction>
): Promise<DiscordActionResponse> {
  /**
   * Get the value of `your-name` argument for `/hello-action`
   */
  const yourName = getCommandOptionValue(interaction, "your-name");

  const message = `Hello, ${
    yourName ?? interaction.user?.username ?? "World"
  }!`;
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
  /**
   * Allow advanced followup messages
   */
  followup(interaction, message).catch((err) => {
    console.error(
      "Fail to send followup message to interaction %s: %O",
      interaction.id,
      err
    );
  });
  // Return the 1st response to Discord
  return response;
}

async function followup(
  request: DiscordActionRequest<APIChatInputApplicationCommandInteraction>,
  message: string
) {
  const follow = new FollowUp();
  const callback = request.actionContext?.callbackUrl;
  if (callback != null) {
    const followupMsg: RESTPostAPIWebhookWithTokenJSONBody = {
      content: `Follow-up: **${message}**`,
      flags: MessageFlags.Ephemeral,
    };
    await sleep(1000);
    let msg = await follow.followupMessage(request, followupMsg);
    await sleep(1000);
    // 5 seconds count down
    for (let i = 5; i > 0; i--) {
      const updated: RESTPatchAPIWebhookWithTokenMessageJSONBody = {
        content: `[${i}s]: **${message}**`,
      };
      msg = await follow.editMessage(request, updated, msg?.id);
      await sleep(1000);
    }
    // Delete the follow-up message
    await follow.deleteMessage(request, msg?.id);
  }
}

router.get("/metadata", function (req, res) {
  const manifest = new MiniAppManifest({
    appId: "hello-action",
    developer: "collab.land",
    name: "HelloAction",
    platforms: ["discord"],
    shortName: "hello-action",
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
        // Handle `/hello-action` slash command
        type: InteractionType.ApplicationCommand,
        names: ["hello-action"],
      },
    ],
    /**
     * Supported Discord application commands. They will be registered to a
     * Discord guild upon installation.
     */
    applicationCommands: [
      // `/hello-action <your-name>` slash command
      {
        metadata: {
          name: "HelloAction",
          shortName: "hello-action",
        },
        name: "hello-action",
        type: ApplicationCommandType.ChatInput,
        description: "/hello-action",
        options: [
          {
            name: "your-name",
            description: "Name of person we're greeting",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
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
