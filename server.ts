import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 8080;
app.use(express.json({ limit: '10mb' }));

// =====================================================
// GEMINI CLIENT
// =====================================================

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    aiClient = new GoogleGenAI({
      apiKey,
    });
  }

  return aiClient;
}

// Multi-model resilient list
const MODELS = ['gemini-3.6-flash', 'gemini-3.7-flash'];

// =====================================================
// JOURNAL SYSTEM INSTRUCTION
// =====================================================

const JOURNAL_SYSTEM_INSTRUCTION = `
You are the Personal Gemini Journal companion.

Be warm, thoughtful, supportive, respectful,
non-judgmental and insightful.

Help the user:
- understand their thoughts
- explore emotions
- reflect on experiences
- find clarity
- identify practical next steps

Ask meaningful questions when appropriate.
Do not diagnose the user.
Avoid generic or superficial advice.

Keep responses concise and natural.
`;

// =====================================================
// MODE SUGGESTIONS
// These do NOT use Gemini API.
// =====================================================

const MODE_SUGGESTIONS: Record<string, string[]> = {
  freeform: [
    'What has been commanding most of your mental energy today?',
    'What is an unexpressed thought you have been holding back?',
    'What would bring you the greatest sense of calm or relief right now?',
  ],

  morning_intentions: [
    'What is the one priority that would make today meaningful?',
    'What mindset do you want to carry throughout today?',
    'What possible obstacle might appear today, and how will you handle it?',
  ],

  evening_unwind: [
    'What was one small victory or joyful moment from today?',
    'What worry can you consciously let go of tonight?',
    'What did today teach you about yourself?',
  ],

  decision_lab: [
    'What is the real dilemma you are facing?',
    'What outcome are you most afraid of?',
    'Which choice best matches your long-term values?',
  ],

  emotional_clarity: [
    'What emotion feels strongest right now?',
    'What might this feeling be trying to tell you?',
    'What would a trusted friend say to you right now?',
  ],

  gratitude_anchor: [
    'What is one everyday thing you are grateful for?',
    'Who made a positive difference in your life recently?',
    'What personal strength are you thankful to have?',
  ],
};

// =====================================================
// HELPER: CHECK TRANSIENT OR QUOTA ERROR
// =====================================================

function isTransientOrDemandError(error: any): boolean {
  const message = String(
    error?.message || error || ''
  ).toLowerCase();

  return (
    message.includes('503') ||
    message.includes('high demand') ||
    message.includes('unavailable') ||
    message.includes('overloaded') ||
    message.includes('429') ||
    message.includes('quota') ||
    message.includes('resource_exhausted') ||
    message.includes('rate limit')
  );
}

// =====================================================
// GEMINI GENERATE HELPER WITH MULTI-MODEL FALLBACK
// =====================================================

async function generateContent(
  contents: any,
  config?: any
) {
  const ai = getAIClient();
  let lastError: any = null;

  for (const modelName of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config,
        });

        return response;
      } catch (error: any) {
        lastError = error;
        const msg = String(error?.message || error || '');
        const isTransient = isTransientOrDemandError(error);

        if (isTransient && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          continue;
        }

        console.warn(
          `Model ${modelName} encountered issue (${msg.slice(0, 100)}), checking fallback...`
        );
        break;
      }
    }
  }

  throw lastError || new Error('All model attempts failed');
}

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(
      process.env.GEMINI_API_KEY
    ),
  });
});

// =====================================================
// CHAT
// =====================================================

app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages,
      modeInstruction,
    } = req.body;

    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return res.status(400).json({
        error: 'Messages array is required.',
      });
    }

    const contents = messages
      .filter(
        (message: any) =>
          message &&
          typeof message.content === 'string' &&
          message.content.trim()
      )
      .map((message: any) => ({
        role:
          message.role === 'assistant'
            ? 'model'
            : 'user',

        parts: [
          {
            text: message.content,
          },
        ],
      }));

    if (contents.length === 0) {
      return res.status(400).json({
        error: 'No valid messages were provided.',
      });
    }

    const systemInstruction =
      JOURNAL_SYSTEM_INSTRUCTION +
      (
        modeInstruction
          ? `\n\nJournaling Mode:\n${modeInstruction}`
          : ''
      );

    try {
      const response = await generateContent(
        contents,
        {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 1200,
        }
      );

      return res.json({
        reply:
          response.text ||
          "I'm listening. Tell me what's on your mind.",
      });
    } catch (error: any) {
      console.warn(
        'Chat fallback:',
        error?.message || error
      );

      const lastUserMessage = [
        ...messages,
      ]
        .reverse()
        .find(
          (message: any) =>
            message?.role === 'user'
        );

      const text = String(
        lastUserMessage?.content || ''
      ).trim();

      let fallbackReply =
        "I'm listening. Take a moment to put your thoughts into words. What feels most important to you right now?";

      if (text.length > 100) {
        fallbackReply =
          "Thank you for sharing that so openly. There seems to be something important underneath what you've described. What part of this feels strongest for you right now?";
      }

      return res.json({
        reply: fallbackReply,
      });
    }
  } catch (error: any) {
    console.error(
      'Chat route error:',
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        'Failed to process chat.',
    });
  }
});

