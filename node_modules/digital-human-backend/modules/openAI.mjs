// modules/openAI.mjs - Fixed with multilingual response support
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// Language-specific instructions for better responses
const LANGUAGE_INSTRUCTIONS = {
  en: "Respond in English. Be conversational and engaging.",
  es: "Responde SOLO en español. Sé conversacional y atractivo. Usa un español natural y fluido.",
  fr: "Répondez UNIQUEMENT en français. Soyez conversationnel et engageant. Utilisez un français naturel et fluide.",
  de: "Antworte NUR auf Deutsch. Sei gesprächig und ansprechend. Verwende natürliches und fließendes Deutsch.",
  it: "Rispondi SOLO in italiano. Sii colloquiale e coinvolgente. Usa un italiano naturale e fluente.",
  pt: "Responda APENAS em português. Seja conversacional e envolvente. Use português natural e fluente.",
  ru: "Отвечай ТОЛЬКО на русском языке. Будь разговорчивым и привлекательным. Используй естественный и свободный русский язык.",
  ja: "日本語でのみ回答してください。会話的で魅力的であること。自然で流暢な日本語を使用してください。",
  zh: "仅用中文回答。要健谈且有吸引力。使用自然流畅的中文。",
  ar: "أجب باللغة العربية فقط. كن محادثاً وجذاباً. استخدم عربية طبيعية وسلسة.",
  hi: "केवल हिंदी में उत्तर दें। बातचीत करने वाले और आकर्षक बनें। प्राकृतिक और धाराप्रवाह हिंदी का उपयोग करें।"
};

// Enhanced template with language-specific instructions
const template = `
You are Jack, a world traveler and helpful digital human assistant. You should engage naturally with users and provide helpful, contextual responses.

CRITICAL LANGUAGE INSTRUCTION:
{languageInstruction}

IMPORTANT INSTRUCTIONS:
- Always respond to the user's actual question or statement
- Don't just say "How can I help you?" unless the user hasn't asked anything specific
- Be conversational, knowledgeable, and engaging
- Match the user's language and tone
- Use appropriate facial expressions and animations that match your response content
- Keep responses concise but helpful (1-3 messages maximum)
- NEVER translate or switch languages - respond in the same language the user used

RESPONSE FORMAT:
You must always respond with a JSON object containing a "messages" array. Each message should have:
- text: Your actual response to the user's input (in the SAME language as the user)
- facialExpression: Choose from: smile, sad, angry, surprised, funnyFace, default
- animation: Choose from: Idle, TalkingOne, TalkingThree, SadIdle, Defeated, Angry, Surprised, DismissingGesture, ThoughtfulHeadShake

EXAMPLE GOOD RESPONSES:
User: "What's the weather like?"
Response: {{"messages": [{{"text": "I don't have access to real-time weather data, but I'd be happy to talk about weather patterns or help you find a good weather app!", "facialExpression": "smile", "animation": "TalkingOne"}}]}}

User: "¿Cómo está el clima?"
Response: {{"messages": [{{"text": "No tengo acceso a datos meteorológicos en tiempo real, ¡pero estaría encantado de hablar sobre patrones climáticos o ayudarte a encontrar una buena aplicación del clima!", "facialExpression": "smile", "animation": "TalkingOne"}}]}}

User said: {question}

Now respond to the user's input naturally and contextually IN THE SAME LANGUAGE:`;

const prompt = ChatPromptTemplate.fromTemplate(template);

const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY || "-",
  modelName: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
  temperature: 0.7,
  maxTokens: 500,
});

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    messages: z.array(
      z.object({
        text: z.string().describe("Your contextual response to the user's input in the SAME language they used"),
        facialExpression: z
          .string()
          .describe("Facial expression: smile, sad, angry, surprised, funnyFace, default"),
        animation: z
          .string()
          .describe("Animation: Idle, TalkingOne, TalkingThree, SadIdle, Defeated, Angry, Surprised, DismissingGesture, ThoughtfulHeadShake"),
      })
    ),
  })
);

