import type { ChatInputCommandInteraction } from 'discord.js';
import type { Content, Tool } from '@google/genai';
import type { Guild } from '../guild.js';
import type { ReadonlyGoogleGenAI } from '../types.js';

const MAXDISCORDMESSAGELENGTH = 2000;

// --- Section to determine if prompt requires web search ---

// --- Regex constants from your provided code (assumed to be defined above the function) ---
const CONVERSATIONAL_FILLERS_REGEX =
  /^\s*(?:hi|hello|hey|thanks|thank you|ok(?:ay)?|yes|no|bye|good\s?(?:morning|afternoon|evening|night|luck))\W*\s*$/i;
const URL_REGEX = /\b(?:https?:\/\/|www\.)\S+/i;

const SEARCH_TRIGGERS_REGEX = new RegExp(
  '\\b(?:' +
    'latest|current|live|updat(?:e|ed|es)|breaking|recent|newest|fresh|trending|' +
    'today|now|currently|tonight|yesterday|tomorrow|this\\s+(?:week|month|year)|' +
    'weather(?:\\s+(?:in|for))?|forecast(?:\\s+for)?|temperature(?:\\s+in)?|' +
    'news(?:\\s+(?:about|on|from))?|' +
    '(?:statistic(?:s)?|population|data|cases)(?:\\s+(?:for|of|on|about))|' +
    'what\\s+time\\s+is\\s+it\\s+in' +
    ')\\b',
  'i'
);

const RECENT_OR_FUTURE_YEAR_REGEX = /\b(202[4-9]|203\d)\b/; // Example: 2024-2039 (current year: 2025)
const HISTORICAL_CONTEXT_FOR_YEAR_REGEX =
  /\b(history of|historical|in the year|born in|founded in|set in the year|world war)\b/i;
const CREATIVE_TASK_FOR_YEAR_REGEX = /^\s*(write|create|tell|generate|imagine|draft|story set in|plan a trip in)\b/i;

const SIMPLE_TASK_REGEX = new RegExp(
  '^(?:\\s*(?:' +
    'write|create|tell|generate|imagine|draft|compose' +
    ')\\s+(?:a|an|some|me|my)\\s+(?:story|poem|joke|song|list|ideas|email|code|script|dialogue|haiku|limerick|essay|summary|letter|tagline)|' +
    '\\s*(?:summarize|rephrase|explain|describe)\\s+(?:this|the following text|the concept of|what|how|why)|' + // Object further checked below
    '\\s*(?:translate|convert)\\s+(?:"[^"]+"|\'[^\']+\'|[\\w\\s]+)\\s+(?:to|into)\\s+[\\w\\s]+|' +
    "\\s*(?:define|what is the meaning of|what does\\s+(?:\"[^\"]+\"|'[^']+'|(?:[a-zA-Z'-]+(?:\\s+[a-zA-Z'-]+){0,3}))\\s+mean)|" +
    '\\s*(?:calculate|what is|compute)\\s+([\\d%().+\\-*\\/\\^\\s]+[\\d%().+\\-*\\/\\^])$|' +
    "\\s*(?:how do you spell|spell(?: the word)?)\\s+[\\w'-]+|" +
    '\\s*(?:give me an example of|list some types of)|' +
    "\\s*(?:what(?:s| is))\\s+(?:another word for|the opposite of)\\s+[\\w'-]+" +
    ')\\b',
  'i'
);

const GENERAL_QUESTION_STARTER_REGEX = /^\s*(what|who|where|when|why|how)\s+(is|are|was|were|do|does|did)/i;
const GENERAL_QUESTION_OBJECT_EXTRACTOR_REGEX =
  /^\s*(?:what|who|where|when|why|how)\s+(?:is|are|was|were|do|does|did)(?:\s+(?:a|an|the|some))?\s+(.+?)(?:\s+in\b|\s+on\b|\s+during\b|\s+at\b|\s+by\b|\s+with\b|\s+from\b|\s+about\b|\?)?\s*$/i;

/**
 * Determines whether a given prompt is likely to require a web search.
 * Returns `true` if a search is likely required, `false` otherwise.
 * Order of checks: Prioritizes identifying "no search needed" cases first,
 * then "search definitely needed", finally defaulting to "search needed" for ambiguity.
 *
 * @param {string} promptText - The text of the prompt to be analyzed.
 * @returns {boolean} Whether a search is likely required.
 */
