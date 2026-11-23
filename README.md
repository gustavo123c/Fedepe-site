# Copa FEDEPE de Egames

Site da Copa FEDEPE de Egames (Federação do Desporto Escolar de Pernambuco) — Temporada 2026.
HTML, CSS e JavaScript puros, sem etapa de build. Tudo funciona com um **banco de dados mockado** salvo no `localStorage` do navegador.

## Como rodar

Abra `Fedepe-HTML/index.html` no navegador, ou sirva a pasta (recomendado):

```bash
cd Fedepe-HTML
python3 -m http.server 8000
# acesse http://localhost:8000
```

## Acessos de teste

Na tela de login há botões de **acesso rápido**:

| Perfil | Nome | RA/Matrícula | Senha |
|---|---|---|---|
| Aluno demo (17 anos, sem equipe e sem autorização) | Gabriel Silva | `2026001` | `demo1234` |
| Administrador | Coordenação FEDEPE | `ADMIN` | `Fedepe2026` |

Os demais alunos fictícios usam a senha `demo1234`. O botão **“Resetar dados demo”** no rodapé restaura o estado inicial.

## Páginas

| Página | Arquivo | O que faz |
|---|---|---|
| Início | `index.html` | Hero, 5 modalidades clicáveis (filtram os campeonatos), próximos campeonatos e a transmissão oficial definida pelo ADM |
| Campeonatos | `campeonatos.html` | Filtros combináveis por jogo e status (também via URL: `?jogo=valorant&status=aberta`) |
| Detalhes / inscrição | `inscricao.html?id=...` | Informações, regras, chaveamento e **Confirmar inscrição** com regras de negócio |
| Transmissões | `transmissoes.html` | Player principal com a transmissão do ADM (YouTube/Twitch), filtro por jogo e partidas gravadas |
| Ranking | `ranking.html` | Pódio, filtro por modalidade (inclui Free Fire, com abates e Booyahs) e tabela com busca |
| Login / Cadastro | `login.html`, `cadastro.html` | Abas Entrar/Criar conta; cadastro com data de nascimento (idade calculada, faixa de 10 a 25 anos) e as etapas de autorização dos pais e da escola |
| Meu perfil | `perfil.html` | Estatísticas, idade, editar perfil, status das duas autorizações, inscrições e criação/edição da equipe |
| Painel ADM | `admin.html` | Aba **Validação de cadastros** (idade, faixa etária, comprovantes dos pais e da escola, Aprovado/Reprovado) e aba **Gerenciar transmissão** |

## Modalidades

Valorant, League of Legends, Fortnite, Counter-Strike 2 e **Free Fire**. Os jogos ficam em `Api.JOGOS` (`js/services/mockApi.js`): os filtros de campeonatos, transmissões e ranking são gerados a partir dessa lista. O ícone e o banner do Free Fire (`img/freefire.png`, `img/banner-freefire.jpg`) são ilustrações próprias, não o logo oficial do jogo.

## Regras de negócio da inscrição

Ao clicar em **Confirmar inscrição** o sistema verifica, nesta ordem: login → inscrições abertas e dentro do prazo → não inscrito ainda → cadastro não reprovado → equipe (em campeonatos por equipe, apenas o capitão inscreve) → **autorização dos pais/responsáveis** (menores de 18 anos) → **autorização da escola** (todos os alunos) → vagas.
Se faltar uma autorização, ela abre na hora; ao concluir, a inscrição continua sozinha (e abre a próxima etapa, se faltar).

## Autorizações (2 etapas)

Componente reutilizável em `js/ui/parental-auth.js` (`ParentalAuth.montar/abrir` com `tipo: 'pais' | 'escola'`), usado no cadastro, no perfil e na inscrição.

| Etapa | Quem precisa | Dados | Formas de validar |
|---|---|---|---|
| 1. Pais/Responsáveis | Menores de 18 anos | Nome, CPF (máscara + validação), parentesco, e-mail, WhatsApp opcional | Assinatura no `<canvas>` ou e-mail simulado com o botão “Autorizar Participação” |
| 2. Escola (vínculo institucional) | Todos os alunos | Nome da escola, diretor(a)/coordenador(a) esportivo(a), e-mail institucional, matrícula/RA | Assinatura do responsável escolar no `<canvas>` ou e-mail simulado com o botão “Confirmar Vínculo Escolar do Estudante” |

A assinatura é salva em Base64 com data e hora. O perfil mostra o status de cada etapa e o Painel ADM mostra os dois comprovantes (assinatura ou log do e-mail) antes de Aprovado/Reprovado. As mudanças aparecem em tempo real entre abas.

## Equipe

No perfil, o capitão cria a equipe e depois pode **editá-la**: o formulário vem preenchido com o nome e os participantes salvos, dá para renomear, editar, adicionar e remover membros (o capitão fica travado) e salvar com **“Salvar alterações da equipe”**.

## Transmissão oficial (ADM)

Em **Painel ADM → Gerenciar transmissão**, o administrador informa URL, título da partida, modalidade e status (Ao Vivo/Gravado). O link é convertido para embed por `Api.paraEmbed()`:

- YouTube: `youtube.com/watch?v=…`, `youtu.be/…`, `youtube.com/live/…`, `/shorts/…` (respeita `?t=`)
- Twitch: `twitch.tv/canal`, `twitch.tv/videos/…`, `clips.twitch.tv/…`

O player `<iframe>` passa a aparecer na página inicial e em Transmissões (inclusive em abas já abertas). A Twitch exige que o site rode em um domínio ou em `localhost`; abrindo o HTML direto do arquivo, use YouTube.

## Estrutura

```
Fedepe-HTML/
├── js/
│   ├── mock/database.js      # seed: escolas, alunos, equipes, campeonatos, chaveamentos, transmissões, autorizações (pais e escola)
│   ├── services/mockApi.js   # "backend": localStorage, latência simulada, regras de negócio, eventos de mudança
│   └── ui/
│       ├── layout.js         # cabeçalho, rodapé, modal, toast e utilitários
│       └── parental-auth.js  # autorizações dos pais e da escola (canvas + e-mail simulado)
├── img/                      # brasão da FEDEPE, ícones e banners dos jogos
├── style.css                 # tema escuro com as cores da FEDEPE (responsivo)
└── *.html
```

### Trocando o mock por um backend real (ex.: Back4App)

Todas as páginas falam somente com `window.Api` (`js/services/mockApi.js`). Para usar um banco real, reimplemente essas funções com `fetch()` mantendo os mesmos retornos (`{ ok: true, ... }` ou `{ ok: false, erro, motivo }`). As páginas não precisam mudar.

> O hash de senha no mock serve apenas para demonstração. Em produção, a autenticação e o hash (bcrypt/argon2) devem ficar no servidor.

## Próximos passos

- Backend real (Back4App) no lugar do `mockApi.js`
- Envio real de e-mails de autorização (link com token) para responsáveis e escolas
- Edição de campeonatos e chaveamentos pelo Painel ADM
