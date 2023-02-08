import { utils, Wallet } from "ethers";
import nacl from "tweetnacl";
import { Request, Response } from "express";
import {
  ActionEcdsaSignatureHeader,
  ActionEd25519SignatureHeader,
  ActionSignatureTimestampHeader,
} from "../constants";
import { debugFactory } from "@collabland/common";

const debug = debugFactory("SignatureVerifier");

export class SignatureVerifier {
  verify(req: Request, res: Response) {
    if (!process.env.SKIP_VERIFICATION) {
      const ecdsaSignature = req.header(ActionEcdsaSignatureHeader);
      const ed25519Signature = req.header(ActionEd25519SignatureHeader);
      const signatureTimestamp: number = parseInt(
        req.header(ActionSignatureTimestampHeader) ?? "0"
      );
      const body = JSON.stringify(req.body);
      const publicKey = this.getPublicKey();
      const signature = ecdsaSignature ?? ed25519Signature;
      if (!signature) {
        res.status(401);
        res.send({
          message: `${ActionEcdsaSignatureHeader} or ${ActionEd25519SignatureHeader} header is required`,
        });
        return;
      }
      if (!publicKey) {
        res.status(401);
        res.send({
          message: `Public key is not set.`,
        });
        return;
      }
      const signatureType = signature === ecdsaSignature ? "ecdsa" : "ed25519";

      this.verifyRequest(
        body,
        signatureTimestamp,
        signature,
        publicKey,
        signatureType
      );
    }
  }

  generateEd25519KeyPair() {
    const keyPair = nacl.sign.keyPair();
    return {
      publicKey: Buffer.from(keyPair.publicKey).toString("hex"),
      privateKey: Buffer.from(keyPair.secretKey).toString("hex"),
    };
  }

  generateEcdsaKeyPair() {
    const wallet = Wallet.createRandom();
    return {
      privateKey: wallet.privateKey,
      publicKey: wallet.publicKey,
    };
  }

  private getPublicKey() {
    return process.env.COLLABLAND_ACTION_PUBLIC_KEY;
  }

  private verifyRequest(
    body: string,
    signatureTimestamp: number,
    signature: string,
    publicKey: string,
    signatureType = "ecdsa"
  ) {
    const delta = Math.abs(Date.now() - signatureTimestamp);
    if (delta >= 5 * 60 * 1000) {
      throw new Error("Invalid request - signature timestamp is expired.");
    }
    const msg = signatureTimestamp + body;
    if (signatureType === "ed25519") {
      this.verifyRequestWithEd25519(publicKey, signature, msg);
    } else if (signatureType === "ecdsa") {
      this.verifyRequestWithEcdsa(publicKey, signature, msg);
    }
    return JSON.parse(body);
  }

  private verifyRequestWithEd25519(
    publicKey: string,
    signature: string,
    body: string
  ) {
    let verified = false;
    try {
      debug("Verifying webhook request with Ed25519 signature...");
      debug(
        "Public key: %s, signature: %s, message: %s",
        publicKey,
        signature,
        body
      );
      verified =
        signature != null &&
        nacl.sign.detached.verify(
          Buffer.from(body, "utf-8"),
          Buffer.from(signature, "hex"),
          Buffer.from(publicKey, "hex")
        );
      debug("Signature verified: %s", verified);
    } catch (err: any) {
      verified = false;
      debug(err.message);
    }

    if (!verified) {
      throw new Error(
        "Invalid request - Ed25519 signature cannot be verified."
      );
    }
    return verified;
  }

  private verifyRequestWithEcdsa(
    publicKey: string,
    signature: string,
    body: string
  ) {
    let verified = false;
    try {
      debug("Verifying webhook request with Ecdsa signature...");
      debug(
        "Public key: %s, signature: %s, message: %s",
        publicKey,
        signature,
        body
      );
      const digest = utils.hashMessage(body);
      verified =
        signature != null &&
        utils.recoverPublicKey(digest, signature) === publicKey;
      debug("Signature verified: %s", verified);
    } catch (err) {
      debug("Fail to verify signature: %O", err);
      verified = false;
    }

    if (!verified) {
      debug("Invalid signature: %s, body: %s", signature, body);
      throw new Error("Invalid request - Ecdsa signature cannot be verified.");
    }
    return verified;
  }
}
