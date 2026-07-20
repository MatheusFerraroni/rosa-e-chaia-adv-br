# Rosa e Chaia

Scaffold navegável do site institucional do escritório Rosa e Chaia.

## Estado atual

O projeto contém as cinco rotas estáticas previstas nos contratos, com navegação
responsiva, layout compartilhado e conteúdo marcado explicitamente como pendente.
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

## Rotas

- `/`
- `/escritorio/`
- `/areas-de-atuacao/`
- `/profissionais/`
- `/contato/`

## Pendências de conteúdo e publicação

- confirmar o domínio próprio antes de criar `CNAME` e URLs canônicas;
- aprovar e revisar o conteúdo institucional e jurídico;
- confirmar profissionais, registros e canais de contato;
- criar os arquivos complementares de SEO após a confirmação do domínio;
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
├── contato/
│   └── index.html
├── assets/
│   ├── css/
│   │   └── theme.css
│   ├── fonts/
│   ├── icons/
│   ├── img/
│   ├── js/
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
