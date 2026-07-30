import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import yaml from "js-yaml";
import MarkdownIt from "markdown-it";
import markdownItTaskLists from "markdown-it-task-lists";

export const SITE_URL = "https://rosaechaia.adv.br";
export const PUBLICATIONS_INDEX_PATH =
  "/assets/data/publicacoes/index.json";
export const PUBLICATION_SCHEMA_VERSION = 1;
const ANALYTICS_CONTROLLER_REFERENCE =
  'src="/assets/js/analytics-consent.js?v=20260730-ga4-consent" data-analytics-controller';
const ANALYTICS_CONTROLLER_PATH = "assets/js/analytics-consent.js";
const ANALYTICS_MEASUREMENT_ID = "G-5LQ01Z477N";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_PROJECT_ROOT = path.resolve(MODULE_DIR, "../..");

const PUBLIC_ROOT_FILES = [
  "index.html",
  "404.html",
  "CNAME",
  ".nojekyll",
  "robots.txt",
  "sitemap.xml",
];

const PUBLIC_DIRECTORIES = [
  "assets",
  "escritorio",
  "areas-de-atuacao",
  "profissionais",
  "publicacoes",
  "contato",
  "privacidade",
];

const STATIC_SITEMAP_ROUTES = [
  "/",
  "/escritorio/",
  "/areas-de-atuacao/",
  "/profissionais/",
  "/contato/",
  "/privacidade/",
];

const SAFE_IMAGE_EXTENSIONS = new Set([".webp", ".jpg", ".jpeg", ".png"]);
const ALLOWED_EDITORIAL_ROOT_FILES = new Set(["README.md", "_modelo.md"]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const YEAR_PATTERN = /^\d{4}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: false,
});

markdown.use(markdownItTaskLists, {
  enabled: false,
  label: true,
  labelAfter: true,
});

const originalImageRenderer =
  markdown.renderer.rules.image ??
  ((tokens, index, options, environment, renderer) =>
    renderer.renderToken(tokens, index, options));

markdown.renderer.rules.image = (
  tokens,
  index,
  options,
  environment,
  renderer,
) => {
  tokens[index].attrSet("loading", "lazy");
  tokens[index].attrSet("decoding", "async");
  return originalImageRenderer(
    tokens,
    index,
    options,
    environment,
    renderer,
  );
};

const htmlDetector = new MarkdownIt({
  html: true,
  linkify: false,
  typographer: false,
});

export class PublicationValidationError extends Error {
  constructor(errors) {
    super(
      `Foram encontrados ${errors.length} erro(s) nas publicações:\n- ${errors.join(
        "\n- ",
      )}`,
    );
    this.name = "PublicationValidationError";
    this.errors = errors;
  }
}

function parseFrontMatter(source) {
  const normalized = String(source)
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  if (lines[0].trim() !== "---") {
    throw new Error("o arquivo deve começar com um bloco YAML entre ---");
  }

  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === "---",
  );
  if (closingIndex === -1) {
    throw new Error("o bloco YAML não foi fechado com ---");
  }

  const data = yaml.load(lines.slice(1, closingIndex).join("\n")) ?? {};
  if (typeof data !== "object" || Array.isArray(data)) {
    throw new Error("o front matter precisa ser um objeto YAML");
  }

  return {
    data,
    content: lines.slice(closingIndex + 1).join("\n"),
  };
}

