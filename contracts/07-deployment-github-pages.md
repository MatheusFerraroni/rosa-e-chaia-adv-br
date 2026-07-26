# 07. Publicação no GitHub Pages

## Hospedagem

O site deve ser compatível com GitHub Pages e domínio próprio.

## Estratégia

- validar e gerar o site com Node.js em GitHub Actions;
- publicar no GitHub Pages somente o artefato estático `dist/`;
- manter `.nojekyll` e `CNAME` no artefato;
- disparar o fluxo em commits na `main` e manualmente quando necessário;
- impedir o deploy quando validações, testes, build ou inspeção do artefato
  falharem;
- manter a última versão válida publicada quando um novo build falhar;
- não versionar `dist/` nem arquivos gerados.

## Domínio próprio

O domínio final confirmado é `rosaechaia.adv.br`.

1. manter `CNAME` na raiz contendo apenas `rosaechaia.adv.br`;
2. configurar o domínio personalizado no GitHub Pages;
3. configurar os registros DNS do domínio raiz e de `www`;
4. preservar os registros de e-mail existentes;
5. ativar HTTPS no GitHub Pages;
6. validar que HTTP e `www` redirecionam diretamente para `https://rosaechaia.adv.br/`;
7. validar as URLs canônicas, o sitemap, o robots e a resposta 404.

## Validação antes de publicar

- abrir todas as rotas;
- validar recursos CSS, JavaScript, imagens e fontes;
- testar navegação em mobile;
- confirmar ausência de CDN;
- confirmar ausência de segredos;
- revisar dados institucionais;
- confirmar HTTPS e domínio.
- confirmar que manual, modelo, contratos, scripts, dependências e fontes
  editoriais não foram incluídos no artefato;
- confirmar geração do índice, páginas individuais e sitemap;
- confirmar que a configuração de Pages usa GitHub Actions como fonte.
