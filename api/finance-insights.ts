import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = (req.body || {}) as {
      runway?: number;
      overdueCount?: number;
      overdueSum?: number;
      exceededCount?: number;
      exceededSum?: number;
    };

    const suggestions: Array<{ title: string; severity: 'info' | 'warn' | 'error'; details?: string }> = [];

    if (typeof body.runway === 'number') {
      if (body.runway <= 3) {
        suggestions.push({
          title: `Runway критичен: ~${body.runway} мес`,
          severity: 'error',
          details: 'Сократите дискреционные расходы, пересмотрите подписки и отложенные платежи',
        });
      } else if (body.runway <= 6) {
        suggestions.push({
          title: `Runway умеренный: ~${body.runway} мес`,
          severity: 'warn',
          details: 'Рассмотрите оптимизацию затрат и перенос неключевых расходов',
        });
      } else {
        suggestions.push({
          title: `Runway комфортный: ~${body.runway} мес`,
          severity: 'info',
          details: 'Сохранить текущий темп расходов и направить излишек в резерв',
        });
      }
    }

    if ((body.overdueCount ?? 0) > 0) {
      suggestions.push({
        title: `Просрочено счетов: ${body.overdueCount}`,
        severity: 'warn',
        details: body.overdueSum ? `Сумма к инкассации: ${new Intl.NumberFormat('ru-RU').format(body.overdueSum)} ₽` : undefined,
      });
    }

    if ((body.exceededCount ?? 0) > 0) {
      suggestions.push({
        title: `Перерасходов бюджетов: ${body.exceededCount}`,
        severity: 'warn',
        details: body.exceededSum ? `Перерасход: ${new Intl.NumberFormat('ru-RU').format(body.exceededSum)} ₽` : undefined,
      });
    }

    res.status(200).json({ suggestions });
  } catch (e) {
    res.status(200).json({ suggestions: [] });
  }
}
