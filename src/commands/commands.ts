import type { BotCommand } from "telegraf/typings/core/types/typegram";

const botCommands: BotCommand[] = [
  {
    command: "start",
    description:
      "Start the bot, clear previous commands and get a welcome message",
  },
  { 
    command: "trade", 
    description: "Configure and execute trades" 
  },
  { command: "help", description: "Show this help message" },
];

export default botCommands;
