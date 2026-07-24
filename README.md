# Rosa e Chaia

Site institucional estático do escritório Rosa e Chaia.

## Estado atual

O projeto contém as seis rotas estáticas previstas nos contratos, com navegação
responsiva, identidade visual compartilhada, rodapé institucional e botão
flutuante de WhatsApp em todas as páginas, exceto na página de contato.

O conteúdo institucional e jurídico está implementado e ainda depende de revisão
e aprovação final. A página de publicações está disponível, mas seus artigos
continuam em preparação.

O Bootstrap 5.3.8 está armazenado localmente e não há dependências em tempo de
execução carregadas por CDN.

## Executar localmente

Na raiz do projeto, execute:

```bash
python3 -m http.server 8000
```

Abra `http://localhost:8000/` no navegador. O projeto usa caminhos iniciados na
raiz e, portanto, não oferece suporte à abertura direta dos arquivos por
`file://`.

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
- `/contato/`

## Pendências de conteúdo e publicação

- revisar e aprovar o conteúdo institucional e jurídico, os registros
  profissionais e as avaliações exibidas;
- confirmar o domínio próprio antes de criar `CNAME` e URLs canônicas;
- criar `robots.txt`, `sitemap.xml`, favicon e manifest após a confirmação do
  domínio;
- validar a publicação real no GitHub Pages antes de divulgá-la.

## Estrutura

```text
rosa-e-chaia-adv-br/
├── AGENTS.md
├── README.md
├── STRUCTURE.txt
├── .gitignore
├── .nojekyll
├── index.html
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
│   └── generate-responsive-images.sh
├── assets/
│   ├── css/
│   │   └── theme.css
│   ├── fonts/
│   ├── icons/
│   ├── img/
│   │   ├── icons/
│   │   ├── publicacoes/
│   │   └── imagens institucionais, variantes WebP e arquivos de marca
│   ├── js/
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
