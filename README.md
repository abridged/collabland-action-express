<div align="center"><h1><b>Collab🤝Land Actions Express.js Template</b></h1></div>

## **Introduction** 🙏

The repository serves as a Express.js template for implementing Collab.Land actions for Discord interactions. The Collab.Land actions are installed to the Collab.Land bot through the **`/test-flight`** miniapp available in the Collab.Land marketplace.

## **Pre-requisites** 💻

### Environment:

- Node.JS 18.14.0 [[Download Here](https://nodejs.org/en/download/)]
- Typescript 4.9 [[Instructions to Download](https://www.typescriptlang.org/download#:~:text=Globally%20Installing%20TypeScript)]

### Code Editors (Optional, but we prefer it!):

- Visual Studio Code _(We love VSCode 💙)_ [[Download Here](https://code.visualstudio.com/)]
- ESLint Extension for VSCode [[Installation Instructions](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)]
- Prettier Extension for VSCode [[Installation Instructions](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)]

### Tunnel Forwarding:

- NGROK [[Installation Instructions](https://ngrok.com/docs/getting-started)]

## **Server Setup** ⚙️

### Starting the server:

- Clone the repository to your machine
- Open the folder in a code editor of your choice
- Install dependencies:
  ```bash
  npm install
  ```
- Build the project:
  ```bash
  npm run build
  ```
- Start the server (The server starts in port 3000 by default):
  ```bash
  npm start
  ```
- If the server fails due to the port being occupied, start the server in a different port:
  ```bash
  PORT=5000 npm start
  ```
- To expose your localhost API to public domain, open a new terminal and start NGROK:
  ```bash
  ngrok http <PORT>
  ```
- Copy the `.ngrok.io` link shown in your terminal

### Installing the Collab.Land actions:

- The API exposes 3 types of Collab.Land actions:
  - `<NGROK URL>/hello-action` : Sample Discord interaction demo-ing Discord message interactions
  - `<NGROK URL>/button-action` : Sample Discord interaction demo-ing Discord button interactions
  - `<NGROK URL>/popup-action` : Sample Discord interaction demo-ing Discord modal interactions
- Use the `/test-flight install action-url: <Your action URL>` command in the Collab.Land Bot to install the Collab.Land actions.

### Switching on signature verification:

- In order to verify the webhook requests coming from the Collab.Land bot, please delete the `SKIP_VERIFICATION` variable in your `.env` file and restart the server.
- Please fetch the public key from the [[**Collab.Land Config**](https://api-qa.collab.land/config)], and replace your `COLLABLAND_ACTION_PUBLIC_KEY` variable in the `.env` file.

## **API Specifications** 🛠️

- The API exposes two routes per slash command:
  - GET `/hello-action/metadata` : To provide the metadata for the `/hello-action` command
  - POST `/hello-action/interactions` : To handle the Discord interactions corresponding to the `/hello-action` command
  - GET `/button-action/metadata` : To provide the metadata for the `/button-action` command
  - POST `/button-action/interactions` : To handle the Discord interactions corresponding to the `/button-action` command
  - GET `/popup-action/metadata` : To provide the metadata for the `/popup-action` command
  - POST `/popup-action/interactions` : To handle the Discord interactions corresponding to the `/popup-action` command
- The slash commands provide example codes for the following Discord interactions:
  - `/hello-action` : It shows how to interact with a basic slash command Discord interaction, and then reply to that interaction. Along with that it shows an example of how to edit messages, delete messages or send follow-up messages using Collab.Land actions.
  - `/button-action` : It shows how to create buttons using Discord interactions, and then respond to the button events.
  - `/popup-action` : It shows how to send modals for forms using Discord interactions, and then listen for the form submissions and even read data submitted by the user.

## **Contributing** 🫶

- Please go through the following article [[**Link**](https://dev.collab.land/docs/upstream-integrations/build-a-custom-action)] to understand the deep technical details regarding building on the Collab.Land actions platform.
- In order to change the slash commands for the actions, try editing the `MiniAppManifest` models mentioned in the metadata route handlers [[Here 👀]](src/routes/hello-action.ts#L86)
- In order to change the logic which runs on the slash commands, try changing the `handle()` function mentioned in the interactions route handlers [[Here 👀]](src/routes/hello-action.ts#L23)

---

<div align="center"><b><i><small>Built with ❤️ and 🤝 by Collab.Land</small></i></b></div>
