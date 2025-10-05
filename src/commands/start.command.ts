import type { Context } from "../models/telegraf.model";
import { reset } from "../utils/helpers";
import botCommands from "./commands";

async function startCmd(ctx: Context) {
  if (ctx.chat?.type !== "private") return;
  try {
    await reset(ctx);

    const { message_id } = await ctx.reply("Hello Tradoor 🫡");
    ctx.session.toDeleteMessageIds.push(message_id);
  } catch (error) {
    const { message_id } = await ctx.reply(
      "An error occurred. Please try again later."
    );
    ctx.session.toDeleteMessageIds.push(message_id);
  } finally {
    await ctx.deleteMessage(ctx.message?.message_id).catch(() => {});
  }
}

async function helpCmd(ctx: Context) {
  const helpText = botCommands
    .map((c) => `/${c.command} - ${c.description}`)
    .join("\n");

  const { message_id } = await ctx.reply(
    `Here are the available commands:\n\n${helpText}`
  );

  await ctx.deleteMessage(ctx.message?.message_id).catch(() => {});
  ctx.session.toDeleteMessageIds.push(message_id);
}

export { startCmd, helpCmd };
