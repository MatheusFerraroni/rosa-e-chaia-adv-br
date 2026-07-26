# 01. Escopo inicial

## Entregas previstas

O primeiro ciclo de implementação deve contemplar:

- página inicial;
- página sobre o escritório;
- página de áreas de atuação;
- página de profissionais;
- página de publicações;
- publicações individuais geradas a partir de Markdown;
- busca, filtros, ordenação e paginação na página de publicações;
- página de contato;
- botão flutuante de WhatsApp com seleção dos contatos aprovados, exceto na página de contato;
- rodapé com informações institucionais aprovadas;
- navegação responsiva;
- metadados básicos de SEO;
- configuração para GitHub Pages e domínio próprio.

## Conteúdo provisório

Conteúdo não confirmado deve aparecer como marcador explícito, por exemplo:

- `[NOME DO PROFISSIONAL]`;
- `[NÚMERO DA OAB]`;
- `[ENDEREÇO]`;
- `[TELEFONE]`;
- `[E-MAIL]`;
- `[DOMÍNIO]`.

O Codex não deve transformar marcadores em dados inventados.

## Não fazer sem aprovação

- incluir notícias, comentários, RSS, agendamento, painel editorial ou
  publicações fora do fluxo Markdown aprovado;
- adicionar integrações externas;
- instalar frameworks adicionais;
- criar sistema de coleta de leads;
- adicionar cookies de marketing;
- criar animações complexas;
- alterar a estrutura de hospedagem.

## Publicações em Markdown

- os arquivos editoriais ficam em `_publicacoes/<ano>/<slug>.md`;
- cada arquivo válido gera uma página em `/publicacoes/<slug>/`;
- `_publicacoes/README.md` e `_publicacoes/_modelo.md` são documentação e não
  geram páginas;
- a página `/publicacoes/` usa um índice JSON gerado no build para busca,
  filtros, ordenação e paginação;
- o site continua estático no navegador, sem servidor de aplicação ou banco de
  dados.
