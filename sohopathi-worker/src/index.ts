import chunks from './chunks.json';
<<<<<<< HEAD
=======
// Import the prompt template as a string
>>>>>>> 44e87cf6f1c94828544f70b405405d5aefeb169c
import promptTemplate from './prompt.txt?raw';

interface Env {
  OLLAMA_API_KEY: string;
  HF_API_KEY: string;
}

interface ChatMessage {
  role: string;
  text: string;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getQueryEmbedding(text: string, hfApiKey: string) {
  const res = await fetch(
    'https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-mpnet-base-v2/pipeline/feature-extraction',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: text })
    }
  );
  return res.json() as Promise<number[]>;
}

function findTopChunks(queryEmbedding: number[], topN = 2) {
  const scored = (chunks as any[]).map(chunk => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}

const RELEVANCE_THRESHOLD = 0.35;

function buildPrompt(question: string, studentClass: string, context: string, history: ChatMessage[]): string {
  let historyText = '';
  if (history && history.length > 0) {
    const lastFew = history.slice(-6);
    historyText = lastFew.map(m => `${m.role === 'user' ? 'শিক্ষার্থী' : 'সহপাঠী AI'}: ${m.text}`).join('\n');
  }

  // Use the prompt template from the file
  let prompt = promptTemplate
    .replace(/\{studentClass\}/g, studentClass || 'ষষ্ঠ থেকে দশম শ্রেণির')
    .replace(/\{historyText\}/g, historyText)
    .replace(/\{context\}/g, context || '(এই বিষয়ে নির্দিষ্ট কোনো অধ্যায়ের তথ্য এখনো যোগ করা হয়নি — সাধারণ জ্ঞান থেকে উত্তর দাও)')
    .replace(/\{question\}/g, question);

  return prompt;
}

async function askModel(question: string, studentClass: string, context: string, history: ChatMessage[], ollamaApiKey: string) {
  const prompt = buildPrompt(question, studentClass, context, history);

  const res = await fetch('https://ollama.com/api/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ollamaApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gemma4:31b-cloud',
      messages: [{ role: 'user', content: prompt }],
      stream: false
    })
  });
  const data: any = await res.json();
  return data.message?.content || 'দুঃখিত, উত্তর তৈরি করা যায়নি।';
}

async function askVisionModel(question: string, studentClass: string, imageBase64: string, ollamaApiKey: string) {
  const rawBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

  const prompt = `তুমি "সহপাঠী AI" — বাংলাদেশের ${studentClass || 'ষষ্ঠ থেকে দশম শ্রেণির'} শিক্ষার্থীদের জন্য একজন সহায়ক শিক্ষক। শিক্ষার্থী একটি ছবি পাঠিয়েছে। ছবিটি ভালোভাবে দেখো এবং তার প্রশ্নের উত্তর দাও।

উত্তর বাংলায়, সহজ ভাষায়, সংক্ষেপে দাও। কোনো ইমোজি ব্যবহার করো না।

প্রশ্ন: ${question}`;

  try {
    const res = await fetch('https://ollama.com/api/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ollamaApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gemma4:31b-cloud',
        messages: [{ 
          role: 'user', 
          content: prompt, 
          images: [rawBase64] 
        }],
        stream: false
      })
    });

    const raw = await res.text();
    if (!res.ok) {
      return `[ছবি প্রক্রিয়াকরণে ত্রুটি — স্ট্যাটাস ${res.status}]\n${raw}`;
    }
    let data: any;
    try { data = JSON.parse(raw); } catch { return `[অবৈধ প্রতিক্রিয়া]\n${raw}`; }
    return data.message?.content || `[খালি উত্তর পাওয়া গেছে]\n${raw}`;
  } catch (err: any) {
    return `[নেটওয়ার্ক ত্রুটি]\n${err.message}`;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Use POST' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    try {
      const { question, studentClass, image, history } = await request.json() as { 
        question: string; 
        studentClass: string; 
        image?: string | null;
        history?: ChatMessage[];
      };

      if (!question || question.trim() === '') {
        return new Response(JSON.stringify({ error: 'প্রশ্ন খালি রাখা যাবে না' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (image) {
        const answer = await askVisionModel(question, studentClass, image, env.OLLAMA_API_KEY);
        return new Response(JSON.stringify({ answer }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const queryEmbedding = await getQueryEmbedding(question, env.HF_API_KEY);
      const topScored = findTopChunks(queryEmbedding, 2);
      const relevantChunks = topScored.filter(s => s.score >= RELEVANCE_THRESHOLD);
      const context = relevantChunks.map(s => s.chunk.text).join('\n\n');

      const answer = await askModel(question, studentClass, context, history || [], env.OLLAMA_API_KEY);
      return new Response(JSON.stringify({ answer }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });

    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};