export function normalizeFacetId(value) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function todayInSaoPaulo(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export function truncateAtWord(value, maximumLength) {
  const normalized = collapseWhitespace(value);
  if (normalized.length <= maximumLength) {
    return normalized;
  }
  const candidate = normalized.slice(0, maximumLength + 1);
  const lastSpace = candidate.lastIndexOf(" ");
  const cutAt = lastSpace > maximumLength * 0.6 ? lastSpace : maximumLength;
  return `${candidate.slice(0, cutAt).trimEnd()}…`;
}

export async function loadAuthors(projectRoot = DEFAULT_PROJECT_ROOT) {
  const authorsPath = path.join(
    projectRoot,
    "config",
    "publication-authors.json",
  );
  const source = await fs.readFile(authorsPath, "utf8");
  const authors = JSON.parse(source);

  for (const [id, author] of Object.entries(authors)) {
    if (
      !SLUG_PATTERN.test(id) ||
      !["Person", "Organization"].includes(author.type) ||
      typeof author.name !== "string" ||
      !author.name.trim() ||
      typeof author.url !== "string" ||
      !author.url.startsWith("/")
    ) {
      throw new Error(`Cadastro de autor inválido: ${id}`);
    }
  }

  return authors;
}

export async function collectPublications({
  projectRoot = DEFAULT_PROJECT_ROOT,
  today = todayInSaoPaulo(),
} = {}) {
  const sourceRoot = path.join(projectRoot, "_publicacoes");
  const authors = await loadAuthors(projectRoot);
  const errors = [];
  const publications = [];
  const rootEntries = await fs.readdir(sourceRoot, { withFileTypes: true });

  for (const entry of rootEntries) {
    if (entry.name === ".DS_Store") {
      continue;
    }

    if (entry.isFile()) {
      if (!ALLOWED_EDITORIAL_ROOT_FILES.has(entry.name)) {
        errors.push(
          `_publicacoes/${entry.name}: somente README.md e _modelo.md podem ficar fora de uma pasta anual`,
        );
      }
      continue;
    }

    if (!entry.isDirectory() || !YEAR_PATTERN.test(entry.name)) {
      errors.push(
        `_publicacoes/${entry.name}: a estrutura aceita apenas pastas anuais com quatro dígitos`,
      );
      continue;
    }

    const yearRoot = path.join(sourceRoot, entry.name);
    const yearEntries = await fs.readdir(yearRoot, { withFileTypes: true });

    for (const publicationEntry of yearEntries) {
      if (publicationEntry.name === ".DS_Store") {
        continue;
      }

      const relativePath = path.posix.join(
        "_publicacoes",
        entry.name,
        publicationEntry.name,
      );

      if (
        !publicationEntry.isFile() ||
        path.extname(publicationEntry.name).toLowerCase() !== ".md"
      ) {
        errors.push(
          `${relativePath}: cada pasta anual pode conter apenas arquivos Markdown diretamente`,
        );
        continue;
      }

      const filePath = path.join(yearRoot, publicationEntry.name);
      const publication = await parsePublicationFile({
        projectRoot,
        filePath,
        relativePath,
        year: entry.name,
        authors,
        today,
        errors,
      });

      if (publication) {
        publications.push(publication);
      }
    }
  }

  validateGlobalConsistency(publications, errors);

  if (errors.length > 0) {
    throw new PublicationValidationError(errors);
  }

  publications.sort(
    (left, right) =>
      right.date.localeCompare(left.date) ||
      left.title.localeCompare(right.title, "pt-BR"),
  );

  return { publications, authors };
}

async function parsePublicationFile({
  projectRoot,
  filePath,
  relativePath,
  year,
  authors,
  today,
  errors,
}) {
  const localErrors = [];
  const fileName = path.basename(filePath, ".md");

  if (!SLUG_PATTERN.test(fileName)) {
    localErrors.push(
      "o nome do arquivo deve usar somente minúsculas, números e hífens",
    );
  }

  let parsed;
  try {
    parsed = parseFrontMatter(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    localErrors.push(`front matter inválido: ${error.message}`);
    appendLocalErrors(relativePath, localErrors, errors);
    return null;
  }

  const date = normalizeDate(parsed.data.date, "date", localErrors, true);
  const updatedAt = normalizeDate(
    parsed.data.updated_at,
    "updated_at",
    localErrors,
    false,
  );

  if (date) {
    if (!date.startsWith(`${year}-`)) {
      localErrors.push(`date deve pertencer ao ano da pasta ${year}`);
    }
    if (date > today) {
      localErrors.push("date não pode estar no futuro");
    }
  }

  if (updatedAt) {
    if (date && updatedAt < date) {
      localErrors.push("updated_at não pode ser anterior a date");
    }
    if (updatedAt > today) {
      localErrors.push("updated_at não pode estar no futuro");
    }
  }

  const authorIds = validateAuthorIds(
    parsed.data.authors,
    authors,
    localErrors,
  );
  const categories = validateFacetList(
    parsed.data.categories,
    "categories",
    localErrors,
    true,
  );
  const tags = validateFacetList(
    parsed.data.tags,
    "tags",
    localErrors,
    false,
  );

  const summaryOverride = optionalString(
    parsed.data.summary,
    "summary",
    localErrors,
  );
  const image = optionalString(parsed.data.image, "image", localErrors);
  const imageAlt = optionalString(
    parsed.data.image_alt,
    "image_alt",
    localErrors,
  );

  if (Boolean(image) !== Boolean(imageAlt)) {
    localErrors.push("image e image_alt precisam ser informados juntos");
  }

  const content = parsed.content.replace(/\r\n/g, "\n");
  const contentLines = content.split("\n");
  const firstContentIndex = contentLines.findIndex(
    (line) => line.trim().length > 0,
  );
  const fullTokens = markdown.parse(content, {});
  const h1Indexes = fullTokens
    .map((token, index) =>
      token.type === "heading_open" && token.tag === "h1" ? index : -1,
    )
    .filter((index) => index >= 0);

  if (h1Indexes.length !== 1) {
    localErrors.push("o conteúdo deve conter exatamente um título iniciado por #");
  }

  const firstContentLine = contentLines[firstContentIndex];
  if (!firstContentLine?.startsWith("# ")) {
    localErrors.push("o primeiro conteúdo do arquivo deve ser o título com #");
  }

  const h1InlineToken =
    h1Indexes.length === 1 ? fullTokens[h1Indexes[0] + 1] : null;
  const title =
    h1InlineToken?.type === "inline"
      ? plainTextFromTokens(h1InlineToken.children ?? [])
      : "";
  if (!title) {
    localErrors.push("o título não pode estar vazio");
  }

  const htmlTokens = htmlDetector.parse(content, {});
  if (containsRawHtml(htmlTokens)) {
    localErrors.push("HTML cru não é permitido");
  }

  const bodyMarkdown =
    firstContentIndex >= 0
      ? contentLines.slice(firstContentIndex + 1).join("\n").trim()
      : "";
  const bodyTokens = markdown.parse(bodyMarkdown, {});
  validateHeadingHierarchy(bodyTokens, localErrors);

  await validateMarkdownResources({
    projectRoot,
    slug: fileName,
    tokens: bodyTokens,
    localErrors,
  });

  if (image) {
    await validateImagePath({
      projectRoot,
      slug: fileName,
      source: image,
      fieldLabel: "image",
      localErrors,
    });
  }

  const extractedSummary = extractFirstParagraph(bodyTokens);
  const summary = truncateAtWord(summaryOverride ?? extractedSummary, 240);

  if (!summary) {
    localErrors.push(
      "informe summary ou escreva um primeiro parágrafo com texto",
    );
  }

  appendLocalErrors(relativePath, localErrors, errors);
  if (localErrors.length > 0) {
    return null;
  }

  return {
    id: `${year}/${fileName}`,
    sourcePath: relativePath,
    year,
    slug: fileName,
    url: `/publicacoes/${fileName}/`,
    canonical: `${SITE_URL}/publicacoes/${fileName}/`,
    date,
    updatedAt,
    title,
    summary,
    metaDescription: truncateAtWord(summary, 160),
    authorIds,
    authors: authorIds.map((id) => ({ id, ...authors[id] })),
    categories,
    tags,
    image,
    imageAlt,
    bodyHtml: markdown.render(bodyMarkdown),
  };
}

function normalizeDate(value, fieldName, errors, required) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      errors.push(`${fieldName} é obrigatório`);
    }
    return null;
  }

  let normalized;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    normalized = value.toISOString().slice(0, 10);
  } else {
    normalized = String(value).trim();
  }

  if (!DATE_PATTERN.test(normalized)) {
    errors.push(`${fieldName} deve usar o formato AAAA-MM-DD`);
    return null;
  }

  const parsed = new Date(`${normalized}T12:00:00Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== normalized
  ) {
    errors.push(`${fieldName} contém uma data inválida`);
    return null;
  }

  return normalized;
}

function validateAuthorIds(value, authors, errors) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push("authors deve conter pelo menos um autor");
    return [];
  }

  const result = [];
  const seen = new Set();

  for (const rawValue of value) {
    const id = typeof rawValue === "string" ? rawValue.trim() : "";
    if (!id) {
      errors.push("authors contém um valor vazio ou inválido");
      continue;
    }
    if (!authors[id]) {
      errors.push(`autor desconhecido: ${id}`);
      continue;
    }
    if (seen.has(id)) {
      errors.push(`autor repetido: ${id}`);
      continue;
    }
    seen.add(id);
    result.push(id);
  }

  return result;
}

function validateFacetList(value, fieldName, errors, required) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      errors.push(`${fieldName} deve conter pelo menos um valor`);
    }
    return [];
  }

  if (!Array.isArray(value)) {
    errors.push(`${fieldName} deve ser uma lista YAML`);
    return [];
  }

  if (required && value.length === 0) {
    errors.push(`${fieldName} deve conter pelo menos um valor`);
  }

  const result = [];
  const seen = new Set();

  for (const rawValue of value) {
    if (typeof rawValue !== "string" || !rawValue.trim()) {
      errors.push(`${fieldName} contém um valor vazio ou inválido`);
      continue;
    }

    const label = collapseWhitespace(rawValue);
    const id = normalizeFacetId(label);
    if (!id) {
      errors.push(`${fieldName} contém um valor que não pode ser normalizado`);
      continue;
    }
    if (seen.has(id)) {
      errors.push(`${fieldName} contém um valor repetido: ${label}`);
      continue;
    }
    seen.add(id);
    result.push({ id, label });
  }

  return result;
}

function optionalString(value, fieldName, errors) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string" || !value.trim()) {
    errors.push(`${fieldName} deve ser um texto não vazio`);
    return null;
  }
  return collapseWhitespace(value);
}

function containsRawHtml(tokens) {
  for (const token of tokens) {
    if (token.type === "html_block" || token.type === "html_inline") {
      return true;
    }
    if (token.children && containsRawHtml(token.children)) {
      return true;
    }
  }
  return false;
}

function validateHeadingHierarchy(tokens, errors) {
  const headings = tokens.filter((token) => token.type === "heading_open");
  let previousLevel = 1;

  headings.forEach((heading, index) => {
    const level = Number(heading.tag.slice(1));
    if (index === 0 && level !== 2) {
      errors.push("a primeira seção do corpo deve começar com ##");
    }
    if (level > previousLevel + 1) {
      errors.push(
        `a hierarquia de títulos não pode saltar de h${previousLevel} para h${level}`,
      );
    }
    previousLevel = level;
  });
}

async function validateMarkdownResources({
  projectRoot,
  slug,
  tokens,
  localErrors,
}) {
  const tokenList = flattenTokens(tokens);
  for (const token of tokenList) {
    if (token.type === "link_open") {
      const target = token.attrGet("href") ?? "";
      if (!isSafeLink(target)) {
        localErrors.push(`link não permitido: ${target || "(vazio)"}`);
      }
    }

    if (token.type === "image") {
      const source = token.attrGet("src") ?? "";
      const alternativeText = collapseWhitespace(token.content ?? "");
      if (!alternativeText) {
        localErrors.push(`imagem sem texto alternativo: ${source || "(vazia)"}`);
      }
      await validateImagePath({
        projectRoot,
        slug,
        source,
        fieldLabel: "imagem no corpo",
        localErrors,
      });
    }
  }
}

function flattenTokens(tokens) {
  const result = [];
  for (const token of tokens) {
    result.push(token);
    if (token.children) {
      result.push(...flattenTokens(token.children));
    }
  }
  return result;
}

function isSafeLink(target) {
  return (
    target.startsWith("/") ||
    target.startsWith("#") ||
    /^https?:\/\//i.test(target) ||
    /^mailto:/i.test(target)
  );
}

async function validateImagePath({
  projectRoot,
  slug,
  source,
  fieldLabel,
  localErrors,
}) {
  const expectedPrefix = `/assets/img/publicacoes/${slug}/`;
  const extension = path.posix.extname(source.split(/[?#]/, 1)[0]).toLowerCase();

  if (!source.startsWith(expectedPrefix)) {
    localErrors.push(
      `${fieldLabel} deve ficar em ${expectedPrefix}`,
    );
    return;
  }

  if (!SAFE_IMAGE_EXTENSIONS.has(extension)) {
    localErrors.push(
      `${fieldLabel} deve usar WebP, JPEG ou PNG: ${source}`,
    );
    return;
  }

  if (source.includes("..") || source.includes("\\") || /[?#]/.test(source)) {
    localErrors.push(`${fieldLabel} contém um caminho inválido: ${source}`);
    return;
  }

  const absolutePath = path.resolve(projectRoot, source.slice(1));
  if (!absolutePath.startsWith(`${path.resolve(projectRoot)}${path.sep}`)) {
    localErrors.push(`${fieldLabel} aponta para fora do projeto: ${source}`);
    return;
  }

  try {
    const stat = await fs.stat(absolutePath);
    if (!stat.isFile()) {
      throw new Error("não é arquivo");
    }
  } catch {
    localErrors.push(`${fieldLabel} não encontrado: ${source}`);
  }
}

function extractFirstParagraph(tokens) {
  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index].type !== "paragraph_open") {
      continue;
    }
    const inline = tokens[index + 1];
    if (inline?.type !== "inline") {
      continue;
    }
    const text = plainTextFromTokens(inline.children ?? []);
    if (text) {
      return text;
    }
  }
  return "";
}

function plainTextFromTokens(tokens) {
  const parts = [];
  for (const token of tokens) {
    if (["text", "code_inline"].includes(token.type)) {
      parts.push(token.content);
    } else if (["softbreak", "hardbreak"].includes(token.type)) {
      parts.push(" ");
    } else if (token.type === "image" && token.content) {
      parts.push(token.content);
    }
  }
  return collapseWhitespace(parts.join(""));
}

function collapseWhitespace(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function appendLocalErrors(relativePath, localErrors, errors) {
  errors.push(...localErrors.map((message) => `${relativePath}: ${message}`));
}

function validateGlobalConsistency(publications, errors) {
  const slugs = new Map();
  const facetLabels = new Map();

  for (const publication of publications) {
    if (slugs.has(publication.slug)) {
      errors.push(
        `${publication.sourcePath}: slug repetida com ${slugs.get(
          publication.slug,
        )}`,
      );
    } else {
      slugs.set(publication.slug, publication.sourcePath);
    }

    for (const [fieldName, facets] of [
      ["categories", publication.categories],
      ["tags", publication.tags],
    ]) {
      for (const facet of facets) {
        const key = `${fieldName}:${facet.id}`;
        const previous = facetLabels.get(key);
        if (previous && previous.label !== facet.label) {
          errors.push(
            `${publication.sourcePath}: grafia conflitante para "${facet.id}": "${previous.label}" em ${previous.sourcePath} e "${facet.label}"`,
          );
        } else if (!previous) {
          facetLabels.set(key, {
            label: facet.label,
            sourcePath: publication.sourcePath,
          });
        }
      }
    }
  }
}

export function buildPublicationsIndex(publications) {
  const yearCounts = new Map();
  const authorCounts = new Map();
  const categoryCounts = new Map();
  const tagCounts = new Map();

  for (const publication of publications) {
    incrementCount(yearCounts, publication.year, publication.year);
    for (const author of publication.authors) {
      incrementCount(authorCounts, author.id, author.name);
    }
    for (const category of publication.categories) {
      incrementCount(categoryCounts, category.id, category.label);
    }
    for (const tag of publication.tags) {
      incrementCount(tagCounts, tag.id, tag.label);
    }
  }

  return {
    schemaVersion: PUBLICATION_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    facets: {
      years: sortedFacetValues(yearCounts, (left, right) =>
        right.id.localeCompare(left.id),
      ),
      authors: sortedFacetValues(authorCounts),
      categories: sortedFacetValues(categoryCounts),
      tags: sortedFacetValues(tagCounts),
    },
    items: publications.map((publication) => ({
      id: publication.id,
      slug: publication.slug,
      url: publication.url,
      year: Number(publication.year),
      date: publication.date,
      updatedAt: publication.updatedAt,
      title: publication.title,
      summary: publication.summary,
      authors: publication.authors.map(({ id, name, url }) => ({
        id,
        name,
        url,
      })),
      categories: publication.categories,
      tags: publication.tags,
      image: publication.image,
      imageAlt: publication.imageAlt,
    })),
  };
}

function incrementCount(map, id, label) {
  const previous = map.get(id);
  map.set(id, {
    id,
    label,
    count: (previous?.count ?? 0) + 1,
  });
}

function sortedFacetValues(
  map,
  compare = (left, right) => left.label.localeCompare(right.label, "pt-BR"),
) {
  return [...map.values()].sort(compare);
}

export async function buildSite({
  projectRoot = DEFAULT_PROJECT_ROOT,
  outputRoot = path.join(projectRoot, "dist"),
  today,
} = {}) {
  const { publications } = await collectPublications({ projectRoot, today });
  const index = buildPublicationsIndex(publications);

  await fs.rm(outputRoot, { recursive: true, force: true });
  await fs.mkdir(outputRoot, { recursive: true });

  for (const fileName of PUBLIC_ROOT_FILES) {
    await fs.copyFile(
      path.join(projectRoot, fileName),
      path.join(outputRoot, fileName),
    );
  }

  for (const directoryName of PUBLIC_DIRECTORIES) {
    await fs.cp(
      path.join(projectRoot, directoryName),
      path.join(outputRoot, directoryName),
      {
        recursive: true,
        filter: (source) => {
          const baseName = path.basename(source);
          return (
            !baseName.startsWith(".") &&
            path.extname(baseName).toLowerCase() !== ".md"
          );
        },
      },
    );
  }

  const indexOutputPath = path.join(
    outputRoot,
    PUBLICATIONS_INDEX_PATH.slice(1),
  );
  await fs.mkdir(path.dirname(indexOutputPath), { recursive: true });
  await fs.writeFile(
    indexOutputPath,
    `${JSON.stringify(index, null, 2)}\n`,
    "utf8",
  );

  const contentHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(index.items))
    .digest("hex")
    .slice(0, 12);

  await generateListing({
    projectRoot,
    outputRoot,
    publications,
    contentHash,
  });
  await generatePublicationPages({
    projectRoot,
    outputRoot,
    publications,
  });
  await fs.writeFile(
    path.join(outputRoot, "sitemap.xml"),
    renderSitemap(publications),
    "utf8",
  );

  return { publications, index, outputRoot };
}

async function generateListing({
  projectRoot,
  outputRoot,
  publications,
  contentHash,
}) {
  const sourcePath = path.join(projectRoot, "publicacoes", "index.html");
  let html = await fs.readFile(sourcePath, "utf8");

  assertMarker(html, "PUBLICATIONS_CONTROLS");
  assertMarker(html, "PUBLICATIONS_CARDS");
  assertMarker(html, "PUBLICATIONS_SCRIPT");

  if (publications.length > 0) {
    html = html.replace(
      '<meta name="robots" content="noindex, follow">',
      '<meta name="robots" content="index, follow, max-image-preview:large">',
    );
    html = html.replace(
      /<!-- PUBLICATIONS_EMPTY_START -->[\s\S]*?<!-- PUBLICATIONS_EMPTY_END -->/,
      "",
    );
    html = html.replace(
      "<!-- PUBLICATIONS_CONTROLS -->",
      renderListingControls(contentHash),
    );
    html = html.replace(
      "<!-- PUBLICATIONS_CARDS -->",
      publications.map(renderPublicationCard).join("\n"),
    );
    html = html.replace(
      "<!-- PUBLICATIONS_SCRIPT -->",
      '<script src="/assets/js/publications.js?v=20260726-publications" defer></script>',
    );
  } else {
    html = html
      .replace("<!-- PUBLICATIONS_EMPTY_START -->", "")
      .replace("<!-- PUBLICATIONS_EMPTY_END -->", "")
      .replace("<!-- PUBLICATIONS_CONTROLS -->", "")
      .replace("<!-- PUBLICATIONS_CARDS -->", "")
      .replace("<!-- PUBLICATIONS_SCRIPT -->", "");
  }

  await fs.writeFile(
    path.join(outputRoot, "publicacoes", "index.html"),
    html,
    "utf8",
  );
}

function assertMarker(source, markerName) {
  const marker = `<!-- ${markerName} -->`;
  if (source.split(marker).length !== 2) {
    throw new Error(
      `O template publicacoes/index.html deve conter exatamente um marcador ${marker}`,
    );
  }
}

function renderListingControls(contentHash) {
  return `<form class="publications-controls" data-publications-controls data-index-url="${PUBLICATIONS_INDEX_PATH}?v=${contentHash}" hidden>
            <div class="publications-primary-grid">
              <div class="publications-search-field">
                <label for="publications-search">Buscar publicações</label>
                <input class="form-control" id="publications-search" name="q" type="search" autocomplete="off" placeholder="Título, resumo, autoria, categoria ou tag">
              </div>
              ${renderEmptySelect("publications-year", "ano", "Ano", "Todos os anos")}
            </div>
            <div class="publications-filter-grid">
              ${renderEmptySelect("publications-author", "autor", "Autoria", "Todas as autorias")}
              ${renderEmptySelect("publications-category", "categoria", "Categoria", "Todas as categorias")}
              ${renderEmptySelect("publications-tag", "tag", "Tag", "Todas as tags")}
              <div>
                <label for="publications-order">Ordenar por</label>
                <select class="form-select" id="publications-order" name="ordem">
                  <option value="recentes">Mais recentes</option>
                  <option value="antigas">Mais antigas</option>
                  <option value="titulo">Título</option>
                </select>
              </div>
            </div>
            <div class="publications-controls-actions">
              <p class="visually-hidden" data-publications-results aria-live="polite"></p>
              <p class="publications-no-results" data-publications-no-results hidden>Nenhuma publicação encontrada.</p>
              <button class="publications-clear" type="button" data-publications-clear>Limpar filtros</button>
            </div>
          </form>`;
}

function renderEmptySelect(id, name, label, emptyLabel) {
  return `<div>
                <label for="${id}">${label}</label>
                <select class="form-select" id="${id}" name="${name}">
                  <option value="">${emptyLabel}</option>
                </select>
              </div>`;
}

function renderPublicationCard(publication) {
  const authors = renderLinkedList(
    publication.authors.map((author) => ({
      label: author.name,
      href: author.url,
    })),
    "publication-card-authors",
  );
  const image = publication.image
    ? `<figure class="publication-image-frame">
                <img class="publication-image" src="${escapeHtml(
                  publication.image,
                )}" alt="${escapeHtml(
                  publication.imageAlt,
                )}" loading="lazy" decoding="async">
              </figure>`
    : "";

  return `            <article class="publication-card${
    publication.image ? "" : " publication-card--text-only"
  }" data-publication-id="${escapeHtml(publication.id)}">
              ${image}
              <div class="publication-content">
                <p class="publication-meta"><time datetime="${publication.date}">${formatDatePtBr(
                  publication.date,
                )}</time></p>
                ${authors}
                <h2 class="publication-title"><a href="${publication.url}">${escapeHtml(
                  publication.title,
                )}</a></h2>
                <p>${escapeHtml(publication.summary)}</p>
                <ul class="publication-taxonomy" aria-label="Categorias e tags">
                  ${renderTaxonomyItems(publication)}
                </ul>
                <a class="publication-read-more" href="${publication.url}">Ler publicação<span class="visually-hidden">: ${escapeHtml(
                  publication.title,
                )}</span></a>
              </div>
            </article>`;
}

function renderTaxonomyItems(publication) {
  return [
    ...publication.categories.map((category) => ({
      href: `/publicacoes/?categoria=${encodeURIComponent(category.id)}`,
      label: category.label,
    })),
    ...publication.tags.map((tag) => ({
      href: `/publicacoes/?tag=${encodeURIComponent(tag.id)}`,
      label: tag.label,
    })),
  ]
    .map(
      (item) =>
        `<li class="publication-taxonomy-item"><a class="publication-taxonomy-link" href="${item.href}">${escapeHtml(item.label)}</a></li>`,
    )
    .join("\n                  ");
}

async function generatePublicationPages({
  projectRoot,
  outputRoot,
  publications,
}) {
  const templateSource = await fs.readFile(
    path.join(projectRoot, "templates", "publicacao.html"),
    "utf8",
  );

  for (const publication of publications) {
    const socialImage = publication.image
      ? `${SITE_URL}${publication.image}`
      : `${SITE_URL}/assets/img/social/rosa-e-chaia-social-1200x630.png`;
    const socialImageAlt =
      publication.imageAlt ?? "Identidade visual do escritório Rosa & Chaia";
    const authorLinks = publication.authors.map(
      (author) =>
        `<a href="${escapeHtml(author.url)}">${escapeHtml(author.name)}</a>`,
    );
    const articleModifiedMeta = publication.updatedAt
      ? `<meta property="article:modified_time" content="${escapeHtml(
          publication.updatedAt,
        )}">`
      : "";
    const articleAuthorMeta = publication.authors
      .map(
        (author) =>
          `<meta property="article:author" content="${escapeHtml(
            `${SITE_URL}${author.url}`,
          )}">`,
      )
      .join("\n    ");
    const articleSectionMeta = publication.categories
      .map(
        (category) =>
          `<meta property="article:section" content="${escapeHtml(
            category.label,
          )}">`,
      )
      .join("\n    ");
    const articleTagMeta = publication.tags
      .map(
        (tag) =>
          `<meta property="article:tag" content="${escapeHtml(tag.label)}">`,
      )
      .join("\n    ");
    const updatedDateMarkup = publication.updatedAt
      ? `
              <span aria-hidden="true"> · </span>
              Atualizado em <time datetime="${escapeHtml(
                publication.updatedAt,
              )}">${escapeHtml(formatDatePtBr(publication.updatedAt))}</time>`
      : "";
    const imageMarkup = publication.image
      ? `<figure class="publication-page-image-frame">
            <img class="publication-page-image" src="${escapeHtml(
              publication.image,
            )}" alt="${escapeHtml(publication.imageAlt)}" decoding="async">
          </figure>`
      : "";
    const html = renderArticleTemplate(templateSource, {
      TITLE: escapeHtml(publication.title),
      META_DESCRIPTION: escapeHtml(publication.metaDescription),
      CANONICAL: escapeHtml(publication.canonical),
      SOCIAL_IMAGE: escapeHtml(socialImage),
      SOCIAL_IMAGE_ALT: escapeHtml(socialImageAlt),
      DATE: escapeHtml(publication.date),
      ARTICLE_MODIFIED_META: articleModifiedMeta,
      ARTICLE_AUTHOR_META: articleAuthorMeta,
      ARTICLE_SECTION_META: articleSectionMeta,
      ARTICLE_TAG_META: articleTagMeta,
      JSON_LD: safeJson(buildArticleJsonLd(publication, socialImage)),
      PUBLISHED_DATE_LABEL: escapeHtml(formatDatePtBr(publication.date)),
      UPDATED_DATE_MARKUP: updatedDateMarkup,
      AUTHORS_MARKUP: formatNaturalList(authorLinks),
      TAXONOMY_MARKUP: renderTaxonomyItems(publication),
      IMAGE_MARKUP: imageMarkup,
      BODY_HTML: publication.bodyHtml,
    });
    const destination = path.join(
      outputRoot,
      "publicacoes",
      publication.slug,
      "index.html",
    );
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, html, "utf8");
  }
}

