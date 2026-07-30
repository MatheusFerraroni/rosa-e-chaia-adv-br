import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildPublicationsIndex,
  buildSite,
  checkDist,
  collectPublications,
  DEFAULT_PROJECT_ROOT,
  normalizeFacetId,
  PublicationValidationError,
  truncateAtWord,
} from "../lib/publications.mjs";

const TODAY = "2026-07-26";
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

async function createFixture(testContext, { staticSite = false } = {}) {
  const projectRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "rosa-e-chaia-publicacoes-"),
  );
  testContext.after(() =>
    fs.rm(projectRoot, { recursive: true, force: true }),
  );

  await fs.mkdir(path.join(projectRoot, "_publicacoes"), {
    recursive: true,
  });
  await fs.writeFile(
    path.join(projectRoot, "_publicacoes", "README.md"),
    "# Manual de teste\n",
  );
  await fs.writeFile(
    path.join(projectRoot, "_publicacoes", "_modelo.md"),
    "# Modelo de teste\n",
  );
  await fs.cp(
    path.join(DEFAULT_PROJECT_ROOT, "config"),
    path.join(projectRoot, "config"),
    { recursive: true },
  );

  if (staticSite) {
    for (const fileName of PUBLIC_ROOT_FILES) {
      await fs.copyFile(
        path.join(DEFAULT_PROJECT_ROOT, fileName),
        path.join(projectRoot, fileName),
      );
    }
    for (const directoryName of PUBLIC_DIRECTORIES) {
      await fs.cp(
        path.join(DEFAULT_PROJECT_ROOT, directoryName),
        path.join(projectRoot, directoryName),
        { recursive: true },
      );
    }
    await fs.cp(
      path.join(DEFAULT_PROJECT_ROOT, "templates"),
      path.join(projectRoot, "templates"),
      { recursive: true },
    );
  }

  return projectRoot;
}

async function writePublication(
  projectRoot,
  {
    year = "2026",
    slug = "publicacao-de-teste",
    date = "2026-07-26",
    updatedAt = "",
    authors = ["gabriela-chaia"],
    categories = ["Direito Civil"],
    tags = [],
    summary = "",
    image = "",
    imageAlt = "",
    body = [
      "# Publicação de teste",
      "",
      "Este é o primeiro parágrafo usado como resumo automático.",
      "",
      "## Primeiro tópico",
      "",
      "Conteúdo da publicação.",
    ].join("\n"),
  } = {},
) {
  const yearRoot = path.join(projectRoot, "_publicacoes", year);
  await fs.mkdir(yearRoot, { recursive: true });
  const yamlList = (values) =>
    values.length > 0
      ? `\n${values.map((value) => `  - ${value}`).join("\n")}`
      : " []";
  const source = `---
date: ${date}
updated_at: ${updatedAt}
authors:${yamlList(authors)}
categories:${yamlList(categories)}
tags:${yamlList(tags)}
summary: ${summary}
image: ${image}
image_alt: ${imageAlt}
---

${body}
`;
  await fs.writeFile(path.join(yearRoot, `${slug}.md`), source);
}

test("normaliza facetas e limita resumos sem cortar palavras curtas", () => {
  assert.equal(normalizeFacetId(" Proteção & Dados "), "protecao-e-dados");
  assert.equal(
    truncateAtWord("Um resumo com palavras completas", 20),
    "Um resumo com…",
  );
});

