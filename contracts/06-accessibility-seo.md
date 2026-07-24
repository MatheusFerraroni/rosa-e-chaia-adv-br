# 06. Acessibilidade e SEO

## Acessibilidade mínima

- HTML semântico;
- navegação por teclado;
- foco visível;
- textos alternativos adequados;
- rótulos em controles;
- contraste suficiente;
- hierarquia correta de títulos;
- idioma `pt-BR`;
- respeito a preferências de redução de movimento;
- conteúdo utilizável em dispositivos móveis.

## SEO mínimo

Cada página deve ter:

- `<title>` exclusivo;
- `meta description` exclusiva;
- URL canônica após confirmação do domínio;
- um `<h1>` principal;
- Open Graph básico;
- conteúdo textual rastreável;
- links internos coerentes.

### Indexação antes da confirmação do domínio

- páginas institucionais com conteúdo aprovado devem usar `index, follow, max-image-preview:large`;
- `publicacoes/` deve usar `noindex, follow` enquanto contiver apenas o aviso de conteúdo em preparação;
- remover o `noindex` de `publicacoes/` assim que a primeira publicação aprovada for disponibilizada;
- incluir `og:site_name` de forma consistente nas páginas públicas;
- não publicar URL canônica, sitemap ou dados estruturados dependentes de URL antes da confirmação do domínio definitivo.

## Arquivos posteriores

Após confirmar domínio e rotas, criar:

```text
robots.txt
sitemap.xml
favicon.ico
site.webmanifest
```

Não publicar URLs provisórias como canônicas.