function renderArticleTemplate(source, replacements) {
  const usedMarkers = new Set();
  const html = source.replace(
    /\{\{([A-Z_]+)\}\}/g,
    (marker, name) => {
      if (!Object.hasOwn(replacements, name)) {
        throw new Error(
          `marcador sem valor no template de publicação: ${marker}`,
        );
      }
      usedMarkers.add(name);
      return String(replacements[name]);
    },
  );

  for (const name of Object.keys(replacements)) {
    if (!usedMarkers.has(name)) {
      throw new Error(
        `marcador ausente no template de publicação: {{${name}}}`,
      );
    }
  }
  return html;
}

function buildArticleJsonLd(publication, socialImage) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: publication.canonical,
    headline: publication.title,
    description: publication.metaDescription,
    datePublished: publication.date,
    ...(publication.updatedAt
      ? { dateModified: publication.updatedAt }
      : {}),
    author: publication.authors.map((author) => ({
      "@type": author.type,
      name: author.name,
      url: `${SITE_URL}${author.url}`,
    })),
    publisher: {
      "@type": "Organization",
      name: "Rosa & Chaia",
      url: `${SITE_URL}/`,
    },
    image: [socialImage],
    articleSection: publication.categories.map((category) => category.label),
    ...(publication.tags.length > 0
      ? { keywords: publication.tags.map((tag) => tag.label).join(", ") }
      : {}),
  };
}

