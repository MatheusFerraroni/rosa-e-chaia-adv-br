# 04. Sistema visual

## Paleta obrigatória

| Token | Cor | Uso inicial |
|---|---:|---|
| `--color-primary` | `#4C0E1E` | marca, títulos, ações principais |
| `--color-secondary` | `#C9B8A1` | detalhes, fundos suaves, divisores |
| `--color-surface` | `#EEEBE6` | superfícies e seções alternadas |
| `--color-white` | `#FFFFFF` | fundos e contraste |

## Direção visual

- institucional;
- sóbria;
- elegante;
- legível;
- sem excesso de efeitos;
- responsiva;
- apropriada a um escritório de advocacia.

## Regras

- Bootstrap fornece estrutura e componentes básicos;
- os estilos próprios definem a identidade visual;
- não alterar a paleta sem aprovação;
- não usar gradientes, sombras fortes ou cores adicionais como destaque sem aprovação;
- garantir contraste suficiente entre texto e fundo;
- usar espaçamento consistente;
- evitar animações que prejudiquem leitura ou navegação.

## Publicações

- os controles de busca e filtros devem usar composição compacta;
- busca e ano compartilham a primeira linha quando houver largura suficiente;
- a quantidade de resultados é anunciada para tecnologias assistivas, sem
  ocupar espaço visual permanente;
- cada card usa contorno completo e destaque lateral;
- categorias e tags aparecem como links textuais separados por vírgulas, sem
  aparência de botões.

## Profissionais

- cards exibidos na mesma linha devem ter a mesma altura;
- foto e identificação ficam lado a lado somente enquanto houver largura
  suficiente para o nome;
- em larguras intermediárias, a identificação passa para baixo da foto para
  evitar estouro horizontal.

## Leitura em telas pequenas

- até `767.98px`, textos corridos usam alinhamento à esquerda e não aplicam
  hifenização automática;
- palavras e endereços longos podem quebrar para impedir estouro horizontal;
- a composição de telas maiores pode preservar o alinhamento justificado.

## Privacidade

- o aviso de consentimento usa apenas a paleta obrigatória e permanece legível
  sobre o conteúdo;
- aceitar e recusar ficam visíveis com peso equivalente e foco identificável;
- o aviso não bloqueia a navegação nem se sobrepõe ao botão de WhatsApp;
- política e preferências permanecem disponíveis no rodapé;
- em telas pequenas, texto e ações passam para uma composição vertical.

## WhatsApp flutuante

- o botão permanece flutuante durante a navegação e se ancora acima do rodapé
  sem saltos visuais;
- o conteúdo final e os controles focáveis devem continuar alcançáveis em telas
  pequenas;
- o menu aberto deve permanecer contido na área visível e permitir rolagem
  interna quando necessário.

## Tipografia

A família tipográfica ainda precisa de aprovação.

Até a definição final:

- usar pilhas de fontes do sistema;
- não buscar fontes em serviços externos;
- arquivos de fontes aprovados devem ficar em `assets/fonts/`;
- registrar licença e origem das fontes locais.