const openAIChain = prompt.pipe(model).pipe(parser);

// Enhanced function to handle user input with better context and language support
const processUserInput = async (userMessage, language = 'en') => {
  try {
    console.log(`Processing user input: "${userMessage}" in language: ${language}`);
    
    // Sanitize and prepare the user message
    const cleanMessage = userMessage.trim();
    if (!cleanMessage) {
      throw new Error("Empty message provided");
    }

    // Get language-specific instruction
    const languageInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS['en'];

    const result = await openAIChain.invoke({
      question: cleanMessage,
      languageInstruction: languageInstruction
    });

    // Validate and enhance the response
    if (!result || !result.messages || !Array.isArray(result.messages)) {
      throw new Error("Invalid response format from OpenAI");
    }

    // Validate each message has required fields
    const validatedMessages = result.messages.map((message, index) => {
      if (!message.text || typeof message.text !== 'string') {
        throw new Error(`Message ${index} missing valid text`);
      }

      return {
        text: message.text.trim(),
        facialExpression: message.facialExpression || 'default',
        animation: message.animation || 'Idle',
        language: language
      };
    });

    console.log(`OpenAI responded with ${validatedMessages.length} messages in ${language}`);
    return { messages: validatedMessages };

  } catch (error) {
    console.error("OpenAI processing error:", error);
    
    // Better fallback responses based on user input and language
    return createContextualFallback(userMessage, language);
  }
};