test("coleta GFM, coautoria, assinatura institucional e facetas", async (t) => {
  const projectRoot = await createFixture(t);
  const slug = "guia-de-protecao-de-dados";
  const imageDirectory = path.join(
    projectRoot,
    "assets",
    "img",
    "publicacoes",
    slug,
  );
  await fs.mkdir(imageDirectory, { recursive: true });
  await fs.writeFile(path.join(imageDirectory, "fluxo.png"), "");

  await writePublication(projectRoot, {
    slug,
    updatedAt: "2026-07-26",
    authors: ["gabriela-chaia", "giane-rosa"],
    categories: ["Proteção de Dados", "Direito Civil"],
    tags: ["LGPD", "Relações de trabalho"],
    body: [
      "# Guia de proteção de dados",
      "",
      "Primeiro parágrafo com **ênfase** e [link seguro](https://example.com).",
      "",
      "## Lista",
      "",
      "- Item um",
      "- Item dois",
      "",
      "## Tabela",
      "",
      "| Coluna | Valor |",
      "| --- | --- |",
      "| Exemplo | 1 |",
      "",
      "> Uma citação.",
      "",
      `![Descrição do fluxo](/assets/img/publicacoes/${slug}/fluxo.png)`,
    ].join("\n"),
  });
  await writePublication(projectRoot, {
    year: "2025",
    slug: "nota-institucional",
    date: "2025-05-10",
    authors: ["rosa-e-chaia"],
    categories: ["Institucional"],
    summary: "Resumo editorial aprovado.",
    body: [
      "# Nota institucional",
      "",
      "Parágrafo que não substituirá o resumo editorial.",
    ].join("\n"),
  });

  const { publications } = await collectPublications({
    projectRoot,
    today: TODAY,
  });
  const index = buildPublicationsIndex(publications);

  assert.equal(publications.length, 2);
  assert.equal(publications[0].slug, slug);
  assert.equal(publications[0].authors.length, 2);
  assert.match(publications[0].bodyHtml, /<table>/);
  assert.match(publications[0].bodyHtml, /<blockquote>/);
  assert.match(publications[0].bodyHtml, /loading="lazy"/);
  assert.equal(
    publications[0].summary,
    "Primeiro parágrafo com ênfase e link seguro.",
  );
  assert.equal(publications[1].authors[0].type, "Organization");
  assert.equal(publications[1].summary, "Resumo editorial aprovado.");
  assert.equal(index.schemaVersion, 1);
  assert.deepEqual(
    index.facets.years.map(({ id, count }) => [id, count]),
    [
      ["2026", 1],
      ["2025", 1],
    ],
  );
  assert.equal(
    index.facets.authors.find(({ id }) => id === "rosa-e-chaia").count,
    1,
  );
});

