# Fluência 15+15

App de inglês para quem está no **intermediário (B1)** e quer chegar ao **B2/C1** estudando **15 minutos de manhã e 15 à noite**.

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

Extras: sequência de dias com proteção, XP e níveis, calendário de constância, pares mínimos de pronúncia, ditado e fala livres, lista de palavras com as suas próprias.

**Conteúdo:** 217 palavras e expressões (phrasal verbs, collocations, falsos cognatos, idioms, conectores), 21 aulas de gramática focadas nos erros típicos de brasileiros, 81 frases de ditado em 3 níveis, 50 temas de fala, 60 temas de escrita para o diário e 10 diálogos com roteiro (46 falas) que funcionam sem IA.

## Versões

- `index.html` — PWA (celular/navegador). Instalável, funciona offline, microfone com transcrição no Chrome/Edge. Progresso salvo no navegador (use *Progresso → Backup* para mover entre aparelhos).
- `fluencia.html` — fonte do app; também publicada como artefato no Claude, onde ganha correção de textos e conversa com IA e salva o progresso na conta.

## Desenvolvimento

Edite `fluencia.html` e rode:

```bash
node build.js
```

Isso regenera `index.html` com o manifest e o service worker. Palavras novas devem ser adicionadas **no fim** da lista `VOCAB` para não alterar os ids do progresso salvo. Ao publicar mudanças, suba o número de `CACHE` em `sw.js`.