function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function renderSitemap(publications) {
  const routes = [...STATIC_SITEMAP_ROUTES];
  if (publications.length > 0) {
    routes.push("/publicacoes/");
  }

  const staticEntries = routes
    .map(
      (route) => `  <url>
    <loc>${escapeXml(`${SITE_URL}${route}`)}</loc>
  </url>`,
    )
    .join("\n");
  const publicationEntries = publications
    .map(
      (publication) => `  <url>
    <loc>${escapeXml(publication.canonical)}</loc>
    <lastmod>${publication.updatedAt ?? publication.date}</lastmod>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}${publicationEntries ? `\n${publicationEntries}` : ""}
</urlset>
`;
}

export async function checkDist({
  projectRoot = DEFAULT_PROJECT_ROOT,
  outputRoot = path.join(projectRoot, "dist"),
  today,
} = {}) {
  const { publications } = await collectPublications({ projectRoot, today });
  const requiredFiles = [
    ".nojekyll",
    "CNAME",
    "404.html",
    "index.html",
    "robots.txt",
    "sitemap.xml",
    "publicacoes/index.html",
    "privacidade/index.html",
    PUBLICATIONS_INDEX_PATH.slice(1),
  ];

  for (const relativePath of requiredFiles) {
    await assertFile(path.join(outputRoot, relativePath), relativePath);
  }

  const cname = (
    await fs.readFile(path.join(outputRoot, "CNAME"), "utf8")
  ).trim();
  if (cname !== "rosaechaia.adv.br") {
    throw new Error("dist/CNAME não contém o domínio canônico esperado");
  }

  for (const forbiddenPath of [
    "_publicacoes",
    "contracts",
    "config",
    "scripts",
    "templates",
    ".github",
    "node_modules",
    "package.json",
    "package-lock.json",
    "README.md",
    "STRUCTURE.txt",
    "AGENTS.md",
  ]) {
    if (await pathExists(path.join(outputRoot, forbiddenPath))) {
      throw new Error(`arquivo interno publicado indevidamente: ${forbiddenPath}`);
    }
  }
  for (const relativePath of await listFiles(outputRoot)) {
    if (
      path.extname(relativePath).toLowerCase() === ".md" ||
      path.basename(relativePath).startsWith(".git")
    ) {
      throw new Error(
        `documentação ou marcador interno publicado indevidamente: ${relativePath}`,
      );
    }
  }

  const index = JSON.parse(
    await fs.readFile(
      path.join(outputRoot, PUBLICATIONS_INDEX_PATH.slice(1)),
      "utf8",
    ),
  );
  if (
    index.schemaVersion !== PUBLICATION_SCHEMA_VERSION ||
    index.items.length !== publications.length
  ) {
    throw new Error("index.json não corresponde às publicações validadas");
  }

  const listingHtml = await fs.readFile(
    path.join(outputRoot, "publicacoes", "index.html"),
    "utf8",
  );
  if (/PUBLICATIONS_(?:CONTROLS|CARDS|SCRIPT|EMPTY)/.test(listingHtml)) {
    throw new Error("a listagem publicada ainda contém marcadores de build");
  }
  if (
    publications.length === 0 &&
    !listingHtml.includes('<meta name="robots" content="noindex, follow">')
  ) {
    throw new Error("a listagem vazia deve permanecer em noindex");
  }
  if (
    publications.length > 0 &&
    !listingHtml.includes(
      '<meta name="robots" content="index, follow, max-image-preview:large">',
    )
  ) {
    throw new Error("a listagem com publicações deve ser indexável");
  }

  const sitemap = await fs.readFile(
    path.join(outputRoot, "sitemap.xml"),
    "utf8",
  );
  for (const publication of publications) {
    const relativePath = path.join(
      "publicacoes",
      publication.slug,
      "index.html",
    );
    await assertFile(path.join(outputRoot, relativePath), relativePath);
    const pageHtml = await fs.readFile(
      path.join(outputRoot, relativePath),
      "utf8",
    );
    if (
      !pageHtml.includes(
        `<link rel="canonical" href="${publication.canonical}">`,
      ) ||
      !pageHtml.includes('"@type":"Article"')
    ) {
      throw new Error(
        `${relativePath}: canonical ou JSON-LD Article não foi gerado`,
      );
    }
    if (!sitemap.includes(publication.canonical)) {
      throw new Error(`${relativePath}: URL ausente do sitemap`);
    }
  }

  await validateAnalyticsCoverage(outputRoot);
  await validateInternalReferences(outputRoot);
  return { publications };
}

async function assertFile(filePath, label) {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      throw new Error("não é arquivo");
    }
  } catch {
    throw new Error(`arquivo obrigatório ausente no artefato: ${label}`);
  }
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(root, current = root) {
  const files = [];
  for (const entry of await fs.readdir(current, { withFileTypes: true })) {
    const absolutePath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(root, absolutePath)));
    } else if (entry.isFile()) {
      files.push(path.relative(root, absolutePath));
    }
  }
  return files;
}

