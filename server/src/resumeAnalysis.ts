import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { LocalIndex } from 'vectra';
import { PDFParse } from 'pdf-parse';
import { serverConfig } from './config.js';

interface AnalyzeResumeInput {
  resumeBuffer: Buffer;
  jobDescription: string;
  fileName: string;
}

interface AnalysisResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  aiAdvice: string;
  recommendations: RecommendationItem[];
  resumeText: string;
}

type RecommendationSection = 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications' | 'other';

interface RecommendationItem {
  section: RecommendationSection;
  text: string;
}

interface ResumeChunkMetadata extends Record<string, string | number | boolean> {
  analysisId: string;
  source: 'resume' | 'job-description';
  chunkIndex: number;
  fileName: string;
  textPreview: string;
}

interface TextChunk {
  text: string;
  index: number;
}

const stopWords = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'is', 'it', 'of', 'on', 'or',
  'that', 'the', 'to', 'with', 'you', 'your', 'will', 'this', 'our', 'their', 'they', 'we', 'us', 'using',
  'used', 'have', 'has', 'had', 'into', 'than', 'then', 'them', 'those', 'these', 'who', 'what', 'when',
  'where', 'why', 'how', 'can', 'could', 'should', 'must', 'may', 'might', 'over', 'under', 'across',
  'about', 'such', 'other', 'more', 'most', 'some', 'any', 'each', 'per', 'etc', 'role', 'team', 'teams',
  'work', 'working', 'experience', 'years', 'year', 'skills', 'skill', 'requirements', 'responsibilities',
]);

