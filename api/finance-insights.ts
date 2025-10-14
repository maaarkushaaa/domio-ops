import type { VercelRequest, VercelResponse } from '@vercel/node';

type Suggestion = { title: string; severity: 'info' | 'warn' | 'error'; details?: string };

async function generateWithOpenAI(body: any): Promise<Suggestion[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 15000);
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a finance assistant. Return ONLY JSON with key "suggestions": Array<{title:string;severity:"info"|"warn"|"error";details?:string}>' },
          { role: 'user', content: `Given finance metrics: ${JSON.stringify(body)}. Produce 3-6 actionable suggestions prioritizing cash runway, overdue invoices collections, and budget overruns. Keep Russian language.` },
        ],
      }),
    });
    clearTimeout(to);
    if (!resp.ok) return null;
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed?.suggestions)) return parsed.suggestions as Suggestion[];
    return null;
  } catch {
    return null;
  }
}

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

    const suggestions: Suggestion[] = [];

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

    // Try OpenAI enrichment
    const llm = await generateWithOpenAI(body);
    if (llm && llm.length > 0) {
      // Merge, avoiding duplicates by title
      const titles = new Set(suggestions.map(s => s.title));
      for (const s of llm) if (!titles.has(s.title)) suggestions.push(s);
    }

    res.status(200).json({ suggestions });
  } catch (e) {
    res.status(200).json({ suggestions: [] });
  }
}
