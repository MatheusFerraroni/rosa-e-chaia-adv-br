# 02. Arquitetura de informação

## Rotas planejadas

```text
/
├── index.html
├── escritorio/
│   └── index.html
├── areas-de-atuacao/
│   └── index.html
├── profissionais/
│   └── index.html
├── publicacoes/
│   ├── index.html
│   └── <slug>/
│       └── index.html
├── contato/
│   └── index.html
└── privacidade/
    └── index.html
```

## Navegação principal

Ordem recomendada:

1. Início
2. Escritório
3. Áreas de atuação
4. Profissionais
5. Publicações
6. Contato

## Convenções

- URLs em português, minúsculas e com hífen;
- cada rota usa uma pasta com `index.html`;
- links internos devem funcionar no domínio e em ambiente local;
- não usar extensões `.html` nos links de navegação;
- não criar rotas sem registrar a mudança neste contrato.
- a política de privacidade fica em `/privacidade/`, é ligada por todos os
  rodapés e não integra a navegação principal.

## Publicações

- a URL individual usa `/publicacoes/<slug>/`;
- a `slug` deriva do nome do arquivo Markdown e deve ser única e imutável;
- o ano organiza os arquivos editoriais e alimenta o filtro, mas não integra a
  URL pública;
- categorias e tags de uma publicação ligam de volta à listagem com o filtro
  correspondente;
- busca, filtros, ordenação e página atual são representados por parâmetros de
  consulta na listagem;
- os parâmetros públicos são `q`, `ano`, `autor`, `categoria`, `tag`, `ordem`
  e `pagina`;
- cada faceta aceita um valor ativo, a página exibe seis resultados e as
  ordenações aceitas são recentes, antigas e título.

## Estrutura de cada página

Cada página deve conter, quando aplicável:

1. cabeçalho;
2. navegação;
3. conteúdo principal em `<main>`;
4. uma única identificação principal com `<h1>`;
5. chamada para contato;
6. rodapé.
