import { exchanges } from "../constants";
import prisma from "../db/prisma";
import { capitalize, chunk } from "../utils/helpers";

async function exchangeRegistrationKeyboard(uid: number) {
  const exchangeAccounts = await prisma.exchangeAccount.findMany({
    where: { userId: uid },
    select: { exchangeName: true },
  });
  const exchangesNotRegistered = exchanges.filter(
    (exchange) =>
      !exchangeAccounts.some((account) => account.exchangeName === exchange)
  );

  if (exchangesNotRegistered.length === 0) {
    return null;
  }

  const keyboards = exchangesNotRegistered.map((exchange) => ({
    text: capitalize(exchange),
    callback_data: `register:${exchange}`,
  }));

  const inline_keyboard = chunk(keyboards, 2);
  return { inline_keyboard };
}

export { exchangeRegistrationKeyboard };
