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
└── contato/
    └── index.html
```

## Navegação principal

Ordem recomendada:

1. Início
2. Escritório
3. Áreas de atuação
4. Profissionais
5. Contato

## Convenções

- URLs em português, minúsculas e com hífen;
- cada rota usa uma pasta com `index.html`;
- links internos devem funcionar no domínio e em ambiente local;
- não usar extensões `.html` nos links de navegação;
- não criar rotas sem registrar a mudança neste contrato.

## Estrutura de cada página

Cada página deve conter, quando aplicável:

1. cabeçalho;
2. navegação;
3. conteúdo principal em `<main>`;
4. uma única identificação principal com `<h1>`;
5. chamada para contato;
6. rodapé.
