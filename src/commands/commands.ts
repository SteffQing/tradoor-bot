import type { BotCommand } from "telegraf/typings/core/types/typegram";

const botCommands: BotCommand[] = [
  {
    command: "start",
    description:
      "Start the bot, clear previous commands and get a welcome message",
  },
  { command: "help", description: "Show this help message" },
  {
    command: "trade",
    description: "Configure and execute trades",
  },
  {
    command: "register",
    description:
      "Register an exchange with by providing api keys, secrets and passphrase/secret if required",
  },
];

export default botCommands;