const skillMatchers = [
  { label: 'React', patterns: [/\breact(?:\.js)?\b/i] },
  { label: 'TypeScript', patterns: [/\btypescript\b/i] },
  { label: 'JavaScript', patterns: [/\bjavascript\b/i, /\bjs\b/i] },
  { label: 'Node.js', patterns: [/\bnode(?:\.js)?\b/i] },
  { label: 'Express', patterns: [/\bexpress\b/i, /\bexpress\.js\b/i] },
  { label: 'Python', patterns: [/\bpython\b/i] },
  { label: 'Java', patterns: [/\bjava\b/i] },
  { label: 'C++', patterns: [/\bc\+\+\b/i] },
  { label: 'C#', patterns: [/\bc#\b/i, /\bcsharp\b/i] },
  { label: 'SQL', patterns: [/\bsql\b/i] },
  { label: 'PostgreSQL', patterns: [/\bpostgres(?:ql)?\b/i] },
  { label: 'MySQL', patterns: [/\bmysql\b/i] },
  { label: 'MongoDB', patterns: [/\bmongodb\b/i, /\bmongo\b/i] },
  { label: 'Redis', patterns: [/\bredis\b/i] },
  { label: 'Docker', patterns: [/\bdocker\b/i] },
  { label: 'Kubernetes', patterns: [/\bkubernetes\b/i, /\bk8s\b/i] },
  { label: 'AWS', patterns: [/\baws\b/i, /\bamazon web services\b/i] },
  { label: 'Azure', patterns: [/\bazure\b/i] },
  { label: 'GCP', patterns: [/\bgcp\b/i, /\bgoogle cloud\b/i] },
  { label: 'REST API', patterns: [/\brest(?:ful)?\b/i, /\brest api\b/i] },
  { label: 'GraphQL', patterns: [/\bgraphql\b/i] },
  { label: 'CI/CD', patterns: [/\bci\/cd\b/i, /\bcontinuous integration\b/i, /\bcontinuous delivery\b/i] },
  { label: 'Git', patterns: [/\bgit\b/i, /\bgithub\b/i, /\bgitlab\b/i] },
  { label: 'Machine Learning', patterns: [/\bmachine learning\b/i, /\bml\b/i] },
  { label: 'NLP', patterns: [/\bnlp\b/i, /\bnatural language processing\b/i] },
  { label: 'LLMs', patterns: [/\bllm\b/i, /\blarge language model\b/i, /\bgenerative ai\b/i] },
  { label: 'LangChain', patterns: [/\blangchain\b/i] },
  { label: 'RAG', patterns: [/\brag\b/i, /\bretrieval augmented generation\b/i] },
  { label: 'Vector Databases', patterns: [/\bvector database\b/i, /\bvector db\b/i, /\bfaiss\b/i, /\bpinecone\b/i, /\bqdrant\b/i, /\bchroma\b/i, /\bvectra\b/i] },
  { label: 'Testing', patterns: [/\btesting\b/i, /\bunit test(?:ing)?\b/i, /\bintegration test(?:ing)?\b/i, /\bjest\b/i, /\bvitest\b/i] },
  { label: 'System Design', patterns: [/\bsystem design\b/i] },
  { label: 'Agile', patterns: [/\bagile\b/i, /\bscrum\b/i] },
  { label: 'Communication', patterns: [/\bcommunication\b/i, /\bstakeholder\b/i] },
  { label: 'Leadership', patterns: [/\bleadership\b/i, /\bled\b/i, /\bmentor(?:ed|ing)?\b/i] },
];

const vectorIndex = new LocalIndex<ResumeChunkMetadata>(serverConfig.vectorIndexPath);

export async function analyzeResume({ resumeBuffer, jobDescription, fileName }: AnalyzeResumeInput): Promise<AnalysisResult> {
  const resumeText = await extractTextFromPdf(resumeBuffer);
  const normalizedResumeText = normalizeWhitespace(resumeText);
  const normalizedJobDescription = normalizeWhitespace(jobDescription);

  if (normalizedResumeText.length < 80) {
    throw new Error('The uploaded resume does not contain enough readable text to analyze.');
  }

  if (normalizedJobDescription.length < 80) {
    throw new Error('The job description needs more detail before it can be analyzed.');
  }

  const analysisId = randomUUID();
  const resumeChunks = chunkText(normalizedResumeText);
  const jobChunks = chunkText(normalizedJobDescription);

  await ensureVectorIndex();
  const itemsToInsert = [
    ...resumeChunks.map((chunk): { vector: number[]; metadata: ResumeChunkMetadata } => ({
      vector: embedText(chunk.text),
      metadata: {
        analysisId,
        source: 'resume' as const,
        chunkIndex: chunk.index,
        fileName,
        textPreview: chunk.text.slice(0, 240),
      },
    })),
    ...jobChunks.map((chunk): { vector: number[]; metadata: ResumeChunkMetadata } => ({
      vector: embedText(chunk.text),
      metadata: {
        analysisId,
        source: 'job-description' as const,
        chunkIndex: chunk.index,
        fileName,
        textPreview: chunk.text.slice(0, 240),
      },
    })),
  ];

  await vectorIndex.batchInsertItems(itemsToInsert);

  const retrievalScores = await Promise.all(jobChunks.map(async (chunk) => {
    const results = await vectorIndex.queryItems(
      embedText(chunk.text),
      chunk.text,
      3,
      {
        analysisId: { $eq: analysisId },
        source: { $eq: 'resume' },
      },
    );

    logChunkMatches({
      analysisId,
      jobChunk: chunk,
      results,
    });

    return results;
  }));

  const flattenedMatches = retrievalScores.flat();
  const averageRetrievalScore = flattenedMatches.length === 0
    ? 0
    : flattenedMatches.reduce((sum, result) => sum + clampScore(result.score), 0) / flattenedMatches.length;

  const resumeSkills = extractSkills(normalizedResumeText);
  const jobSkills = extractSkills(normalizedJobDescription);
  const matchedSkills = jobSkills.filter((skill) => resumeSkills.includes(skill));
  const missingSkills = jobSkills.filter((skill) => !resumeSkills.includes(skill));

  const keywordCoverage = computeKeywordCoverage(normalizedResumeText, normalizedJobDescription);
  const skillCoverage = jobSkills.length === 0 ? keywordCoverage : matchedSkills.length / jobSkills.length;

  const weightedScore = (skillCoverage * 0.55) + (averageRetrievalScore * 0.3) + (keywordCoverage * 0.15);
  const matchScore = Math.max(12, Math.min(98, Math.round(weightedScore * 100)));

  logAnalysisSummary({
    analysisId,
    fileName,
    resumeChunkCount: resumeChunks.length,
    jobChunkCount: jobChunks.length,
    averageRetrievalScore,
    skillCoverage,
    keywordCoverage,
    matchScore,
    matchedSkillsCount: matchedSkills.length,
    missingSkillsCount: missingSkills.length,
  });

  const strongestEvidence = flattenedMatches
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map((result) => result.item.metadata.textPreview)
    .filter(Boolean);

  const fallbackAdvice = buildAdvice({
    matchScore,
    matchedSkills,
    missingSkills,
    strongestEvidence,
    keywordCoverage,
  });

  const aiOutput = await generateRecommendationsWithGrok({
    resumeText: normalizedResumeText,
    jobDescription: normalizedJobDescription,
    matchScore,
    matchedSkills,
    missingSkills,
    fallbackAdvice,
  });

  return {
    matchScore,
    matchedSkills,
    missingSkills,
    aiAdvice: aiOutput.aiAdvice,
    recommendations: aiOutput.recommendations,
    resumeText: normalizedResumeText,
  };
}

async function ensureVectorIndex() {
  await mkdir(serverConfig.vectorIndexPath, { recursive: true });

  if (!(await vectorIndex.isIndexCreated())) {
    await vectorIndex.createIndex({
      metadata_config: {
        indexed: ['analysisId', 'source', 'chunkIndex', 'fileName'],
      },
      version: 1,
    });
  }
}

async function extractTextFromPdf(resumeBuffer: Buffer) {
  const parser = new PDFParse({ data: resumeBuffer });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

function normalizeWhitespace(text: string) {
  return text
    .replace(/\u0000/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[\t ]+/g, ' ')
    .trim();
}

function chunkText(text: string): TextChunk[] {
  const sentences = text
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return [{ text, index: 0 }];
  }

  const chunks: TextChunk[] = [];
  let currentWords: string[] = [];
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).filter(Boolean);
    const nextSize = currentWords.length + sentenceWords.length;

    if (currentWords.length > 0 && nextSize > serverConfig.chunkSizeWords) {
      chunks.push({ text: currentWords.join(' ').trim(), index: chunkIndex });
      const overlapWords = currentWords.slice(-serverConfig.chunkOverlapWords);
      currentWords = [...overlapWords, ...sentenceWords];
      chunkIndex += 1;
      continue;
    }

    currentWords.push(...sentenceWords);
  }

  if (currentWords.length > 0) {
    chunks.push({ text: currentWords.join(' ').trim(), index: chunkIndex });
  }

  return chunks;
}

