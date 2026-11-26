const allowedOrigin = "https://shwepchek.github.io";

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };
  const reply = (statusCode, ok) => ({
    statusCode,
    headers,
    body: JSON.stringify({ ok })
  });

  if (event.httpMethod === "OPTIONS") return reply(204, true);
  if (event.httpMethod !== "POST") return reply(405, false);
  if (!event.body || event.body.length > 12000) return reply(400, false);

  let brief;
  try {
    brief = JSON.parse(event.body);
  } catch {
    return reply(400, false);
  }

  const limits = { name: 150, contact: 200, package: 100, budget: 100, message: 2500 };
  if (!brief || typeof brief !== "object" || Array.isArray(brief) ||
      Object.entries(limits).some(([key, limit]) =>
        typeof brief[key] !== "string" || brief[key].length > limit) ||
      !brief.name.trim() || !brief.contact.trim()) {
    return reply(400, false);
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error("Telegram credentials are not configured.");
    return reply(503, false);
  }

  const text = [
    "БРИФ НА РАЗРАБОТКУ САЙТА — SITEFRAME",
    "",
    `Имя: ${brief.name.trim()}`,
    `Контакт: ${brief.contact.trim()}`,
    `Формат: ${brief.package || "Не выбран"}`,
    `Бюджет: ${brief.budget || "Не указан"}`,
    "",
    "О проекте:",
    brief.message || "Комментарий не указан"
  ].join("\n");

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(10000)
    });
    const result = await response.json();
    if (!response.ok || result.ok !== true) {
      console.error("Telegram rejected the message:", response.status);
      return reply(502, false);
    }
    return reply(200, true);
  } catch {
    console.error("Telegram request failed.");
    return reply(502, false);
  }
};
