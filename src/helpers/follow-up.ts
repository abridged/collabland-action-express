import { AnyObject } from "../types";
import { handleFetchResponse } from "../utils";

export class FollowUp {
  async followupMessage(request: AnyObject, message: AnyObject) {
    const callback = request.actionContext?.callbackUrl;
    if (callback) {
      const res = await fetch(callback, {
        method: "post",
        body: JSON.stringify(message),
      });
      return await handleFetchResponse<AnyObject>(res);
    }
  }

  async editMessage(
    request: AnyObject,
    message: AnyObject,
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
      return await handleFetchResponse<AnyObject>(res);
    }
  }

  async deleteMessage(request: AnyObject, messageId = "@original") {
    const callback = request.actionContext?.callbackUrl;
    if (callback) {
      const res = await fetch(
        callback + `/messages/${encodeURIComponent(messageId)}`,
        {
          method: "delete",
        }
      );
      await handleFetchResponse<AnyObject>(res);
    }
  }
}
