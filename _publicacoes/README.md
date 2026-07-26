# Como publicar

Cada arquivo Markdown válido dentro de `_publicacoes/<ano>/` vira
automaticamente uma página no site depois que o commit chega à `main` e o
workflow termina com sucesso.

## Antes de começar

1. O texto, título, autorias, categorias, tags, datas e imagens precisam estar
   revisados e aprovados.
2. Rascunhos devem permanecer fora do GitHub.
3. Imagens precisam ter autorização de uso e já estar otimizadas.
4. Nunca inclua dados jurídicos, pessoais ou institucionais não confirmados.

## Criar uma publicação

1. Copie `_publicacoes/_modelo.md`.
2. Crie ou escolha a pasta do ano da publicação, como `_publicacoes/2026/`.
3. Salve a cópia com um nome curto em minúsculas e separado por hífens:
   `protecao-de-dados-no-trabalho.md`.
4. Preencha os campos entre os dois blocos `---`.
5. Escreva o título com um único `#`.
6. Use `##` e `###` nas seções do texto.
7. Faça o commit na `main` e acompanhe o workflow
   **Validar e publicar GitHub Pages**.

A URL do exemplo será:

```text
https://rosaechaia.adv.br/publicacoes/protecao-de-dados-no-trabalho/
```

O ano organiza os arquivos, mas não aparece na URL. Não renomeie o arquivo
depois da primeira publicação.

## Campos

```yaml
date: 2026-07-26
updated_at:
authors:
  - gabriela-chaia
categories:
  - Proteção de Dados
tags:
  - LGPD
summary:
image:
image_alt:
```

- `date`: obrigatória, no formato `AAAA-MM-DD`, sem data futura. O ano precisa
  coincidir com a pasta.
- `updated_at`: opcional. Use quando houver uma revisão relevante e nunca uma
  data anterior à publicação.
- `authors`: uma ou mais opções entre `gabriela-chaia`, `giane-rosa` e
  `rosa-e-chaia`.
- `categories`: pelo menos uma categoria. São aceitas múltiplas categorias.
- `tags`: opcionais e livres.
- `summary`: opcional. Sem ele, o primeiro parágrafo vira o resumo sem
  reescrita por inteligência artificial.
- `image` e `image_alt`: opcionais, mas precisam ser preenchidos juntos.

Categorias e tags devem manter sempre a mesma grafia. Por exemplo, não alterne
entre `Proteção de Dados`, `proteção de dados` e `Protecao de Dados`.

## Imagens

Use somente WebP, JPEG ou PNG dentro de:

```text
assets/img/publicacoes/<slug>/
```

Exemplo:

```yaml
image: /assets/img/publicacoes/protecao-de-dados-no-trabalho/capa.webp
image_alt: Mesa de trabalho com documentos e computador.
```

O processo não redimensiona nem converte imagens. Envie arquivos já otimizados.
Toda imagem no corpo do Markdown também precisa estar na pasta da publicação e
ter texto alternativo:

```md
![Descrição objetiva da imagem.](/assets/img/publicacoes/protecao-de-dados-no-trabalho/exemplo.webp)
```

## Markdown aceito

São aceitos parágrafos, títulos a partir de `##`, listas, links, tabelas,
citações, negrito, itálico, separadores, blocos de código e imagens. HTML cru,
scripts, imagens remotas e links com protocolos inseguros são recusados.

## Atualizar ou remover

- Para atualizar, edite o mesmo arquivo e preencha `updated_at` quando a revisão
  for relevante.
- Nunca renomeie uma publicação já divulgada.
- Excluir o arquivo remove a página, a entrada da listagem e o sitemap no
  próximo deploy, sem criar redirecionamento.

## Se o workflow falhar

Abra a execução com erro e leia a mensagem da etapa de validação. Corrija o
Markdown e faça outro commit. Enquanto houver erro, a versão anterior do site
continua publicada.

## Checklist final

- conteúdo e dados confirmados;
- caráter informativo, sem promessa de resultado;
- data e pasta anual coerentes;
- autorias válidas;
- pelo menos uma categoria;
- um único título com `#`;
- links revisados;
- imagens autorizadas, locais, otimizadas e com texto alternativo;
- ortografia e consistência revisadas.
