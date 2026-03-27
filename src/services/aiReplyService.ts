/**
 * AI Reply Service — Abstraction layer for AI-generated replies.
 *
 * CURRENT STATE: Mock provider (no live API).
 * FUTURE: Replace `generateReplyMock` with a real API call.
 *
 * LANGUAGE BEHAVIOR: Reply language is auto-detected from the client
 * message content, NOT from the UI language toggle. A Lithuanian
 * message gets a Lithuanian reply even if the UI is in English.
 */

export type AITone = 'professional' | 'friendly' | 'formal' | 'concise';
export type DetectedLanguage = 'lt' | 'en' | 'unknown';

export interface AIReplyRequest {
  clientMessage: string;
  tone: AITone;
  context?: string;
  maxLength?: 'short' | 'medium' | 'long';
  language?: 'en' | 'lt';           // UI language (fallback only)
}

export interface AIReplyResult {
  success: boolean;
  reply: string;
  detectedLanguage: DetectedLanguage; // Language detected from client message
  error?: string;
}

export const AI_ENABLED = false;

// ─── LANGUAGE DETECTION ─────────────────────────────────────────

const LT_CHARS = /[ąčęėįšųūžĄČĘĖĮŠŲŪŽ]/;
const LT_WORDS = [
  'labas', 'laba', 'diena', 'ačiū', 'dėkoju', 'prašau', 'prašom',
  'sveiki', 'dėl', 'kad', 'yra', 'buvo', 'būtų', 'galiu', 'galite',
  'noriu', 'norėčiau', 'reikia', 'reikėtų', 'pagalba', 'klausimas',
  'sutartis', 'sutarties', 'dokumentai', 'dokumentų', 'sąskaita',
  'mokėjimas', 'mokėjimo', 'problema', 'problemos', 'kaina', 'kainos',
  'nuolaida', 'nuolaidos', 'paslauga', 'paslaugos', 'informacija',
  'atsakymas', 'atsakymą', 'terminas', 'terminą', 'mėnesį', 'savaitę',
  'šiandien', 'rytoj', 'vakar', 'taip', 'arba', 'bet', 'tačiau',
  'nes', 'kai', 'jei', 'kaip', 'kur', 'kas', 'kodėl', 'kiek',
  'darbo', 'įmonė', 'įmonės', 'klientas', 'kliento', 'vadybininkas',
  'gerbiamas', 'gerbiama', 'maloniai', 'gavome', 'gauname', 'siųsti',
  'siųsime', 'atsiprašome', 'patvirtinti', 'patvirtinu', 'užklausa',
  'užklausą', 'pateikti', 'pateikite', 'nurodyti', 'nurodykite',
];
const EN_WORDS = [
  'hello', 'please', 'thank', 'thanks', 'would', 'could', 'should',
  'about', 'have', 'this', 'that', 'with', 'from', 'your', 'will',
  'need', 'want', 'regarding', 'contract', 'document', 'payment',
  'invoice', 'price', 'discount', 'service', 'issue', 'problem',
  'question', 'information', 'deadline', 'when', 'what', 'where',
  'which', 'dear', 'sincerely', 'regards', 'received', 'confirm',
  'update', 'request', 'provide', 'assist', 'resolve',
];

