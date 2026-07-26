# Rosa & Chaia

Site institucional estático do escritório Rosa & Chaia.

## Estado atual

O projeto contém as seis rotas estáticas previstas nos contratos, com navegação
responsiva, identidade visual compartilhada, rodapé institucional e botão
flutuante de WhatsApp em todas as páginas, exceto na página de contato.

O conteúdo institucional, os dados profissionais e a publicidade jurídica
foram revisados e aprovados. A página de publicações está disponível, mas seus
artigos continuam em preparação e, por isso, permanece fora da indexação.
Quando houver arquivos válidos em `_publicacoes/<ano>/`, o gerador criará a
listagem, as páginas individuais e o índice público automaticamente.

O Bootstrap 5.3.8 está armazenado localmente e não há dependências em tempo de
execução carregadas por CDN.

Na página inicial, o carrossel de avaliações avança automaticamente a cada 6,5
segundos, respeita a preferência por redução de movimento e permanece pausado
após a primeira interação intencional. Em telas menores que 1024 pixels, a
navegação usa contador numérico entre as setas; nas demais, usa indicadores.

O domínio canônico é `https://rosaechaia.adv.br/`. O projeto inclui canonical,
Open Graph, Twitter Cards, favicon, manifest, imagem social, `robots.txt`,
`sitemap.xml`, `404.html`, `CNAME` e dados estruturados `WebSite` e
`LegalService` na página inicial.

O site está publicado pelo GitHub Pages com HTTPS ativo. O repositório contém
um workflow para validar, testar e gerar em `dist/` somente os arquivos
públicos antes do deploy. As versões HTTP e `www` redirecionam diretamente
para o domínio canônico, e URLs inexistentes retornam status HTTP 404 real.

## Executar localmente

Na raiz do projeto, execute:

```bash
npm ci
npm run build
npm run check
npm run serve
```

Abra `http://127.0.0.1:8000/` no navegador. O servidor usa o artefato de
`dist/`, reproduz as rotas com `index.html` e retorna a página 404 com o status
correto. O projeto usa caminhos iniciados na raiz e não oferece suporte à
abertura direta dos arquivos por `file://`.

Os comandos disponíveis são:

- `npm run validate`: valida os Markdown sem gerar o site;
- `npm test`: executa os testes automatizados;
- `npm run build`: recria `dist/`;
- `npm run check`: confere o conteúdo e as exclusões do artefato;
- `npm run serve`: serve o `dist/` já gerado.

O manual para autoras e o arquivo copiável estão em
`_publicacoes/README.md` e `_publicacoes/_modelo.md`. Eles nunca integram o
artefato público.

## Publicação pelo GitHub Pages

O workflow **Validar e publicar GitHub Pages** executa as validações em pull
requests e publica o `dist/` somente a partir da `main`. Antes do primeiro
deploy por esse fluxo, altere em **Settings → Pages → Build and deployment** a
fonte para **GitHub Actions**. Essa troca de configuração remota não é feita
pelos scripts do projeto.

O artefato preserva `CNAME`, `.nojekyll`, `404.html` e os recursos estáticos
atuais. Se validação, teste, build ou inspeção falhar, o job de deploy não é
executado e a última versão válida permanece publicada.

## Gerar imagens responsivas

As fotografias das profissionais e do escritório usam variantes WebP
responsivas, mantendo os arquivos PNG e JPEG originais como fallback. Para
regerar as variantes, use ImageMagick 7:

```bash
./scripts/generate-responsive-images.sh
```

O script gera os arquivos primeiro em um diretório temporário, valida as
dimensões e a transparência aplicáveis e só então atualiza as variantes em
`assets/img/`. Ele foi validado com ImageMagick `7.1.2-27`.

## Rotas

- `/`
- `/escritorio/`
- `/areas-de-atuacao/`
- `/profissionais/`
- `/publicacoes/`
- `/publicacoes/<slug>/` para cada publicação gerada
- `/contato/`

## Publicação validada

Em 26 de julho de 2026:

- as seis rotas públicas responderam com HTML e status HTTP 200;
- as cinco páginas indexáveis apresentaram canonical autorreferente e estavam
  incluídas no `sitemap.xml`;
- `/publicacoes/` permaneceu em `noindex, follow` e fora do sitemap;
- uma URL inexistente retornou status HTTP 404 com `noindex, follow`;
- HTTP e `www` redirecionaram em uma etapa para o domínio canônico HTTPS;
- o Lighthouse 13.4.1, em perfil móvel, registrou SEO e acessibilidade 100 nas
  cinco páginas indexáveis, com performance entre 97 e 100.

## Pendências de conteúdo e SEO

- publicar e revisar individualmente cada conteúdo futuro da página de
  publicações;
- verificar a propriedade do domínio no Google Search Console, enviar o
  sitemap e acompanhar a substituição de resultados antigos do WordPress;
- revisar no Google Business Profile a consistência de nome, endereço,
  telefone, site e link público das avaliações;
- otimizar as imagens recorrentes de marca e o favicon antes de priorizar
  reduções adicionais de CSS.

## Estrutura

```text
rosa-e-chaia-adv-br/
├── AGENTS.md
├── README.md
├── STRUCTURE.txt
├── .gitignore
├── .nojekyll
├── 404.html
├── CNAME
├── package.json
├── package-lock.json
├── robots.txt
├── sitemap.xml
├── index.html
├── _publicacoes/
│   ├── README.md
│   └── _modelo.md
├── config/
│   └── publication-authors.json
├── templates/
│   └── publicacao.html
├── escritorio/
│   └── index.html
├── areas-de-atuacao/
│   └── index.html
├── profissionais/
│   └── index.html
├── publicacoes/
│   └── index.html
├── contato/
│   └── index.html
├── scripts/
│   ├── generate-responsive-images.sh
│   ├── publications.mjs
│   ├── serve.mjs
│   ├── lib/
│   │   └── publications.mjs
│   └── tests/
│       └── publications.test.mjs
├── assets/
│   ├── css/
│   │   └── theme.css
│   ├── fonts/
│   ├── icons/
│   ├── img/
│   │   ├── favicon/
│   │   ├── icons/
│   │   ├── publicacoes/
│   │   ├── social/
│   │   └── imagens institucionais, variantes WebP e arquivos de marca
│   ├── js/
│   │   ├── home-reviews-carousel.js
│   │   ├── publications.js
│   │   └── whatsapp-float.js
│   └── vendor/
│       └── bootstrap/
│           ├── css/
│           │   └── bootstrap.min.css
│           ├── js/
│           │   └── bootstrap.bundle.min.js
│           └── README.md
└── contracts/
    ├── README.md
    ├── 00-project-brief.md
    ├── 01-scope.md
    ├── 02-information-architecture.md
    ├── 03-technical-architecture.md
    ├── 04-design-system.md
    ├── 05-content-and-legal.md
    ├── 06-accessibility-seo.md
    ├── 07-deployment-github-pages.md
    └── 08-definition-of-done.md
```
