import { readFile, writeFile } from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';

const sourcePath = 'c:/users/himan/Downloads/resume_1.pdf';
const outputPath = 'c:/Users/himan/OneDrive/Desktop/Project/resumerelevance-ai/resume_template_structured.md';

const headingMap = [
  ['summary', [/^summary$/i, /^professional summary$/i, /^profile$/i]],
  ['skills', [/^skills?$/i, /^technical skills?$/i, /^core skills?$/i]],
  ['experience', [/^experience$/i, /^work experience$/i, /^professional experience$/i, /^employment history$/i]],
  ['projects', [/^projects?$/i, /^personal projects?$/i]],
  ['education', [/^education$/i, /^academic background$/i]],
  ['certifications', [/^certifications?$/i, /^licenses$/i]],
];

const sections = {
  summary: [],
  skills: [],
  experience: [],
  projects: [],
  education: [],
  certifications: [],
  other: [],
};

const buffer = await readFile(sourcePath);
const parser = new PDFParse({ data: buffer });

try {
  const parsed = await parser.getText();
  const text = parsed.text
    .replace(/\u0000/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let currentSection = 'other';

  for (const line of lines) {
    const normalized = line.replace(/[:\-]+$/g, '').trim();
    const matchedSection = headingMap.find(([, patterns]) => patterns.some((pattern) => pattern.test(normalized)));

    if (matchedSection) {
      currentSection = matchedSection[0];
      continue;
    }

    sections[currentSection].push(line);
  }

  for (const key of Object.keys(sections)) {
    sections[key] = sections[key].filter((line, index, arr) => line && (index === 0 || line !== arr[index - 1]));
  }

  const formatSection = (title, key) => {
    if (!sections[key].length) {
      return '';
    }

    const bullets = sections[key]
      .map((line) => (line.startsWith('-') ? line : `- ${line}`))
      .join('\n');

    return `## ${title}\n${bullets}\n`;
  };

  const output = [
    '# Resume Draft (Structured from Template)',
    '',
    formatSection('Summary', 'summary'),
    formatSection('Skills', 'skills'),
    formatSection('Experience', 'experience'),
    formatSection('Projects', 'projects'),
    formatSection('Education', 'education'),
    formatSection('Certifications', 'certifications'),
    formatSection('Additional Information', 'other'),
  ]
    .filter(Boolean)
    .join('\n');

  await writeFile(outputPath, output, 'utf8');
  console.log(`Created ${outputPath}`);
} finally {
  await parser.destroy();
}
