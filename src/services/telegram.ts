export interface TelegramMessage {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export async function sendTelegramNotification({ title, message, type = 'info' }: TelegramMessage) {
  const botToken = localStorage.getItem('telegram_bot_token');
  const chatId = localStorage.getItem('telegram_chat_id');
  const enabled = localStorage.getItem('telegram_enabled') === 'true';

  if (!enabled || !botToken || !chatId) {
    return;
  }

  const emoji = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  }[type];

  const text = `${emoji} <b>${title}</b>\n\n${message}`;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}
