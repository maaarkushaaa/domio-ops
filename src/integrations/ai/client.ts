export type AISuggestion = { title: string; severity: 'info' | 'warn' | 'error'; details?: string };

export async function fetchFinanceInsights(payload: {
  runway?: number;
  overdueCount?: number;
  overdueSum?: number;
  exceededCount?: number;
  exceededSum?: number;
}): Promise<AISuggestion[]> {
  try {
    const res = await fetch('/api/finance-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.suggestions) ? json.suggestions : [];
  } catch {
    return [];
  }
}
