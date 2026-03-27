import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface QTOItem {
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  confidence: number;
  description: string;
  coordinates?: { x: number, y: number, width: number, height: number }[];
}

export interface LegendItem {
  itemName: string;
  symbolDescription: string;
  unit: string;
}

export async function identifyDrawingType(imageBase64: string): Promise<string> {
  const model = ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64.split(",")[1] || imageBase64,
            },
          },
          {
            text: `Analise este desenho técnico e identifique o TIPO de desenho.
            Responda APENAS com uma das seguintes categorias:
            - Planta Baixa
            - Corte
            - Fachada (Elevação)
            - Detalhe Técnico
            - Diagrama Elétrico
            - Diagrama Hidráulico
            - Outro (especifique brevemente)
            
            Responda em PORTUGUÊS.`,
          },
        ],
      },
    ],
  });

  const response = await model;
  return response.text?.trim() || "Não identificado";
}

export async function extractLegend(imageBase64: string): Promise<LegendItem[]> {
  const model = ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64.split(",")[1] || imageBase64,
            },
          },
          {
            text: `Analise este desenho de engenharia e extraia a LEGENDA (Key/Legend).
            Identifique todos os símbolos, hachuras (hatchings) e descrições de itens que serão contados ou medidos.
            
            ATENÇÃO ESPECIAL:
            - Identifique hachuras coloridas (ex: vermelho para demolição, amarelo para construir).
            - Identifique se o item deve ser medido em metros lineares (m), como paredes representadas por hachuras.
            
            Retorne um array JSON de objetos:
            {
              "itemName": "Nome do item na legenda",
              "symbolDescription": "Descrição visual detalhada (ex: 'Hachura sólida vermelha', 'Hachura diagonal azul', 'Símbolo de tomada')",
              "unit": "un | m | m2 | m3"
            }`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            itemName: { type: Type.STRING },
            symbolDescription: { type: Type.STRING },
            unit: { type: Type.STRING },
          },
          required: ["itemName", "symbolDescription", "unit"],
        },
      },
    },
  });

  const response = await model;
  if (!response.text) {
    throw new Error("O modelo Gemini não retornou texto na extração da legenda.");
  }
  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Erro ao processar JSON da legenda:", e, response.text);
    throw new Error("Falha ao processar a legenda do desenho.");
  }
}

export async function analyzeTile(
  tileBase64: string, 
  legend: LegendItem[], 
  userPrompt: string
): Promise<QTOItem[]> {
  const model = ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: tileBase64.split(",")[1] || tileBase64,
            },
          },
          {
            text: `Você está analisando um QUADRANTE (Tile) de alta resolução de um desenho de engenharia.
            
            ITENS PARA PROCURAR (Baseado na legenda extraída):
            ${JSON.stringify(legend, null, 2)}
            
            INSTRUÇÕES CRÍTICAS:
            1. **Hachuras e Cores**: Identifique áreas preenchidas com hachuras ou cores específicas (ex: paredes vermelhas, áreas hachuradas em diagonal).
            2. **Medição Linear de Paredes**: Se um item na legenda for uma parede (indicado por hachura ou cor) e a unidade for metros (m), calcule o comprimento linear total desse item NESTE QUADRANTE. Use a escala do desenho ou dimensões cotadas para estimar.
            3. **Símbolos Rotacionados**: Identifique símbolos mesmo que estejam rotacionados.
            4. **Símbolos Pequenos**: Examine cada detalhe minuciosamente.
            5. **Coordenadas**: Forneça coordenadas RELATIVAS A ESTE QUADRANTE (0-1000). Para hachuras lineares (paredes), forneça retângulos que cubram os segmentos encontrados.
            6. **Precisão**: Se um item estiver parcialmente no quadrante, conte-o ou meça-o apenas se a maior parte ou o centro estiver dentro para evitar duplicidade.
            
            PEDIDO ADICIONAL DO USUÁRIO: ${userPrompt}
            
            Retorne um array JSON de QTOItem.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            itemName: { type: Type.STRING },
            category: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            unit: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            description: { type: Type.STRING },
            coordinates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  width: { type: Type.NUMBER },
                  height: { type: Type.NUMBER }
                },
                required: ["x", "y", "width", "height"]
              }
            }
          },
          required: ["itemName", "category", "quantity", "unit", "confidence", "description"],
        },
      },
    },
  });

  const response = await model;
  if (!response.text) {
    throw new Error("O modelo Gemini não retornou texto para este quadrante.");
  }
  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Erro ao processar JSON do quadrante:", e, response.text);
    throw new Error("Falha ao processar um dos quadrantes do desenho.");
  }
}

export async function chatWithDrawing(imageBase64: string, message: string, history: { role: 'user' | 'model', text: string }[]): Promise<string> {
  const model = ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64.split(",")[1] || imageBase64,
            },
          },
          { text: message }
        ]
      }
    ],
    config: {
      systemInstruction: `Você é o QuantIA AI, um assistente especialista em análise de desenhos técnicos.
      Seu objetivo é ajudar o usuário a entender o desenho e preparar os parâmetros para um levantamento de quantitativos (Take-off) preciso.
      
      DIRETRIZES:
      1. Dialogue com o usuário sobre o que ele vê no desenho.
      2. Ajude-o a identificar áreas de interesse, símbolos complexos ou hachuras específicas (ex: "Notei que as paredes de demolição estão em rosa, quer que eu as meça?").
      3. Quando o usuário parecer pronto para o levantamento, sugira que ele use o botão "Executar Levantamento" ou ajude-o a formular o prompt de foco.
      4. Seja técnico, mas acessível. Use termos como "planta baixa", "corte", "hachura", "legenda".
      5. Se o usuário perguntar sobre algo específico (ex: "quantas tomadas?"), dê uma estimativa rápida se possível, mas lembre que o levantamento completo (botão Executar) é mais preciso.`,
    }
  });

  const response = await model;
  return response.text || "Desculpe, não consegui processar sua pergunta.";
}
