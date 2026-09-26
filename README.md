# Fluência 15+15

App de inglês **do iniciante (A1) ao avançado (B2)**, estudando **15 minutos de manhã e 15 à noite**. Você escolhe seu nível (ou faz o teste) e o conteúdo se adapta.

**Abrir no celular:** https://luizneogrid-commits.github.io/AppIngles/
→ no Android (Chrome): menu ⋮ → *Instalar app* / *Adicionar à tela inicial*
→ no iPhone (Safari): Compartilhar → *Adicionar à Tela de Início*

## Como funciona

| Sessão | Bloco (5 min cada) | Inspirado em |
|---|---|---|
| **Manhã: Ouvir & Falar** | Revisão espaçada (SRS) | Anki, Duolingo |
| | Ditado + shadowing | Elsa Speak |
| | Fala guiada (técnica 4/3/2) | Speak, Cambly |
| **Noite: Aprender & Escrever** | Palavras novas + mini-quiz | Memrise |
| | Micro-aula de gramática | Babbel |
| | Diário em inglês | Busuu |

Extras:
- **Sessão expressa de 5 min** para dias corridos (mantém a sequência)
- **Diálogos com roteiro** (sem IA, offline) e **conversa livre com IA** (no Claude)
- **Meus erros**: questões e falas erradas voltam até você acertar 2× seguidas
- **Palavras difíceis** (esquecidas 3+ vezes) com treino separado; sua frase pessoal aparece no cartão
- **Ditado** que aceita contrações, com dica de primeiras letras e áudio por palavra
- **Gravar e ouvir a própria voz** na fala guiada e no shadowing (no app do celular)
- Sequência com proteção, XP, níveis, **16 conquistas**, resumo semanal com minutos estudados e alerta de sequência em risco
- **Lembretes no calendário** (.ics), backup em arquivo, tema claro/escuro e texto grande
- Tela de boas-vindas com **5 níveis** (A1 a B2), sotaque e horários; **teste de nível** mensal com histórico
- **Leituras graduadas** com tradução ao toque, **Ouça e entenda** (vocabulário só de ouvido) e **checagem de pronúncia** por reconhecimento de fala
- Revisão com **desfazer**, correção tolerante a erros de digitação, **previsão de 7 dias** e limite automático de palavras novas quando há acúmulo
- **Já conheço** para pular palavras, detalhe editável de cada palavra, **gramática com revisão espaçada** (2, 7, 21, 60 dias)
- Análise **Onde focar agora**, recapitulação do dia, correções da IA no deck de erros e **falar a resposta** nos diálogos
- Sessões de **10, 15 ou 20 min**, **Inglês no mundo real** (recursos gratuitos por nível), lembrete de backup, exportação do diário e **atalhos de teclado** (tecla ?)
- **Monte a frase** (ordem das palavras), **missões do dia** com baú de XP, **loja** (troque XP por proteção de sequência) e **palavra do dia**
- Importação de listas de palavras, **exemplos e leituras gerados por IA** no seu nível (no Claude), bônus intercalado com seus erros na revisão da manhã, explicação da regra dentro do exercício e guia **Como usar o app**
- **Pronúncia para brasileiros** (-ed, sílaba tônica, letras mudas), **frases prontas** por situação, **Pergunta rápida** (fluência) e **modo sem áudio** com ditado visual
- Gráfico de XP de 30 dias, confirmação ao sair da sessão, sinal no fim do bloco, **exportação para o Anki**, sincronização ao vivo entre aparelhos (no Claude) e proteção contra dados corrompidos
- Aba Praticar organizada por seções, tela Hoje com avisos por prioridade, **busca global** (tecla /) e cores com contraste WCAG AA
- **Modo férias** (sequência protegida e revisões distribuídas na volta), **retenção real** medida, frases do ditado com erro voltam depois, filtros na lista de palavras e tela de **Novidades** após atualizações
- Diagnóstico de voz em inglês, acessibilidade para leitores de tela e **imagem de progresso** para compartilhar

**Conteúdo:** 376 palavras e expressões (159 básicas), 38 aulas de gramática (17 para iniciantes), 156 frases de ditado em 4 níveis, 62 temas de fala, 72 temas de escrita, 23 diálogos com roteiro, 18 leituras graduadas, 74 frases prontas em 10 situações e 3 lições de pronúncia.

## Base científica

O app aplica técnicas da ciência da aprendizagem, 21 técnicas, cada uma documentada no app em **Praticar → A ciência por trás**, com a força da evidência e as referências:

- **Prática de recuperação** e **repetição espaçada** com o agendador **FSRS-4.5** (o mesmo do Anki desde 2023), retenção desejada ajustável
- **Pré-teste** (palpite pelo contexto antes de ver o significado) e **efeito de geração** (sua própria frase)
- **Intercalação**: prática mista de gramática a cada 3 dias
- **Confiança antes do feedback** e **hipercorreção**, com cartão de calibração
- **Variabilidade de contexto** (a palavra em outras frases) e **âncoras de memória** para palavras-problema
- **Gramática item a item na revisão espaçada**, **reaprendizagem sucessiva** e **autoexplicação** ao errar
- **Recordação com pista** (digitar em vez de escolher), **recordação livre** na leitura e **revisão antes de dormir**
- **Repetição de tarefa** na fala (temas voltam em 2 e 7 dias) e **meta semanal** com acompanhamento e reflexão
- **Sono e consolidação**, **feedback corretivo**, **4/3/2** para fluência, **shadowing** e **intenções de implementação** (“depois de X, eu estudo”)

## Versões

- `index.html` — PWA (celular/navegador). Instalável, funciona offline, microfone com transcrição no Chrome/Edge. Progresso salvo no navegador (use *Progresso → Backup* para mover entre aparelhos).
- `fluencia.html` — fonte do app; também publicada como artefato no Claude, onde ganha correção de textos e conversa com IA e salva o progresso na conta.

## Desenvolvimento

Edite `fluencia.html` e rode:

```bash
node build.js
```

Isso regenera `index.html` com o manifest e o service worker. Palavras novas devem ser adicionadas **no fim** da lista `VOCAB` para não alterar os ids do progresso salvo. Ao publicar mudanças, suba o número de `CACHE` em `sw.js`.
