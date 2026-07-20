# 03. Arquitetura técnica

## Stack

- HTML5 semântico;
- CSS customizado;
- JavaScript nativo;
- Bootstrap compilado e armazenado no repositório;
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
- links externos devem usar atributos de segurança adequados quando abrirem nova aba.
