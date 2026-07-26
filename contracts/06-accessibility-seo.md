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
- páginas individuais de publicações aprovadas devem usar
  `index, follow, max-image-preview:large`;
- incluir `og:site_name` de forma consistente nas páginas públicas;
- manter `publicacoes/` fora do sitemap enquanto estiver em `noindex`;
- incluir automaticamente a listagem e cada publicação aprovada no sitemap;
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

## Dados estruturados

- a página inicial deve conter um único bloco JSON-LD com um grafo `WebSite` e `LegalService`;
- `WebSite` deve identificar o nome, o domínio canônico, o idioma e o escritório responsável;
- `LegalService` deve usar apenas nome, contato, endereço, mapa, redes sociais e imagens já publicados na página;
- o telefone principal da entidade é o número aprovado do escritório;
- não incluir avaliações, notas, horários, abrangência, modalidades de atendimento, pessoas, coordenadas, preço, razão social ou registro enquanto esses campos não fizerem parte do escopo visível aprovado;
- não repetir o grafo institucional nas páginas internas nesta etapa.

Cada publicação individual deve conter um bloco JSON-LD `Article`, sem repetir
o grafo institucional, usando somente título, URL, resumo, datas, autorias,
categorias, tags e imagem já aprovados para a própria página.

## Busca e paginação de publicações

- a listagem deve permanecer utilizável sem JavaScript;
- os controles precisam de rótulos, foco visível e resultado anunciado de
  forma acessível;
- parâmetros de busca, filtros, ordenação e paginação mantêm canonical em
  `https://rosaechaia.adv.br/publicacoes/`;
- a busca local usa título, resumo, autorias, categorias e tags, sem indexar o
  corpo integral na primeira versão.

## Links internos contextuais

- a página inicial deve ligar o texto introdutório às páginas de escritório, áreas de atuação, profissionais e contato;
- a página de escritório deve ligar os nomes das fundadoras aos respectivos fragmentos da página de profissionais e as áreas jurídicas aos respectivos fragmentos da página de áreas de atuação;
- a página de áreas de atuação deve ligar seu texto final às páginas de profissionais, parceiros e contato;
- os links contextuais devem abrir na mesma aba, usar textos descritivos e não substituir a navegação principal;
- a página de contato e a página de publicações não recebem links contextuais adicionais nesta etapa.
