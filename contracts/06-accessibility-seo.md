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
- URL canônica absoluta e autorreferente no domínio `https://rosaechaia.adv.br/`;
- um `<h1>` principal;
- Open Graph e Twitter Cards;
- conteúdo textual rastreável;
- links internos coerentes.

### Domínio e indexação

- o domínio canônico confirmado é `https://rosaechaia.adv.br/`, sem `www` e com barra final nas rotas;
- páginas institucionais com conteúdo aprovado devem usar `index, follow, max-image-preview:large`;
- `publicacoes/` deve usar `noindex, follow` enquanto contiver apenas o aviso de conteúdo em preparação;
- remover o `noindex` de `publicacoes/` assim que a primeira publicação aprovada for disponibilizada;
- incluir `og:site_name` de forma consistente nas páginas públicas;
- manter `publicacoes/` fora do sitemap enquanto estiver em `noindex`;
- URLs inexistentes devem retornar a página `404.html` com status HTTP 404 e `noindex, follow`;
- não criar redirecionamentos para URLs descartadas do site anterior.

## Arquivos de SEO

Manter na raiz:

```text
robots.txt
sitemap.xml
404.html
CNAME
```

Os favicons e o manifest ficam em `assets/img/favicon/`. A imagem social
compartilhada fica em `assets/img/social/rosa-e-chaia-social-1200x630.png`.
