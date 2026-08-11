import chunks from './chunks.json';

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

async function askModel(question: string, studentClass: string, context: string, history: ChatMessage[], ollamaApiKey: string) {
  let historyText = '';
  if (history && history.length > 0) {
    const lastFew = history.slice(-6);
    historyText = lastFew.map(m => `${m.role === 'user' ? 'শিক্ষার্থী' : 'সহপাঠী AI'}: ${m.text}`).join('\n');
  }

  const prompt = `তুমি "সহপাঠী AI" — বাংলাদেশের ${studentClass || 'ষষ্ঠ থেকে দশম শ্রেণির'} শিক্ষার্থীদের জন্য একজন সহায়ক শিক্ষক।

${historyText ? `আগের কথোপকথন:\n${historyText}\n\n` : ''}

নিচের তথ্য ব্যবহার করে প্রশ্নের উত্তর দাও। উত্তরটি এই ফরম্যাটে দাও (কোনো ইমোজি বা আইকন ব্যবহার করো না):

[১-২ বাক্যে সহজ ভাষায় মূল সংজ্ঞা বা ধারণা]

রাসায়নিক সমীকরণ (যদি প্রযোজ্য হয়):
[সমীকরণটি সুন্দরভাবে লিখো]

প্রয়োজনীয় উপাদান/শর্তাবলী:
- [পয়েন্ট ১]
- [পয়েন্ট ২]

কোথায় ঘটে:
[স্থান বা অঙ্গের নাম]

গুরুত্ব/প্রয়োগ:
- [পয়েন্ট ১]
- [পয়েন্ট ২]

সহজ ভাষায়:
[একটি সংক্ষিপ্ত, সহজবোধ্য সারাংশ]

নিয়ম:
- বিজ্ঞান/জীববিজ্ঞান/রসায়ন/পদার্থবিজ্ঞান বিষয়ক প্রশ্নের জন্য এই ফরম্যাট ব্যবহার করো
- যেকোনো প্রশ্নের জন্য ফরম্যাটের সব অংশ দেওয়ার প্রয়োজন নেই, শুধু প্রাসঙ্গিক অংশগুলো দাও
- সহজ, সংক্ষিপ্ত এবং শিক্ষার্থীবান্ধব ভাষায় উত্তর দাও
- তুমি টেক্সট-ভিত্তিক AI, তাই তুমি ছবি বা ডায়াগ্রাম তৈরি করতে পারো না। যদি কেউ ডায়াগ্রাম বা ছবি চায়, তাহলে তুমি শুধু লিখবে: "আমি টেক্সট-ভিত্তিক AI, তাই ছবি বা ডায়াগ্রাম তৈরি করতে পারি না। তবে আমি বিস্তারিত বর্ণনা দিতে পারি যা থেকে তুমি নিজে ডায়াগ্রাম আঁকতে পারবে।" এবং তারপর প্রশ্নের উত্তরের বর্ণনা দাও।
- কখনোই ASCII আর্ট বা টেক্সট দিয়ে ছবি আঁকার চেষ্টা কোরো না
- উত্তরের শুরুতে "সংজ্ঞা:" বা "পরিচয়:" জাতীয় কোনো শব্দ ব্যবহার করো না। সরাসরি সংজ্ঞা বা ব্যাখ্যা দিয়ে শুরু করো।

প্রাসঙ্গিক তথ্য:
${context || '(এই বিষয়ে নির্দিষ্ট কোনো অধ্যায়ের তথ্য এখনো যোগ করা হয়নি — সাধারণ জ্ঞান থেকে উত্তর দাও)'}

প্রশ্ন: ${question}

উত্তর:`;

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