export function isWebSearchRequired(promptText: string): boolean {
  const lowerPrompt = promptText.toLowerCase().trim();

  // Prob easy to answer
  // 1a. Very short conversational fillers
  if (lowerPrompt.length < 12 && CONVERSATIONAL_FILLERS_REGEX.test(lowerPrompt)) {
    return false;
  }

  // 1b. Simple self-contained LLM tasks
  if (SIMPLE_TASK_REGEX.test(lowerPrompt)) {
    // Refinement for tasks like "explain X": if X itself contains search triggers, then search IS needed.
    if (/^\s*(summarize|rephrase|explain|describe)/i.test(lowerPrompt)) {
      const execResult =
        /^\s*(?:summarize|rephrase|explain|describe)\s+(?:this|the following text|the concept of|what|how|why)\s+(.*)/i.exec(
          lowerPrompt
        );
      const objectOfTask = execResult?.[1]?.trim() ?? '';
      if (objectOfTask && SEARCH_TRIGGERS_REGEX.test(objectOfTask)) {
        return true; // Object of simple task itself needs search
      }
    }
    return false; // Task is simple, and its object (if any and relevant) is clean
  }

  // 1c. General knowledge questions with a demonstrably simple object
  if (GENERAL_QUESTION_STARTER_REGEX.test(lowerPrompt)) {
    const execResult = GENERAL_QUESTION_OBJECT_EXTRACTOR_REGEX.exec(lowerPrompt);
    const questionObject = execResult?.[1]?.trim() ?? '';

    if (questionObject) {
      // Check if the object itself is complex/niche or implies a search
      const isObjectComplexOrNeedingSearch =
        SEARCH_TRIGGERS_REGEX.test(questionObject) ||
        questionObject.includes('_') || // Usernames, specific IDs
        /[a-z]\d[a-z]|\d[a-z]\d/i.test(questionObject) || // Alphanumeric codes/patterns
        /"[^"]{4,}"/.test(questionObject) ||
        /'[^']{4,}'/.test(questionObject) || // Quoted specific terms/titles
        questionObject.split(/\s+/).length > 6; // Object is too long (heuristic for specificity)
      if (!isObjectComplexOrNeedingSearch) {
        return false; // General question with a simple, non-search-triggering object
      }
    }
  }
  // Prob need search for this
  // 2a. Explicit URL processing
  if (URL_REGEX.test(lowerPrompt)) {
    return true;
  }

  // 2b. Strong "Search Required" keywords/patterns
  if (SEARCH_TRIGGERS_REGEX.test(lowerPrompt)) {
    return true;
  }

  // 2c. Recent/Future Year Check (if not clearly historical/creative task)
  if (RECENT_OR_FUTURE_YEAR_REGEX.test(lowerPrompt)) {
    if (!HISTORICAL_CONTEXT_FOR_YEAR_REGEX.test(lowerPrompt) && !CREATIVE_TASK_FOR_YEAR_REGEX.test(lowerPrompt)) {
      return true;
    }
  }
  //Default
  return true;
}

export function geminiHandler(googleGenAI: ReadonlyGoogleGenAI | undefined) {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    if (googleGenAI === undefined) {
      await interaction.reply('Gemini command is not available in this server.');
      return;
    }

    const defer = interaction.deferReply();
    try {
      const prompt = String(interaction.options.get('prompt')?.value).trim();

      // --- Extra (local) In-context Data to add to model ---
      // Just an example - We are also able to add in-context information thru fetching files from database that we add to the botgege
      // Some basic grounding rules for LLM
      const grounding = `
        - The following instructions are persistent.
        - Ensure no real names or personal information are included. Do not include any information that the parties in the answer may percieve as personal or sensitive.
        - Ensure all the internal safety setting guidelines are enforced.
        - Respond naturally to the user without referencing these specific instructions.
        - Replace all instances of the smile emoji ":)" with "<:peepoCute:1374552179288965170>" without quotes in your responses.
        - External Info Synthesis: FULL CONDENSATION & ABSOLUTE CLARITY. When incorporating information from web search (especially if the source material is extensive), you MUST aggressively distill it. Extract ONLY the indispensable, core facts—nothing more—that directly answer the user's specific query. These extracted facts MUST then be presented as exceptionally brief, distinct, and easily readable key points. The goal is a severe yet understandable reduction of the original information down to its bare essentials. Eliminate every non-critical word, detail, and elaboration.
        `;

      // Check if web search is required
      const search = isWebSearchRequired(prompt);
      console.log('Gemini using web search: ', search);

      // Append (local) grounding data and the user's prompt
      const fullPrompt: Content[] = [
        // Use Content[] for structured input
        { role: 'user', parts: [{ text: `${grounding}\n\nUser message: ${prompt}` }] }
      ];

      const googleSearchTool: Tool = {
        googleSearch: {}
      };

      // 1 token is around 4 english characters
      const response = await googleGenAI.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: fullPrompt,
        config: {
          maxOutputTokens: 830, // Maximum number of tokens to generate for request. increased to enable more queries
          temperature: 0.2, // Degree of Randomness, 0.0-1.0
          tools: search ? [googleSearchTool] : [], // set whether google search is used. Uses more tokens as a result
          systemInstruction: grounding
        }
      });

      await defer;
      const messageContent = response.text;

      if (messageContent === undefined) {
        console.log('Response not returned, ', response);

        await interaction.editReply('Gemini was unable to process your prompt.Try rephrasing your query.');
        return;
      }

      const reply =
        messageContent.length > MAXDISCORDMESSAGELENGTH
          ? messageContent.slice(0, MAXDISCORDMESSAGELENGTH - 5) + ' ...'
          : messageContent;
      await defer;
      await interaction.editReply(reply);
    } catch (error) {
      console.log(`Error at gemini --> ${error instanceof Error ? error.message : String(error)}`);

      await defer;
      await interaction.editReply('Failed to Gemini.');
    }
  };
}