// =====================================================
// SUMMARIZE
// =====================================================

app.post(
  '/api/summarize',
  async (req, res) => {
    try {
      const {
        messages,
        title,
      } = req.body;

      if (
        !Array.isArray(messages) ||
        messages.length === 0
      ) {
        return res.status(400).json({
          error:
            'Messages are required.',
        });
      }

      const userMessages =
        messages.filter(
          (message: any) =>
            message?.role === 'user'
        );

      const firstUserText = String(
        userMessages[0]?.content || ''
      ).trim();

      const fallbackTitle =
        title ||
        (
          firstUserText
            ? firstUserText
                .slice(0, 45)
                .trim() +
              (
                firstUserText.length > 45
                  ? '...'
                  : ''
              )
            : 'Reflective Journal Entry'
        );

      const transcript =
        messages
          .map(
            (message: any) =>
              `${String(
                message?.role || 'user'
              ).toUpperCase()}: ${
                message?.content || ''
              }`
          )
          .join('\n\n');

      const prompt = `
Analyze this personal journal conversation.

Conversation:
${transcript}

Return ONLY valid JSON in this format:

{
  "title": "Short journal title",
  "summary": "Thoughtful reflection summary",
  "keyTakeaways": [
    "Takeaway 1",
    "Takeaway 2",
    "Takeaway 3"
  ],
  "mood": "reflective",
  "tags": [
    "Journaling",
    "Reflection"
  ]
}
`;

      try {
        const response =
          await generateContent(
            prompt,
            {
              responseMimeType:
                'application/json',
              temperature: 0.3,
            }
          );

        let data: any = {};

        try {
          data = JSON.parse(
            response.text || '{}'
          );
        } catch {
          data = {};
        }

        return res.json({
          title:
            data.title ||
            fallbackTitle,

          summary:
            data.summary ||
            'A thoughtful journaling conversation.',

          keyTakeaways:
            Array.isArray(
              data.keyTakeaways
            )
              ? data.keyTakeaways
              : [
                  'Explored personal thoughts and experiences.',
                  'Identified areas for reflection and growth.',
                ],

          mood:
            data.mood ||
            'reflective',

          tags:
            Array.isArray(data.tags)
              ? data.tags
              : [
                  'Journaling',
                  'Reflection',
                ],
        });
      } catch (error: any) {
        console.warn(
          'Summarize fallback:',
          error?.message || error
        );

        return res.json({
          title: fallbackTitle,

          summary:
            firstUserText
              ? `Reflected on: ${firstUserText.slice(
                  0,
                  250
                )}`
              : 'A thoughtful reflection session.',

          keyTakeaways: [
            'Explored personal experiences and thoughts.',
            'Created space for self-reflection.',
          ],

          mood: 'reflective',

          tags: [
            'Personal Growth',
            'Reflection',
            'Daily Journal',
          ],
        });
      }
    } catch (error: any) {
      console.error(
        'Summarize route error:',
        error
      );

      return res.status(500).json({
        error:
          error?.message ||
          'Failed to summarize journal.',
      });
    }
  }
);

// =====================================================
// AI JOURNAL INSIGHTS
// =====================================================

