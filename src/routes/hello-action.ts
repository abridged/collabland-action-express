import express from "express";
import { SignatureVerifier } from "../utils";
import { AnyObject } from "../types";
import { sleep } from "../utils/common";
import { FollowUp, getCommandOptionValue } from "../helpers";
import { APIChatInputApplicationCommandInteraction } from "discord-api-types/v10";

const router = express.Router();

async function handle(interaction: APIChatInputApplicationCommandInteraction) {
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
  const response = {
    type: 4,
    data: {
      content: message,
      flags: 64,
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

async function followup(request: AnyObject, message: string) {
  const follow = new FollowUp();
  const callback = request.actionContext?.callbackUrl;
  if (callback != null) {
    const followupMsg = {
      content: `Follow-up: **${message}**`,
      flags: 64,
    };
    await sleep(1000);
    let msg = await follow.followupMessage(request, followupMsg);
    await sleep(1000);
    // 5 seconds count down
    for (let i = 5; i > 0; i--) {
      const updated = {
        content: `[${i}s]: **${message}**`,
      };
      msg = await follow.editMessage(request, updated, msg?.id);
      await sleep(1000);
    }
    // Delete the follow-up message
    await follow.deleteMessage(request, msg?.id);
  }
}

function getSupportedInteractions() {
  return [
    {
      // Handle `/hello-action` slash command
      type: 2,
      names: ["hello-action"],
    },
  ];
}

function getApplicationCommands() {
  return [
    // `/hello-action <your-name>` slash command
    {
      metadata: {
        name: "HelloAction",
        shortName: "hello-action",
      },
      name: "hello-action",
      type: 1,
      description: "/hello-action",
      options: [
        {
          name: "your-name",
          description: "Name of person we're greeting",
          type: 3,
          required: true,
        },
      ],
    },
  ];
}

router.get("/metadata", function (req, res) {
  const metadata = {
    /**
     * Miniapp manifest
     */
    manifest: {
      appId: "hello-action",
      developer: "collab.land",
      name: "HelloAction",
      platforms: ["discord"],
      shortName: "hello-action",
      version: { name: "0.0.1" },
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
