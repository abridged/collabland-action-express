import { getFetch, handleFetchResponse } from "@collabland/common";
import {
  APIChatInputApplicationCommandInteraction,
  APIMessage,
  DiscordActionRequest,
  RESTPatchAPIWebhookWithTokenMessageJSONBody,
  RESTPostAPIWebhookWithTokenJSONBody,
} from "@collabland/discord";

const fetch = getFetch();

export class FollowUp {
  async followupMessage(
    request: DiscordActionRequest<APIChatInputApplicationCommandInteraction>,
    message: RESTPostAPIWebhookWithTokenJSONBody
  ) {
    const callback = request.actionContext?.callbackUrl;
    if (callback) {
      const res = await fetch(callback, {
        method: "post",
        body: JSON.stringify(message),
      });
      return await handleFetchResponse<APIMessage>(res);
    }
  }

  async editMessage(
    request: DiscordActionRequest<APIChatInputApplicationCommandInteraction>,
    message: RESTPatchAPIWebhookWithTokenMessageJSONBody,
    messageId = "@original"
  ) {
    const callback = request.actionContext?.callbackUrl;
    if (callback) {
      const res = await fetch(
        callback + `/messages/${encodeURIComponent(messageId)}`,
        {
          method: "patch",
          body: JSON.stringify(message),
        }
      );
      return await handleFetchResponse<APIMessage>(res);
    }
  }

  async deleteMessage(
    request: DiscordActionRequest<APIChatInputApplicationCommandInteraction>,
    messageId = "@original"
  ) {
    const callback = request.actionContext?.callbackUrl;
    if (callback) {
      const res = await fetch(
        callback + `/messages/${encodeURIComponent(messageId)}`,
        {
          method: "delete",
        }
      );
      await handleFetchResponse(res);
    }
  }
}
