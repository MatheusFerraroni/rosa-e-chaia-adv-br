# 03. Arquitetura técnica

## Stack

- HTML5 semântico;
- CSS customizado;
- JavaScript nativo;
- Bootstrap compilado e armazenado no repositório;
- gerador estático pequeno em Node.js;
- GitHub Pages.

## Bootstrap local

Arquivos esperados:

```text
assets/vendor/bootstrap/css/bootstrap.min.css
assets/vendor/bootstrap/js/bootstrap.bundle.min.js
```

Regras:

- CDN é proibido;
- preservar avisos de licença;
- carregar `bootstrap.min.css` antes de `assets/css/theme.css`;
- carregar `bootstrap.bundle.min.js` no fim do `<body>` ou com `defer`;
- não editar diretamente os arquivos minificados do Bootstrap;
- sobrescrever estilos apenas em arquivos próprios.

A proibição de CDN continua válida para os recursos do site. A única exceção
externa aprovada é o carregamento consentido de
`https://www.googletagmanager.com/gtag/js?id=G-5LQ01Z477N`.

## CSS

Arquivo inicial:

```text
assets/css/theme.css
```

Evolução permitida quando necessária:

```text
assets/css/
├── tokens.css
├── base.css
├── components.css
├── pages.css
└── utilities.css
```

## JavaScript

- usar apenas quando houver necessidade funcional;
- manter scripts em `assets/js/`;
- evitar dependências extras;
- não bloquear a renderização;
- não gerar erros no console.

O JavaScript de publicações aprimora progressivamente uma listagem já presente
no HTML. Sem JavaScript, os cards e links individuais continuam disponíveis.

## Analytics e consentimento

- cada HTML carrega um único controlador local em
  `/assets/js/analytics-consent.js`;
- o controlador define o consentimento de Analytics como negado por padrão e
  não solicita o script do Google antes da aceitação;
- `ad_storage`, `ad_user_data` e `ad_personalization` permanecem negados;
- a preferência usa a chave versionada
  `rosa-e-chaia:analytics-consent:v1` no armazenamento local;
- a configuração usa `send_page_view: false` e envia um `page_view` manual,
  removendo o parâmetro livre `q` da localização;
- cliques de contato usam apenas `contact_channel`, `contact_target` e
  `contact_placement`, com valores fechados e sem destino bruto;
- revogar a autorização impede novo carregamento e remove cookies `_ga*`
  acessíveis pela origem antes de recarregar a página.

## Geração estática

- o gerador lê `_publicacoes/<ano>/<slug>.md`;
- o Markdown usa GitHub Flavored Markdown com HTML cru desabilitado;
- dependências Node são usadas apenas em validação e build;
- o artefato final fica em `dist/` e não é versionado;
- somente arquivos públicos são copiados para o artefato;
- páginas individuais, `index.json` e sitemap são gerados no build;
- falhas de validação impedem o novo deploy;
- nenhuma conversão ou otimização automática de imagens é realizada.

O índice público fica em `/assets/data/publicacoes/index.json` e contém
`schemaVersion`, data de geração, facetas e itens com URL, datas, título,
resumo, autorias, categorias, tags e imagem opcional. O template das páginas
individuais usa marcadores substituídos pelo gerador, sem executar HTML vindo
do Markdown.

## Caminhos

Preferir caminhos absolutos a partir da raiz do domínio, como:

```text
/assets/css/theme.css
/areas-de-atuacao/
```

Antes da publicação, validar o comportamento escolhido na configuração real do GitHub Pages.

## Segurança

- nunca incluir tokens, senhas ou chaves privadas;
- não expor dados pessoais sem autorização;
- não inserir scripts de terceiros sem aprovação;
- limitar a exceção do Analytics ao identificador, finalidade e consentimento
  definidos neste contrato;
- links externos devem usar atributos de segurança adequados quando abrirem nova aba.