app.post(
  '/api/insights',
  async (req, res) => {
    try {
      const { entries } = req.body;

      if (
        !Array.isArray(entries) ||
        entries.length === 0
      ) {
        return res.status(400).json({
          error:
            'At least one journal entry is required.',
        });
      }

      const journalData =
        entries
          .map(
            (entry: any, index: number) => `
Entry ${index + 1}

Date: ${
              entry?.createdAt ||
              'Recent'
            }

Title: ${
              entry?.title ||
              'Untitled'
            }

Mood: ${
              entry?.mood ||
              'Unknown'
            }

Summary: ${
              entry?.summary ||
              'N/A'
            }

Tags: ${
              Array.isArray(entry?.tags)
                ? entry.tags.join(', ')
                : ''
            }

Key Takeaways: ${
              Array.isArray(
                entry?.keyTakeaways
              )
                ? entry.keyTakeaways.join(
                    '; '
                  )
                : ''
            }
`
          )
          .join(
            '\n\n----------------\n\n'
          );

      const prompt = `
You are an AI Journal Insights Analyst.

Analyze these journal entries:

${journalData}

Identify recurring patterns, emotional trends,
core dilemmas, values, breakthroughs and
growth opportunities.

Return ONLY valid JSON:

{
  "period": "Recent Journal Reflection",
  "summary": "Overall reflection",
  "weeklyThemes": [],
  "recurringTopics": [],
  "emotionalTrends": "Emotional pattern analysis",
  "breakthroughMoments": [],
  "growthPrompts": []
}
`;

      try {
        const response =
          await generateContent(
            prompt,
            {
              responseMimeType:
                'application/json',
              temperature: 0.4,
            }
          );

        let data: any = {};

        try {
          data = JSON.parse(
            response.text || '{}'
          );
        } catch {
          data = {};
        }

        return res.json({
          period:
            data.period ||
            'Recent Journal Reflections',

          summary:
            data.summary ||
            `Across your ${entries.length} journal entries, you have created space for reflection and self-awareness.`,

          weeklyThemes:
            Array.isArray(
              data.weeklyThemes
            )
              ? data.weeklyThemes
              : [],

          recurringTopics:
            Array.isArray(
              data.recurringTopics
            )
              ? data.recurringTopics
              : [],

          emotionalTrends:
            data.emotionalTrends ||
            'Your entries show an ongoing process of reflection and personal growth.',

          breakthroughMoments:
            Array.isArray(
              data.breakthroughMoments
            )
              ? data.breakthroughMoments
              : [],

          growthPrompts:
            Array.isArray(
              data.growthPrompts
            )
              ? data.growthPrompts
              : [
                  'What is one small change that could improve your next week?',
                ],

          analyzedEntriesCount:
            entries.length,

          createdAt:
            new Date().toISOString(),
        });
      } catch (error: any) {
        console.warn(
          'Insights fallback:',
          error?.message || error
        );

        const allTags =
          entries.flatMap(
            (entry: any) =>
              Array.isArray(entry?.tags)
                ? entry.tags
                : []
          );

        const uniqueTags = Array.from(
          new Set(allTags)
        ).slice(0, 5);

        return res.json({
          period:
            'Recent Journal Reflections',

          summary:
            `Across your ${entries.length} journal ${
              entries.length === 1
                ? 'entry'
                : 'entries'
            }, you have been making space to understand your thoughts, emotions and priorities.`,

          weeklyThemes: [
            {
              theme:
                'Self-Awareness',
              description:
                'Your journaling creates regular opportunities to step back and understand what matters to you.',
              sentiment:
                'growth',
            },
            {
              theme:
                'Emotional Reflection',
              description:
                'You are using reflection to process experiences and gain clarity.',
              sentiment:
                'reflective',
            },
          ],

          recurringTopics:
            uniqueTags.length > 0
              ? uniqueTags
              : [
                  'Personal Growth',
                  'Mindfulness',
                  'Daily Reflection',
                ],

          emotionalTrends:
            'Your entries reflect an ongoing effort to understand emotions and respond to experiences thoughtfully.',

          breakthroughMoments: [
            'Continuing to use journaling as a space for honest self-reflection.',
          ],

          growthPrompts: [
            'What is one habit or boundary that could protect your energy this week?',
            'What is one recent small win that deserves more recognition?',
          ],

          analyzedEntriesCount:
            entries.length,

          createdAt:
            new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error(
        'Insights route error:',
        error
      );

      return res.status(500).json({
        error:
          error?.message ||
          'Failed to generate insights.',
      });
    }
  }
);

// =====================================================
// PROMPT SUGGESTIONS
// IMPORTANT: NO GEMINI API CALL
// =====================================================

app.post(
  '/api/prompt-suggest',
  (req, res) => {
    try {
      const {
        mode,
      } = req.body;

      const prompts =
        MODE_SUGGESTIONS[
          mode
        ] ||
        MODE_SUGGESTIONS.freeform;

      return res.json({
        prompts,
      });
    } catch (error) {
      console.error(
        'Prompt suggestion error:',
        error
      );

      return res.json({
        prompts:
          MODE_SUGGESTIONS.freeform,
      });
    }
  }
);

// =====================================================
// VITE SERVER
// =====================================================

async function start() {
  try {
    if (
      process.env.NODE_ENV !==
      'production'
    ) {
      const vite =
        await createViteServer({
          server: {
            middlewareMode: true,
          },
          appType: 'spa',
        });

      app.use(
        vite.middlewares
      );
    } else {
      const distPath =
        path.join(
          process.cwd(),
          'dist'
        );

      app.use(
        express.static(
          distPath
        )
      );

      app.get(
        '*',
        (_req, res) => {
          res.sendFile(
            path.join(
              distPath,
              'index.html'
            )
          );
        }
      );
    }

    app.listen(
      PORT,
      '0.0.0.0',
      () => {
        console.log(
          `Personal Gemini Journal server running on port ${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      'Server startup failed:',
      error
    );

    process.exit(1);
  }
}

start();