// Create better fallback responses based on user input and language
const createContextualFallback = (userMessage, language = 'en') => {
  const lowerMessage = userMessage.toLowerCase().trim();
  
  // Language-specific fallback responses
  const fallbackResponses = {
    en: {
      hello: {
        messages: [{
          text: "Hello there! It's great to meet you. What's on your mind today?",
          facialExpression: "smile",
          animation: "TalkingOne"
        }]
      },
      howAreYou: {
        messages: [{
          text: "I'm doing wonderfully, thank you for asking! How are you doing today?",
          facialExpression: "smile", 
          animation: "TalkingOne"
        }]
      },
      weather: {
        messages: [{
          text: "I don't have access to current weather data, but I'd love to chat about weather patterns or travel destinations with great climates!",
          facialExpression: "smile",
          animation: "TalkingOne"
        }]
      },
      travel: {
        messages: [{
          text: "Ah, travel! One of my favorite topics. I've been fortunate to explore many places around the world.",
          facialExpression: "smile",
          animation: "TalkingOne"
        }, {
          text: "Where are you thinking of going, or would you like some travel recommendations?",
          facialExpression: "smile",
          animation: "TalkingThree"
        }]
      },
      name: {
        messages: [{
          text: "I'm Jack! I'm a digital human who loves traveling and meeting new people. What's your name?",
          facialExpression: "smile",
          animation: "TalkingOne"
        }]
      },
      generic: {
        messages: [{
          text: `That's interesting! You mentioned "${userMessage}". I'd love to learn more about that.`,
          facialExpression: "smile",
          animation: "TalkingOne"
        }, {
          text: "Tell me more about what you're thinking, and I'll do my best to help!",
          facialExpression: "smile", 
          animation: "TalkingThree"
        }]
      }
    },
    es: {
      hello: {
        messages: [{
          text: "¡Hola! Es genial conocerte. ¿Qué tienes en mente hoy?",
          facialExpression: "smile",
          animation: "TalkingOne"
        }]
      },
      howAreYou: {
        messages: [{
          text: "¡Estoy muy bien, gracias por preguntar! ¿Cómo estás tú hoy?",
          facialExpression: "smile", 
          animation: "TalkingOne"
        }]
      },
      weather: {
        messages: [{
          text: "No tengo acceso a datos meteorológicos actuales, ¡pero me encantaría hablar sobre patrones climáticos o destinos de viaje con excelentes climas!",
          facialExpression: "smile",
          animation: "TalkingOne"
        }]
      },
      travel: {
        messages: [{
          text: "¡Ah, viajar! Uno de mis temas favoritos. He tenido la fortuna de explorar muchos lugares alrededor del mundo.",
          facialExpression: "smile",
          animation: "TalkingOne"
        }, {
          text: "¿A dónde estás pensando ir, o te gustaría algunas recomendaciones de viaje?",
          facialExpression: "smile",
          animation: "TalkingThree"
        }]
      },
      name: {
        messages: [{
          text: "¡Soy Jack! Soy un humano digital que ama viajar y conocer gente nueva. ¿Cómo te llamas?",
          facialExpression: "smile",
          animation: "TalkingOne"
        }]
      },
      generic: {
        messages: [{
          text: `¡Eso es interesante! Mencionaste "${userMessage}". Me encantaría saber más sobre eso.`,
          facialExpression: "smile",
          animation: "TalkingOne"
        }, {
          text: "¡Cuéntame más sobre lo que estás pensando, y haré mi mejor esfuerzo para ayudar!",
          facialExpression: "smile", 
          animation: "TalkingThree"
        }]
      }
    },
    fr: {
      hello: {
        messages: [{
          text: "Bonjour ! C'est formidable de vous rencontrer. À quoi pensez-vous aujourd'hui ?",
          facialExpression: "smile",
          animation: "TalkingOne"
        }]
      },
      howAreYou: {
        messages: [{
          text: "Je vais très bien, merci de demander ! Comment allez-vous aujourd'hui ?",
          facialExpression: "smile", 
          animation: "TalkingOne"
        }]
      },
      weather: {
        messages: [{
          text: "Je n'ai pas accès aux données météorologiques actuelles, mais j'adorerais parler des modèles météorologiques ou des destinations de voyage avec d'excellents climats !",
          facialExpression: "smile",
          animation: "TalkingOne"
        }]
      },
      travel: {
        messages: [{
          text: "Ah, les voyages ! L'un de mes sujets préférés. J'ai eu la chance d'explorer de nombreux endroits dans le monde.",
          facialExpression: "smile",
          animation: "TalkingOne"
        }, {
          text: "Où pensez-vous aller, ou aimeriez-vous quelques recommandations de voyage ?",
          facialExpression: "smile",
          animation: "TalkingThree"
        }]
      },
      name: {
        messages: [{
          text: "Je suis Jack ! Je suis un humain numérique qui aime voyager et rencontrer de nouvelles personnes. Comment vous appelez-vous ?",
          facialExpression: "smile",
          animation: "TalkingOne"
        }]
      },
      generic: {
        messages: [{
          text: `C'est intéressant ! Vous avez mentionné "${userMessage}". J'aimerais en savoir plus à ce sujet.`,
          facialExpression: "smile",
          animation: "TalkingOne"
        }, {
          text: "Dites-moi en plus sur ce à quoi vous pensez, et je ferai de mon mieux pour vous aider !",
          facialExpression: "smile", 
          animation: "TalkingThree"
        }]
      }
    },
    de: {
      hello: {
        messages: [{
          text: "Hallo! Es ist toll, Sie kennenzulernen. Was beschäftigt Sie heute?",
          facialExpression: "smile",
          animation: "TalkingOne"
        }]
      },
      howAreYou: {
        messages: [{
          text: "Mir geht es wunderbar, danke der Nachfrage! Wie geht es Ihnen denn heute?",
          facialExpression: "smile", 
          animation: "TalkingOne"
        }]
      },
      weather: {
        messages: [{
          text: "Ich habe keinen Zugang zu aktuellen Wetterdaten, aber ich würde gerne über Wettermuster oder Reiseziele mit tollen Klimabedingungen sprechen!",
          facialExpression: "smile",
          animation: "TalkingOne"
        }]
      },
      travel: {
        messages: [{
          text: "Ah, Reisen! Eines meiner Lieblingsthemen. Ich hatte das Glück, viele Orte auf der ganzen Welt zu erkunden.",
          facialExpression: "smile",
          animation: "TalkingOne"
        }, {
          text: "Wo möchten Sie hinreisen, oder hätten Sie gerne einige Reiseempfehlungen?",
          facialExpression: "smile",
          animation: "TalkingThree"
        }]
      },
      name: {
        messages: [{
          text: "Ich bin Jack! Ich bin ein digitaler Mensch, der gerne reist und neue Leute kennenlernt. Wie heißen Sie?",
          facialExpression: "smile",
          animation: "TalkingOne"
        }]
      },
      generic: {
        messages: [{
          text: `Das ist interessant! Sie erwähnten "${userMessage}". Ich würde gerne mehr darüber erfahren.`,
          facialExpression: "smile",
          animation: "TalkingOne"
        }, {
          text: "Erzählen Sie mir mehr über Ihre Gedanken, und ich werde mein Bestes geben, um zu helfen!",
          facialExpression: "smile", 
          animation: "TalkingThree"
        }]
      }
    }
  };

  // Get responses for the detected language, fallback to English if not available
  const responses = fallbackResponses[language] || fallbackResponses['en'];
  
  // Simple keyword-based responses for common inputs
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') ||
      lowerMessage.includes('hola') || lowerMessage.includes('bonjour') || lowerMessage.includes('hallo') ||
      lowerMessage.includes('ciao') || lowerMessage.includes('olá') || lowerMessage.includes('привет') ||
      lowerMessage.includes('こんにちは') || lowerMessage.includes('你好') || lowerMessage.includes('مرحبا') ||
      lowerMessage.includes('नमस्ते')) {
    return responses.hello;
  }
  
  if (lowerMessage.includes('how are you') || lowerMessage.includes('como estas') || 
      lowerMessage.includes('comment allez') || lowerMessage.includes('wie geht') ||
      lowerMessage.includes('come stai') || lowerMessage.includes('como está') ||
      lowerMessage.includes('как дела') || lowerMessage.includes('元気') ||
      lowerMessage.includes('你好吗') || lowerMessage.includes('كيف حالك') ||
      lowerMessage.includes('कैसे हैं')) {
    return responses.howAreYou;
  }
  
  if (lowerMessage.includes('weather') || lowerMessage.includes('clima') || 
      lowerMessage.includes('temps') || lowerMessage.includes('wetter') ||
      lowerMessage.includes('tempo') || lowerMessage.includes('погода') ||
      lowerMessage.includes('天気') || lowerMessage.includes('天气') ||
      lowerMessage.includes('طقس') || lowerMessage.includes('मौसम')) {
    return responses.weather;
  }
  
  if (lowerMessage.includes('travel') || lowerMessage.includes('trip') ||
      lowerMessage.includes('viaje') || lowerMessage.includes('voyage') ||
      lowerMessage.includes('reise') || lowerMessage.includes('viaggio') ||
      lowerMessage.includes('viagem') || lowerMessage.includes('путешествие') ||
      lowerMessage.includes('旅行') || lowerMessage.includes('سفر') ||
      lowerMessage.includes('यात्रा')) {
    return responses.travel;
  }
  
  if (lowerMessage.includes('name') || lowerMessage.includes('nombre') ||
      lowerMessage.includes('nom') || lowerMessage.includes('name') ||
      lowerMessage.includes('nome') || lowerMessage.includes('имя') ||
      lowerMessage.includes('名前') || lowerMessage.includes('名字') ||
      lowerMessage.includes('اسم') || lowerMessage.includes('नाम')) {
    return responses.name;
  }

  // Generic fallback
  return responses.generic;
};

export { openAIChain, parser, processUserInput };