async function validateAnalyticsCoverage(outputRoot) {
  const files = await listFiles(outputRoot);
  const htmlFiles = files.filter(
    (relativePath) => path.extname(relativePath).toLowerCase() === ".html",
  );

  for (const relativePath of htmlFiles) {
    const html = await fs.readFile(
      path.join(outputRoot, relativePath),
      "utf8",
    );
    const controllerCount = html.split(ANALYTICS_CONTROLLER_REFERENCE).length - 1;

    if (controllerCount !== 1) {
      throw new Error(
        `${relativePath}: deve carregar exatamente um controlador de consentimento do Analytics`,
      );
    }
    if (html.includes("googletagmanager.com/gtag/js")) {
      throw new Error(
        `${relativePath}: a tag do Google não pode ser carregada diretamente antes do consentimento`,
      );
    }
    if (
      !html.includes('href="/privacidade/"') ||
      !html.includes("data-privacy-preferences")
    ) {
      throw new Error(
        `${relativePath}: política ou preferências de privacidade ausentes`,
      );
    }
  }

  const controllerSource = await fs.readFile(
    path.join(outputRoot, ANALYTICS_CONTROLLER_PATH),
    "utf8",
  );
  const measurementIdCount =
    controllerSource.split(ANALYTICS_MEASUREMENT_ID).length - 1;
  if (
    measurementIdCount !== 1 ||
    !controllerSource.includes("www.googletagmanager.com/gtag/js")
  ) {
    throw new Error(
      "controlador de consentimento não contém uma única configuração GA4 válida",
    );
  }

  const sitemap = await fs.readFile(
    path.join(outputRoot, "sitemap.xml"),
    "utf8",
  );
  if (!sitemap.includes(`${SITE_URL}/privacidade/`)) {
    throw new Error("a página de privacidade está ausente do sitemap");
  }
}