function embedText(text: string) {
  const vector = new Array<number>(serverConfig.embeddingDimensions).fill(0);
  const tokens = tokenize(text);

  if (tokens.length === 0) {
    vector[0] = 1;
    return vector;
  }

  for (const token of tokens) {
    const primaryHash = hashToken(token);
    const secondaryHash = hashToken(`${token}:sign`);
    const position = Math.abs(primaryHash) % vector.length;
    const sign = secondaryHash % 2 === 0 ? 1 : -1;
    const weight = 1 + Math.min(token.length, 12) / 12;

    vector[position] += sign * weight;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + (value * value), 0));

  if (magnitude === 0) {
    vector[0] = 1;
    return vector;
  }

  return vector.map((value) => value / magnitude);
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/node\.js/g, 'nodejs')
    .replace(/react\.js/g, 'reactjs')
    .replace(/c\+\+/g, 'cplusplus')
    .replace(/c#/g, 'csharp')
    .replace(/\.net/g, 'dotnet')
    .split(/[^a-z0-9+#.]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

function hashToken(token: string) {
  let hash = 0;

  for (let index = 0; index < token.length; index += 1) {
    hash = ((hash << 5) - hash) + token.charCodeAt(index);
    hash |= 0;
  }

  return hash;
}

function extractSkills(text: string) {
  return skillMatchers
    .filter((matcher) => matcher.patterns.some((pattern) => pattern.test(text)))
    .map((matcher) => matcher.label);
}

function computeKeywordCoverage(resumeText: string, jobDescription: string) {
  const resumeKeywords = new Set(extractKeywords(resumeText));
  const jobKeywords = extractKeywords(jobDescription);

  if (jobKeywords.length === 0) {
    return 0;
  }

  const overlapCount = jobKeywords.filter((keyword) => resumeKeywords.has(keyword)).length;
  return overlapCount / jobKeywords.length;
}

function extractKeywords(text: string) {
  const frequency = new Map<string, number>();

  for (const token of tokenize(text)) {
    frequency.set(token, (frequency.get(token) ?? 0) + 1);
  }

  return [...frequency.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 30)
    .map(([token]) => token);
}

function clampScore(score: number) {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(1, score));
}

function logChunkMatches(input: {
  analysisId: string;
  jobChunk: TextChunk;
  results: Awaited<ReturnType<typeof vectorIndex.queryItems>>;
}) {
  if (!serverConfig.vectorDebugLogging) {
    return;
  }

  const jobPreview = sanitizePreview(input.jobChunk.text, 130);
  console.log(`\n[VectorDB] Analysis ${input.analysisId}`);
  console.log(`[VectorDB] JD chunk #${input.jobChunk.index}: "${jobPreview}"`);

  if (input.results.length === 0) {
    console.log('[VectorDB] No resume chunks retrieved for this query.');
    return;
  }

  for (const [rankIndex, result] of input.results.entries()) {
    const similarity = clampScore(result.score);
    const distance = 1 - similarity;
    const resumePreview = sanitizePreview(result.item.metadata.textPreview, 130);
    const overlap = summarizeTokenOverlap(input.jobChunk.text, result.item.metadata.textPreview);

    console.log(
      `[VectorDB] #${rankIndex + 1} resume chunk ${result.item.metadata.chunkIndex} | similarity=${similarity.toFixed(4)} | distance=${distance.toFixed(4)} | overlap=${overlap}`,
    );
    console.log(`[VectorDB]    resume: "${resumePreview}"`);
  }
}

function logAnalysisSummary(input: {
  analysisId: string;
  fileName: string;
  resumeChunkCount: number;
  jobChunkCount: number;
  averageRetrievalScore: number;
  skillCoverage: number;
  keywordCoverage: number;
  matchScore: number;
  matchedSkillsCount: number;
  missingSkillsCount: number;
}) {
  if (!serverConfig.vectorDebugLogging) {
    return;
  }

  const retrievalDistance = 1 - clampScore(input.averageRetrievalScore);

  console.log('\n[VectorDB] Analysis summary');
  console.log(`[VectorDB] analysisId=${input.analysisId} file=${input.fileName}`);
  console.log(`[VectorDB] chunks resume=${input.resumeChunkCount} jobDescription=${input.jobChunkCount}`);
  console.log(
    `[VectorDB] avgSimilarity=${clampScore(input.averageRetrievalScore).toFixed(4)} avgDistance=${retrievalDistance.toFixed(4)} skillCoverage=${input.skillCoverage.toFixed(4)} keywordCoverage=${input.keywordCoverage.toFixed(4)}`,
  );
  console.log(
    `[VectorDB] matchedSkills=${input.matchedSkillsCount} missingSkills=${input.missingSkillsCount} finalMatchScore=${input.matchScore}`,
  );
}

function sanitizePreview(text: string, maxLength: number) {
  return normalizeWhitespace(text).slice(0, maxLength);
}

function summarizeTokenOverlap(jobText: string, resumeText: string) {
  const resumeTokens = new Set(tokenize(resumeText));
  const overlap = [...new Set(tokenize(jobText).filter((token) => resumeTokens.has(token)))];

  if (overlap.length === 0) {
    return 'none';
  }

  return overlap.slice(0, 6).join(', ');
}

function buildAdvice(input: {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strongestEvidence: string[];
  keywordCoverage: number;
}) {
  const strengths = input.matchedSkills.slice(0, 3);
  const gaps = input.missingSkills.slice(0, 3);
  const evidenceSnippet = input.strongestEvidence[0]?.slice(0, 150);
  const coverageLabel = input.keywordCoverage >= 0.65 ? 'strong' : input.keywordCoverage >= 0.4 ? 'moderate' : 'limited';

  const adviceParts = [
    strengths.length > 0
      ? `Your resume already aligns well on ${strengths.join(', ')}.`
      : 'Your resume needs clearer alignment to the job requirements.',
    gaps.length > 0
      ? `Add concrete evidence for ${gaps.join(', ')} with project outcomes, scope, and measurable results.`
      : 'Most named skills from the job description already appear in your resume, so focus on sharpening impact statements and metrics.',
    evidenceSnippet
      ? `The backend found relevant overlap around: "${evidenceSnippet}".`
      : 'The strongest overlap is spread across multiple chunks rather than a single focused section.',
    `Overall keyword coverage is ${coverageLabel}, so make the most important role-specific terms easier to spot in your summary, experience, and skills sections.`,
  ];

  if (input.matchScore < 55) {
    adviceParts.unshift('This role is still a stretch match in its current form.');
  }

  return adviceParts.join(' ');
}

async function generateRecommendationsWithGrok(input: {
  resumeText: string;
  jobDescription: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  fallbackAdvice: string;
}) {
  if (!serverConfig.grokApiKey) {
    return {
      aiAdvice: input.fallbackAdvice,
      recommendations: buildFallbackRecommendations(input.missingSkills),
    };
  }

  const prompt = [
    'You are an expert resume coach.',
    'Return JSON only with the shape:',
    '{"aiAdvice":"string", "recommendations":[{"section":"skills|experience|projects|summary|education|certifications|other","text":"string"}]}',
    'Rules:',
    '- Give concise, specific, role-focused recommendations.',
    '- Recommendations must be 1 sentence each and ready to paste into a resume.',
    '- Every recommendation must include a section from this exact set: summary, skills, experience, projects, education, certifications, other.',
    '- Do not invent fake achievements or numbers.',
    '- Use action verbs and professional style.',
    '- Recommendations should be grounded in missing or weak alignment areas.',
    '',
    `Current match score: ${input.matchScore}`,
    `Matched skills: ${input.matchedSkills.join(', ') || 'None'}`,
    `Missing skills: ${input.missingSkills.join(', ') || 'None identified'}`,
    '',
    'Resume text:',
    input.resumeText.slice(0, 5000),
    '',
    'Job description:',
    input.jobDescription.slice(0, 5000),
  ].join('\n');

  try {
    const candidateModels = buildCandidateModels(serverConfig.grokModel, serverConfig.grokBaseUrl);
    let lastError: Error | null = null;

    for (const model of candidateModels) {
      const response = await fetch(`${serverConfig.grokBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverConfig.grokApiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You produce strict JSON output only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorDetails = await readErrorBody(response);
        const shouldTryResponsesApi = response.status === 400 || response.status === 404;

        if (shouldTryResponsesApi) {
          const responsesResult = await requestRecommendationsViaResponsesApi({
            model,
            prompt,
          });

          if (responsesResult.ok) {
            const parsed = parseJsonPayload(responsesResult.content);

            if (!parsed) {
              throw new Error(`Could not parse JSON recommendations from Grok /responses output using model "${model}".`);
            }

            const aiAdvice = typeof parsed.aiAdvice === 'string' && parsed.aiAdvice.trim().length > 0
              ? parsed.aiAdvice.trim()
              : input.fallbackAdvice;

            const recommendations = parseRecommendationItems(parsed.recommendations).slice(0, 7);

            return {
              aiAdvice,
              recommendations: recommendations.length > 0 ? recommendations : buildFallbackRecommendations(input.missingSkills),
            };
          }

          const responsesErrorSuffix = responsesResult.errorDetails ? `; /responses failed: ${responsesResult.errorDetails}` : '; /responses failed';
          lastError = new Error(`Grok request failed with status ${response.status} using model "${model}"${errorDetails ? `: ${errorDetails}` : ''}${responsesErrorSuffix}`);
        } else {
          lastError = new Error(`Grok request failed with status ${response.status} using model "${model}"${errorDetails ? `: ${errorDetails}` : ''}`);
        }

        const shouldTryNextModel = response.status === 400 && model !== candidateModels[candidateModels.length - 1];

        if (shouldTryNextModel) {
          continue;
        }

        throw lastError;
      }

      const payload = await response.json() as {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
      };

      const rawContent = payload.choices?.[0]?.message?.content ?? '';
      const parsed = parseJsonPayload(rawContent);

      if (!parsed) {
        throw new Error(`Could not parse JSON recommendations from Grok response using model "${model}".`);
      }

      const aiAdvice = typeof parsed.aiAdvice === 'string' && parsed.aiAdvice.trim().length > 0
        ? parsed.aiAdvice.trim()
        : input.fallbackAdvice;

      const recommendations = parseRecommendationItems(parsed.recommendations).slice(0, 7);

      return {
        aiAdvice,
        recommendations: recommendations.length > 0 ? recommendations : buildFallbackRecommendations(input.missingSkills),
      };
    }

    if (lastError) {
      throw lastError;
    }

    throw new Error('Grok request failed before a response was received.');
  } catch (error) {
    console.error('Grok recommendation generation failed. Falling back to local advice.', error);

    return {
      aiAdvice: input.fallbackAdvice,
      recommendations: buildFallbackRecommendations(input.missingSkills),
    };
  }
}

async function requestRecommendationsViaResponsesApi(input: {
  model: string;
  prompt: string;
}): Promise<{ ok: true; content: string } | { ok: false; errorDetails: string }> {
  const response = await fetch(`${serverConfig.grokBaseUrl}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serverConfig.grokApiKey}`,
    },
    body: JSON.stringify({
      model: input.model,
      input: [
        {
          role: 'system',
          content: 'You produce strict JSON output only.',
        },
        {
          role: 'user',
          content: input.prompt,
        },
      ],
      text: {
        format: {
          type: 'text',
        },
      },
    }),
  });

  if (!response.ok) {
    const errorDetails = await readErrorBody(response);

    return {
      ok: false,
      errorDetails: errorDetails || `status ${response.status}`,
    };
  }

  const payload = await response.json() as {
    output?: Array<{
      type?: string;
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  const messageEntry = payload.output?.find((entry) => entry?.type === 'message');
  const textEntry = messageEntry?.content?.find((entry) => entry?.type === 'output_text');
  const content = typeof textEntry?.text === 'string' ? textEntry.text : '';

  if (!content.trim()) {
    return {
      ok: false,
      errorDetails: 'missing output_text content in /responses payload',
    };
  }

  return {
    ok: true,
    content,
  };
}

function buildCandidateModels(configuredModel: string, baseUrl: string): string[] {
  const model = configuredModel.trim();

  if (!model) {
    return [];
  }

  const normalizedBaseUrl = baseUrl.trim().toLowerCase();
  const isXaiEndpoint = normalizedBaseUrl.includes('api.x.ai');
  const isGrokModel = model.toLowerCase().startsWith('grok-');

  if (!isXaiEndpoint || !isGrokModel) {
    return [model];
  }

  if (model.endsWith('-latest')) {
    return [model];
  }

  return [model, `${model}-latest`];
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    const rawBody = await response.text();

    if (!rawBody) {
      return '';
    }

    const parsedUnknown = JSON.parse(rawBody) as unknown;

    if (parsedUnknown && typeof parsedUnknown === 'object' && 'error' in parsedUnknown) {
      const errorContainer = parsedUnknown as { error?: unknown };

      if (!errorContainer.error || typeof errorContainer.error !== 'object') {
        return rawBody.slice(0, 300);
      }

      const errorObject = errorContainer.error as { message?: unknown; type?: unknown; code?: unknown };
      const message = typeof errorObject.message === 'string' ? errorObject.message.trim() : '';
      const type = typeof errorObject.type === 'string' ? errorObject.type.trim() : '';
      const code = typeof errorObject.code === 'string' ? errorObject.code.trim() : '';
      const details = [message, type, code].filter(Boolean).join(' | ');

      return details || rawBody.slice(0, 300);
    }

    return rawBody.slice(0, 300);
  } catch {
    return '';
  }
}

function parseJsonPayload(content: string): { aiAdvice?: unknown; recommendations?: unknown } | null {
  const direct = safeJsonParse(content);

  if (direct) {
    return direct;
  }

  const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  if (fencedMatch?.[1]) {
    return safeJsonParse(fencedMatch[1]);
  }

  return null;
}

function safeJsonParse(value: string) {
  try {
    const parsed = JSON.parse(value);

    if (parsed && typeof parsed === 'object') {
      return parsed as { aiAdvice?: unknown; recommendations?: unknown };
    }

    return null;
  } catch {
    return null;
  }
}

function parseRecommendationItems(value: unknown): RecommendationItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const candidate = entry as { section?: unknown; text?: unknown };

      if (typeof candidate.text !== 'string') {
        return null;
      }

      const normalizedSection = normalizeRecommendationSection(candidate.section);

      return {
        section: normalizedSection,
        text: candidate.text.trim(),
      } as RecommendationItem;
    })
    .filter((entry): entry is RecommendationItem => Boolean(entry?.text));
}

function normalizeRecommendationSection(value: unknown): RecommendationSection {
  if (typeof value !== 'string') {
    return 'other';
  }

  const section = value.trim().toLowerCase();

  if (section === 'summary' || section === 'skills' || section === 'experience' || section === 'projects' || section === 'education' || section === 'certifications') {
    return section;
  }

  return 'other';
}

function buildFallbackRecommendations(missingSkills: string[]): RecommendationItem[] {
  const prioritized = missingSkills.slice(0, 4);

  const recommendations: RecommendationItem[] = prioritized.map((skill) =>
    ({
      section: 'skills' as const,
      text: `Add ${skill} to your skills list only if you can support it with project or work evidence elsewhere in the resume.`,
    }),
  );

  recommendations.push({
    section: 'summary',
    text: 'Strengthen your summary with 2-3 role-specific keywords from the job description and align them with your strongest recent achievements.',
  });

  return recommendations.slice(0, 6);
}