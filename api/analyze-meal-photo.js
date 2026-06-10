import OpenAI from "openai";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const userToken = authHeader.replace("Bearer ", "");
    const rateKey = `meal-scan:${userToken.slice(0, 32)}`;

    const { success } = await ratelimit.limit(rateKey);

    if (!success) {
      return res.status(429).json({
        error: "Limite atingido. Tente novamente em alguns minutos.",
      });
    }

    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Imagem não enviada." });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
Analise a comida da imagem e estime os macronutrientes.

Retorne SOMENTE JSON válido neste formato:

{
  "food_name": "nome da refeição",
  "quantity": "porção estimada",
  "calories": 0,
  "protein_g": 0,
  "carbs_g": 0,
  "fat_g": 0,
  "confidence": "baixa | média | alta"
}

Não adicione explicações fora do JSON.
              `,
            },
            {
              type: "input_image",
              image_url: imageBase64,
            },
          ],
        },
      ],
    });

    const result = JSON.parse(response.output_text);

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro ao analisar a imagem.",
    });
  }
}