async function validateInternalReferences(outputRoot) {
  const htmlFiles = (await listFiles(outputRoot)).filter(
    (relativePath) => path.extname(relativePath).toLowerCase() === ".html",
  );
  const htmlCache = new Map();

  const loadHtml = async (relativePath) => {
    if (!htmlCache.has(relativePath)) {
      htmlCache.set(
        relativePath,
        await fs.readFile(path.join(outputRoot, relativePath), "utf8"),
      );
    }
    return htmlCache.get(relativePath);
  };

  for (const sourceRelativePath of htmlFiles) {
    const source = await loadHtml(sourceRelativePath);
    for (const match of source.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const reference = match[1].replace(/&amp;/g, "&");
      let targetRelativePath;
      let fragment = "";

      if (reference.startsWith("#")) {
        targetRelativePath = sourceRelativePath;
        fragment = reference.slice(1);
      } else if (reference.startsWith("/")) {
        const parsed = new URL(reference, SITE_URL);
        const pathname = decodeURIComponent(parsed.pathname);
        if (pathname.includes("..") || pathname.includes("\\")) {
          throw new Error(
            `${sourceRelativePath}: referência local inválida: ${reference}`,
          );
        }
        targetRelativePath =
          pathname === "/"
            ? "index.html"
            : pathname.endsWith("/")
              ? path.posix.join(pathname.slice(1), "index.html")
              : pathname.slice(1);
        fragment = decodeURIComponent(parsed.hash.slice(1));
      } else {
        continue;
      }

      await assertFile(
        path.join(outputRoot, targetRelativePath),
        `${targetRelativePath} referenciado por ${sourceRelativePath}`,
      );

      if (fragment && path.extname(targetRelativePath) === ".html") {
        const targetHtml = await loadHtml(targetRelativePath);
        const idPattern = new RegExp(
          `\\bid="${escapeRegExp(fragment)}"`,
        );
        if (!idPattern.test(targetHtml)) {
          throw new Error(
            `${sourceRelativePath}: âncora ausente em ${targetRelativePath}: #${fragment}`,
          );
        }
      }
    }
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatDatePtBr(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`));
}

function renderLinkedList(items, className) {
  const links = items.map(
    (item) =>
      `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`,
  );
  return `<p class="${className}">${formatNaturalList(links)}</p>`;
}

function formatNaturalList(items) {
  if (items.length <= 1) {
    return items[0] ?? "";
  }
  if (items.length === 2) {
    return `${items[0]} e ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")} e ${items.at(-1)}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeXml(value) {
  return escapeHtml(value);
}
