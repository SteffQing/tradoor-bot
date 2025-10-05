import { getDefaultSession } from ".";
import type { Context } from "../models/telegraf.model";

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

function parsePositiveNumber(input: string): number | null {
  const match = input.match(/^\d+(\.\d+)?$/);
  if (!match) return null;
  return parseFloat(match[0]);
}

function parseLeverage(input: string): number | null {
  const num = parsePositiveNumber(input);
  if (!num || num < 1) return null;
  return Math.round(num);
}

async function reset(ctx: Context) {
  if (ctx.chat) {
    await ctx.telegram.sendChatAction(ctx.chat.id, "typing");
  }

  const deletions: Promise<unknown>[] = [];

  // all stored message ids
  for (const id of ctx.session.toDeleteMessageIds) {
    deletions.push(ctx.deleteMessage(id).catch(() => {}));
  }

  // the main trade message
  if (ctx.session.msgId) {
    deletions.push(ctx.deleteMessage(ctx.session.msgId).catch(() => {}));
  }

  // the triggering message
  if (ctx.message?.message_id) {
    deletions.push(ctx.deleteMessage(ctx.message.message_id).catch(() => {}));
  }

  // run all in parallel
  await Promise.all(deletions);

  // finally reset session
  ctx.session = getDefaultSession();
}

export { capitalize, chunk, parseLeverage, parsePositiveNumber, reset };
