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

  const strongestEvidence = flattenedMatches
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map((result) => result.item.metadata.textPreview)
    .filter(Boolean);

  return {
    matchScore,
    matchedSkills,
    missingSkills,
    aiAdvice: buildAdvice({
      matchScore,
      matchedSkills,
      missingSkills,
      strongestEvidence,
      keywordCoverage,
    }),
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