export function detectLanguage(text: string): DetectedLanguage {
  if (!text.trim()) return 'unknown';

  const lower = text.toLowerCase();
  const words = lower.split(/[\s,.!?;:()[\]{}'"—–\-\/\\]+/).filter(w => w.length > 1);

  // 1. Lithuanian diacritical characters are a strong signal
  const ltCharCount = (text.match(new RegExp(LT_CHARS.source, 'g')) || []).length;
  if (ltCharCount >= 3) return 'lt';

  // 2. Word-level matching
  let ltScore = 0;
  let enScore = 0;

  for (const word of words) {
    if (LT_WORDS.includes(word)) ltScore += 2;
    if (EN_WORDS.includes(word)) enScore += 2;
  }

  // Bonus for Lithuanian chars even if < 3
  ltScore += ltCharCount * 3;

  if (ltScore === 0 && enScore === 0) {
    return 'lt'; // No strong signal — default to Lithuanian
  }

  if (ltScore > enScore) return 'lt';
  if (enScore > ltScore) return 'en';
  return 'lt'; // Tie-breaker: default to Lithuanian (primary communication language)
}

// ─── TOPIC DETECTION ────────────────────────────────────────────

type Topic = 'pricing' | 'problem' | 'documents' | 'timeline' | 'onboarding' | 'payment' | 'access' | 'cancellation' | 'general';

function detectTopic(text: string): Topic {
  const w = text.toLowerCase();

  if (w.match(/cancel|nutrauk|atšauk|uždary|closure|terminate/)) return 'cancellation';
  if (w.match(/login|password|prisijung|slaptažod|access|prieig/)) return 'access';
  if (w.match(/price|pricing|kain|nuolaid|discount|cost|offer|pasiūly/)) return 'pricing';
  if (w.match(/problem|issue|error|bug|broken|neveik|klaida|gedim|sugedo/)) return 'problem';
  if (w.match(/invoice|payment|mokėjim|sąskait|apmokėt|pay|billing/)) return 'payment';
  if (w.match(/document|dokument|contract|sutart|agreement|sign|pasirašy/)) return 'documents';
  if (w.match(/when|kada|deadline|termin|timeline|date|data|iki kada|laikas/)) return 'timeline';
  if (w.match(/onboard|pradėt|setup|start|connect|integrat|nauj|registr/)) return 'onboarding';
  return 'general';
}

// ─── REPLY GENERATION (MOCK) ────────────────────────────────────

interface ReplyParts {
  greeting: string;
  body: string[];
  closing: string;
}

function buildReply(parts: ReplyParts, tone: AITone, maxLength: 'short' | 'medium' | 'long'): string {
  let body = parts.body.join('\n\n');

  if (maxLength === 'short') {
    // Keep only first paragraph for short replies
    body = parts.body[0] || body;
  }

  if (tone === 'concise') {
    // Strip greeting pleasantries, keep direct
    return `${parts.greeting},\n\n${body}\n\n${parts.closing}`;
  }

  return `${parts.greeting},\n\n${body}\n\n${parts.closing}`;
}

function generateLtReply(topic: Topic, tone: AITone, maxLength: 'short' | 'medium' | 'long', context?: string): string {
  const greeting = tone === 'friendly' ? 'Sveiki' : 'Laba diena';
  const closing = tone === 'formal' ? 'Pagarbiai,\nOpsSuite komanda' : 'Su pagarba,\nOpsSuite komanda';

  if (context && context.trim().length > 20) {
    return buildReply({ greeting, body: [context.trim()], closing }, tone, maxLength);
  }

  const replies: Record<Topic, string[]> = {
    pricing: [
      'Gavome Jūsų užklausą dėl kainodaros.',
      'Mūsų standartinis pasiūlymas priklauso nuo paslaugų apimties ir sutarties trukmės. Norėdami pateikti tikslų pasiūlymą, turėčiau patikslinti kelis dalykus:\n\n— Kokios paslaugos Jus domina?\n— Koks planuojamas naudojimo laikotarpis?\n— Ar turite konkretų biudžetą?',
      'Galiu paruošti individualų pasiūlymą per 1–2 darbo dienas. Prašau patvirtinti, ar norėtumėte, kad susisiekčiau telefonu aptarti detales.',
    ],
    problem: [
      'Suprantame situaciją ir atsiprašome už nepatogumus.',
      'Jūsų pranešimas perduotas techninei komandai. Šiuo metu aiškinamės priežastis ir ieškome sprendimo.\n\nJei galite, prašau patikslinti:\n— Kada problema atsirado?\n— Ar ji pasikartoja nuolat?',
      'Informuosiu Jus apie sprendimo eigą artimiausiu metu. Jei situacija skubi, galite susisiekti tiesiogiai.',
    ],
    documents: [
      'Gavome Jūsų užklausą dėl dokumentų.',
      'Peržiūrėjau esamą informaciją. Reikalingus dokumentus parengsiu ir atsiųsiu per artimiausias 1–2 darbo dienas.\n\nJei trūksta kokių nors duomenų, susisieksiu papildomai.',
      'Prašau patvirtinti, ar visa kontaktinė informacija yra aktuali, kad galėčiau dokumentus išsiųsti tinkamu adresu.',
    ],
    timeline: [
      'Suprantu, kad terminai Jums svarbūs.',
      'Pagal dabartinį planą, numatoma užbaigimo data — šios savaitės pabaiga. Jei situacija keisis, informuosiu iš anksto.',
      'Ar yra konkretus terminas, kurio turite laikytis? Jei taip, prašau nurodyti — pritaikysime prioritetus.',
    ],
    payment: [
      'Gavome Jūsų klausimą dėl mokėjimo.',
      'Patikrinau mokėjimo būseną. Šiuo metu sąskaita yra apdorojama. Jei mokėjimas jau atliktas, prašau atsiųsti patvirtinimą — paspartinsime apdorojimą.\n\nJei reikia naujos sąskaitos arba mokėjimo grafiko pakeitimo, prašau pranešti.',
      'Informuosiu, kai tik mokėjimas bus patvirtintas.',
    ],
    onboarding: [
      'Sveikiname prisijungus!',
      'Jūsų paskyra paruošta ir galite pradėti naudotis sistema. Pagrindiniai žingsniai:\n\n1. Prisijunkite su gautais duomenimis\n2. Užpildykite pagrindinę informaciją\n3. Susipažinkite su pagrindinėmis funkcijomis',
      'Jei kiltų klausimų, drąsiai kreipkitės — padėsime greitai susiorientuoti.',
    ],
    access: [
      'Gavome Jūsų užklausą dėl prieigos.',
      'Patikrinau Jūsų paskyros būseną. Prieigos duomenys buvo išsiųsti registracijos metu.\n\nJei negalite prisijungti:\n— Patikrinkite, ar naudojate teisingą el. pašto adresą\n— Pabandykite atkurti slaptažodį\n— Jei problema išlieka, atsiųskite naudojamą el. pašto adresą ir atkursiu prieigą rankiniu būdu.',
    ],
    cancellation: [
      'Gavome Jūsų prašymą dėl nutraukimo.',
      'Prieš pradedant procedūrą, norėčiau patikslinti kelis dalykus:\n\n— Ar nutraukimas susijęs su konkrečia problema? Galbūt galime ją išspręsti.\n— Ar turite neapmokėtų sąskaitų?\n— Pageidaujama nutraukimo data.',
      'Gavus patvirtinimą, atliksime visus reikalingus veiksmus ir informuosime apie proceso eigą.',
    ],
    general: [
      'Gavome Jūsų žinutę.',
      'Peržiūrėjau pateiktą informaciją. Jei reikia papildomų veiksmų iš mūsų pusės, prašau patikslinti užklausą — tai padės greičiau rasti sprendimą.',
      'Susisieksiu su Jumis artimiausiu metu, jei prireiks papildomos informacijos.',
    ],
  };

  const body = replies[topic] || replies.general;
  return buildReply({ greeting, body, closing }, tone, maxLength);
}

function generateEnReply(topic: Topic, tone: AITone, maxLength: 'short' | 'medium' | 'long', context?: string): string {
  const greeting = tone === 'friendly' ? 'Hi there' : 'Hello';
  const closing = tone === 'formal' ? 'Sincerely,\nOpsSuite Team' : 'Best regards,\nOpsSuite Team';

  if (context && context.trim().length > 20) {
    return buildReply({ greeting, body: [context.trim()], closing }, tone, maxLength);
  }

  const replies: Record<Topic, string[]> = {
    pricing: [
      'We received your pricing inquiry.',
      'Our pricing depends on the scope of services and contract duration. To prepare an accurate proposal, I need to clarify a few points:\n\n— Which services are you interested in?\n— What is the expected usage period?\n— Do you have a specific budget in mind?',
      'I can prepare a tailored proposal within 1–2 business days. Please confirm if you would like me to schedule a call to discuss the details.',
    ],
    problem: [
      'We understand the situation and apologize for the inconvenience.',
      'Your report has been forwarded to our technical team. We are currently investigating the root cause.\n\nIf possible, please clarify:\n— When did the issue first occur?\n— Is it reproducible?',
      'I will update you on the resolution progress shortly. If the matter is urgent, please reach out directly.',
    ],
    documents: [
      'We received your document request.',
      'I have reviewed the available information. The required documents will be prepared and sent within 1–2 business days.\n\nIf any additional data is needed, I will reach out separately.',
      'Please confirm that your contact details are up to date so we can send the documents to the correct address.',
    ],
    timeline: [
      'I understand that timelines are important to you.',
      'Based on the current plan, the expected completion date is end of this week. If anything changes, I will notify you in advance.',
      'Is there a specific deadline you need to meet? If so, please share it and we will adjust priorities accordingly.',
    ],
    payment: [
      'We received your payment inquiry.',
      'I have checked the payment status. The invoice is currently being processed. If payment has already been made, please send a confirmation — this will help us expedite processing.\n\nIf you need a new invoice or a change in the payment schedule, please let me know.',
      'I will notify you as soon as the payment is confirmed.',
    ],
    onboarding: [
      'Welcome aboard!',
      'Your account is ready and you can start using the system. Here are the key steps:\n\n1. Log in with the credentials provided\n2. Complete your profile information\n3. Explore the main features',
      'If you have any questions, feel free to reach out — we are here to help you get started quickly.',
    ],
    access: [
      'We received your access request.',
      'I have checked your account status. Login credentials were sent during registration.\n\nIf you are unable to log in:\n— Verify you are using the correct email address\n— Try resetting your password\n— If the issue persists, send me the email address you are using and I will restore access manually.',
    ],
    cancellation: [
      'We received your cancellation request.',
      'Before we begin the process, I would like to clarify a few things:\n\n— Is the cancellation related to a specific issue? We may be able to resolve it.\n— Are there any outstanding invoices?\n— What is your preferred cancellation date?',
      'Once confirmed, we will complete all necessary steps and keep you informed throughout the process.',
    ],
    general: [
      'We received your message.',
      'I have reviewed the information provided. If further action is needed from our side, please clarify the request — this will help us find a solution faster.',
      'I will follow up shortly if additional information is required.',
    ],
  };

  const body = replies[topic] || replies.general;
  return buildReply({ greeting, body, closing }, tone, maxLength);
}

function generateReplyMock(request: AIReplyRequest, replyLang: DetectedLanguage): AIReplyResult {
  const { clientMessage, tone, context, maxLength = 'medium' } = request;
  const topic = detectTopic(clientMessage);

  const reply = replyLang === 'lt'
    ? generateLtReply(topic, tone, maxLength, context)
    : generateEnReply(topic, tone, maxLength, context);

  return { success: true, reply, detectedLanguage: replyLang };
}

// ─── PUBLIC API ──────────────────────────────────────────────────

export async function generateReply(request: AIReplyRequest): Promise<AIReplyResult> {
  if (!request.clientMessage.trim()) {
    return { success: false, reply: '', detectedLanguage: 'unknown', error: 'empty_input' };
  }

  // Auto-detect language from client message
  const detected = detectLanguage(request.clientMessage);
  // Use detected language for reply; fall back to Lithuanian if detection uncertain
  const replyLang = detected !== 'unknown' ? detected : 'lt';

  // ─── FUTURE: Real API call ─────────────────────────────────
  // const systemPrompt = `You are a professional customer success manager.
  //   Reply in ${replyLang === 'lt' ? 'Lithuanian' : 'English'}.
  //   Tone: ${request.tone}. Length: ${request.maxLength}.
  //   Structure: acknowledge → address → solution → next steps → close.
  //   Be concise, clear, actionable. No generic filler.`;
  //
  // try {
  //   const response = await fetch(AI_CONFIG.endpoint, {
  //     method: 'POST',
  //     headers: { ... },
  //     body: JSON.stringify({
  //       messages: [
  //         { role: 'system', content: systemPrompt },
  //         { role: 'user', content: request.clientMessage },
  //       ],
  //     }),
  //   });
  //   const data = await response.json();
  //   return { success: true, reply: data.choices[0].message.content, detectedLanguage: detected };
  // } catch (err) { ... }
  // ────────────────────────────────────────────────────────────

  await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));

  return generateReplyMock(request, replyLang as 'lt' | 'en');
}