test("rejeita metadados, estrutura, HTML, imagens e slugs inválidos", async (t) => {
  const projectRoot = await createFixture(t);
  await fs.writeFile(
    path.join(projectRoot, "_publicacoes", "rascunho.md"),
    "# Fora da estrutura\n",
  );
  await writePublication(projectRoot, {
    slug: "data-futura",
    date: "2026-07-27",
  });
  await writePublication(projectRoot, {
    year: "2025",
    slug: "pasta-incorreta",
    date: "2026-01-10",
  });
  await writePublication(projectRoot, {
    slug: "autor-desconhecido",
    authors: ["pessoa-nao-cadastrada"],
  });
  await writePublication(projectRoot, {
    slug: "sem-categoria",
    categories: [],
  });
  await writePublication(projectRoot, {
    slug: "html-proibido",
    body: [
      "# HTML proibido",
      "",
      "Primeiro parágrafo válido.",
      "",
      "<script>alert('não')</script>",
    ].join("\n"),
  });
  await writePublication(projectRoot, {
    slug: "segundo-h1",
    body: [
      "# Título principal",
      "",
      "Primeiro parágrafo válido.",
      "",
      "Outro título principal",
      "===",
    ].join("\n"),
  });
  await writePublication(projectRoot, {
    slug: "hierarquia-invalida",
    body: [
      "# Título principal",
      "",
      "Primeiro parágrafo válido.",
      "",
      "### Seção que saltou um nível",
    ].join("\n"),
  });
  await writePublication(projectRoot, {
    slug: "imagem-ausente",
    image: "/assets/img/publicacoes/imagem-ausente/capa.webp",
    imageAlt: "Descrição da capa",
  });
  await writePublication(projectRoot, {
    slug: "atualizacao-invalida",
    date: "2026-07-20",
    updatedAt: "2026-07-19",
  });
  await writePublication(projectRoot, {
    year: "2025",
    slug: "slug-repetida",
    date: "2025-01-02",
  });
  await writePublication(projectRoot, {
    slug: "slug-repetida",
    date: "2026-01-02",
  });
  await writePublication(projectRoot, {
    slug: "grafia-um",
    categories: ["Proteção de Dados"],
  });
  await writePublication(projectRoot, {
    slug: "grafia-dois",
    categories: ["Protecao de Dados"],
  });

  await assert.rejects(
    collectPublications({ projectRoot, today: TODAY }),
    (error) => {
      assert.ok(error instanceof PublicationValidationError);
      assert.match(error.message, /somente README\.md e _modelo\.md/);
      assert.match(error.message, /date não pode estar no futuro/);
      assert.match(error.message, /date deve pertencer ao ano da pasta 2025/);
      assert.match(error.message, /autor desconhecido/);
      assert.match(error.message, /categories deve conter pelo menos um valor/);
      assert.match(error.message, /HTML cru não é permitido/);
      assert.match(error.message, /exatamente um título iniciado por #/);
      assert.match(error.message, /a primeira seção do corpo deve começar com ##/);
      assert.match(error.message, /não pode saltar de h1 para h3/);
      assert.match(error.message, /imagem-ausente\/capa\.webp/);
      assert.match(error.message, /updated_at não pode ser anterior a date/);
      assert.match(error.message, /slug repetida/);
      assert.match(error.message, /grafia conflitante/);
      return true;
    },
  );
});

test("gera artefato completo e remove uma publicação sem resíduos", async (t) => {
  const projectRoot = await createFixture(t, { staticSite: true });
  const slug = "publicacao-renderizada";
  await writePublication(projectRoot, {
    slug,
    updatedAt: "2026-07-26",
    authors: ["rosa-e-chaia", "giane-rosa"],
    categories: ["Direito Civil"],
    tags: ["Contratos"],
    body: [
      "# Publicação renderizada",
      "",
      "Resumo automático desta publicação.",
      "",
      "## Conteúdo",
      "",
      "- Primeiro item",
      "- Segundo item",
    ].join("\n"),
  });

  const firstBuild = await buildSite({
    projectRoot,
    today: TODAY,
  });
  await checkDist({ projectRoot, today: TODAY });

  const index = JSON.parse(
    await fs.readFile(
      path.join(
        firstBuild.outputRoot,
        "assets",
        "data",
        "publicacoes",
        "index.json",
      ),
      "utf8",
    ),
  );
  const listing = await fs.readFile(
    path.join(firstBuild.outputRoot, "publicacoes", "index.html"),
    "utf8",
  );
  const article = await fs.readFile(
    path.join(
      firstBuild.outputRoot,
      "publicacoes",
      slug,
      "index.html",
    ),
    "utf8",
  );
  const sitemap = await fs.readFile(
    path.join(firstBuild.outputRoot, "sitemap.xml"),
    "utf8",
  );

  assert.equal(index.items.length, 1);
  assert.match(listing, /data-publications-controls/);
  assert.match(listing, /class="publications-primary-grid"/);
  assert.match(
    listing,
    /class="visually-hidden" data-publications-results/,
  );
  assert.doesNotMatch(listing, /publications-results-count/);
  assert.match(listing, /<ul class="publication-taxonomy"/);
  assert.doesNotMatch(listing, /publication-chip/);
  assert.match(
    listing,
    /<meta name="robots" content="index, follow, max-image-preview:large">/,
  );
  assert.match(article, /<h1 class="publication-page-title">Publicação renderizada<\/h1>/);
  assert.match(article, /"@type":"Article"/);
  assert.match(
    article,
    /<meta property="article:modified_time" content="2026-07-26">/,
  );
  assert.match(article, /<h2>Conteúdo<\/h2>/);
  assert.match(
    article,
    /<ul class="publication-taxonomy publication-taxonomy--page">/,
  );
  assert.match(article, /class="publication-taxonomy-link"/);
  assert.doesNotMatch(article, /publication-chip/);
  assert.equal(
    article.match(/data-analytics-controller/g)?.length,
    1,
  );
  assert.match(article, /href="\/privacidade\/"/);
  assert.match(
    article,
    /<meta property="article:author" content="https:\/\/rosaechaia\.adv\.br\/">/,
  );
  assert.match(sitemap, /\/publicacoes\/publicacao-renderizada\//);
  assert.match(sitemap, /\/privacidade\//);
  await assert.rejects(
    fs.access(path.join(firstBuild.outputRoot, "_publicacoes")),
  );
  await assert.rejects(
    fs.access(
      path.join(
        firstBuild.outputRoot,
        "assets",
        "vendor",
        "bootstrap",
        "README.md",
      ),
    ),
  );
  await assert.rejects(
    fs.access(
      path.join(
        firstBuild.outputRoot,
        "assets",
        "img",
        "publicacoes",
        "README.md",
      ),
    ),
  );

  await fs.rm(
    path.join(
      projectRoot,
      "_publicacoes",
      "2026",
      `${slug}.md`,
    ),
  );
  const secondBuild = await buildSite({
    projectRoot,
    today: TODAY,
  });
  await checkDist({ projectRoot, today: TODAY });

  const emptyListing = await fs.readFile(
    path.join(secondBuild.outputRoot, "publicacoes", "index.html"),
    "utf8",
  );
  const emptySitemap = await fs.readFile(
    path.join(secondBuild.outputRoot, "sitemap.xml"),
    "utf8",
  );
  assert.match(
    emptyListing,
    /<meta name="robots" content="noindex, follow">/,
  );
  assert.doesNotMatch(emptySitemap, /\/publicacoes\//);
  await assert.rejects(
    fs.access(
      path.join(secondBuild.outputRoot, "publicacoes", slug, "index.html"),
    ),
  );
});
