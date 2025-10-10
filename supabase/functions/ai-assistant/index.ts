import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    let systemPrompt = '';
    const body: any = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
    };

    if (type === "suggest") {
      systemPrompt = "Ты AI-ассистент для мебельного производства. Анализируй текст и предлагай конкретные задачи. Возвращай 3-5 предложений с приоритетами (low/medium/high) и категориями.";
      
      body.tools = [
        {
          type: "function",
          function: {
            name: "suggest_tasks",
            description: "Return 3-5 actionable task suggestions.",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      priority: { type: "string", enum: ["low", "medium", "high"] },
                      category: { type: "string" }
                    },
                    required: ["title", "priority", "category"],
                    additionalProperties: false
                  }
                }
              },
              required: ["suggestions"],
              additionalProperties: false
            }
          }
        }
      ];
      body.tool_choice = { type: "function", function: { name: "suggest_tasks" } };
    } else if (type === "deadline") {
      systemPrompt = "Ты AI-ассистент для прогнозирования сроков в мебельном производстве. Анализируй описание задачи и предлагай реалистичные сроки выполнения с учётом сложности.";
      
      body.tools = [
        {
          type: "function",
          function: {
            name: "predict_deadline",
            description: "Predict realistic deadline for a task",
            parameters: {
              type: "object",
              properties: {
                estimated_days: { type: "number" },
                confidence: { type: "string", enum: ["low", "medium", "high"] },
                factors: { type: "array", items: { type: "string" } }
              },
              required: ["estimated_days", "confidence", "factors"],
              additionalProperties: false
            }
          }
        }
      ];
      body.tool_choice = { type: "function", function: { name: "predict_deadline" } };
    } else if (type === "allocate") {
      systemPrompt = "Ты AI-ассистент для распределения ресурсов в мебельном производстве. Предлагай оптимальное распределение людей, материалов и времени.";
      
      body.tools = [
        {
          type: "function",
          function: {
            name: "allocate_resources",
            description: "Suggest optimal resource allocation",
            parameters: {
              type: "object",
              properties: {
                people_needed: { type: "number" },
                materials: { type: "array", items: { type: "string" } },
                budget_estimate: { type: "number" },
                recommendations: { type: "array", items: { type: "string" } }
              },
              required: ["people_needed", "materials", "recommendations"],
              additionalProperties: false
            }
          }
        }
      ];
      body.tool_choice = { type: "function", function: { name: "allocate_resources" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let result;

    if (data.choices?.[0]?.message?.tool_calls?.[0]) {
      const toolCall = data.choices[0].message.tool_calls[0];
      result = JSON.parse(toolCall.function.arguments);
    } else {
      result = { text: data.choices?.[0]?.message?.content || "No response" };
    }

    // Save analysis to database (optional - table may not exist)
    try {
      await supabase.from('ai_analysis').insert({
        user_id: user.id,
        input_text: text,
        analysis_type: type,
        result: result
      });
    } catch (dbError) {
      console.log('AI analysis logging skipped (table may not exist)');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});