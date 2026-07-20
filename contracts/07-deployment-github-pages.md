# 07. Publicação no GitHub Pages

## Hospedagem

O site deve ser compatível com GitHub Pages e domínio próprio.

## Estratégia inicial

- publicar arquivos estáticos diretamente;
- manter `.nojekyll` na raiz;
- usar a raiz do branch de publicação como raiz do site;
- evitar etapa de build enquanto não houver necessidade aprovada.

## Domínio próprio

1. confirmar o domínio final;
2. copiar `CNAME.example` para `CNAME`;
3. substituir o exemplo por um único domínio válido;
4. configurar os registros DNS;
5. ativar HTTPS no GitHub Pages;
6. validar redirecionamento e URLs canônicas.

Nunca publicar `CNAME` com domínio de exemplo.

## Validação antes de publicar

- abrir todas as rotas;
- validar recursos CSS, JavaScript, imagens e fontes;
- testar navegação em mobile;
- confirmar ausência de CDN;
- confirmar ausência de segredos;
- revisar dados institucionais;
- confirmar HTTPS e domínio.
