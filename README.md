<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=200&color=0:163574,100:2F5BB5&text=Copa%20FEDEPE%20de%20Egames&fontColor=ffffff&fontSize=40&fontAlignY=36&desc=Temporada%202026%20%C2%B7%20Federa%C3%A7%C3%A3o%20do%20Desporto%20Escolar%20de%20Pernambuco&descAlignY=58&descSize=15" width="100%" alt="Copa FEDEPE de Egames" />

<img src="Fedepe-HTML/img/logo-fedepe.png" width="110" alt="Brasão da FEDEPE" />

<p>
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/sem%20build-vanilla-1E4594?style=flat-square" alt="Sem build" />
  <img src="https://img.shields.io/badge/dados-localStorage%20(mock)-6882B7?style=flat-square" alt="Banco mockado" />
  <img src="https://img.shields.io/badge/YouTube%20%7C%20Twitch-embed-E8B030?style=flat-square" alt="Embeds YouTube e Twitch" />
</p>

**Plataforma de campeonatos escolares de eSports: inscrição de equipes, autorizações, chaveamento, ranking e transmissões ao vivo.**

[Funcionalidades](#-funcionalidades) · [Como rodar](#-como-rodar) · [Acessos de teste](#-acessos-de-teste) · [Arquitetura](#-arquitetura) · [Estrutura](#-estrutura-de-pastas) · [Equipe](#-equipe)

</div>

---

## 📌 Sobre

Site da **Copa FEDEPE de Egames** (Federação do Desporto Escolar de Pernambuco), temporada 2026. O sistema cobre o ciclo completo de um campeonato escolar: o aluno se cadastra, monta a equipe, obtém as autorizações dos pais e da escola, se inscreve e acompanha chaveamento, ranking e transmissões. A coordenação valida os cadastros e controla as lives pelo **Painel ADM**.

Tudo é feito com **HTML, CSS e JavaScript puros, sem etapa de build**. Os dados ficam em um **banco mockado** no `localStorage` do navegador, com uma camada de API (`window.Api`) que imita um backend real: funções assíncronas, latência simulada e retornos padronizados.

**Modalidades:** Valorant · League of Legends · Fortnite · Counter-Strike 2 · Free Fire

## ✨ Funcionalidades

- 🏆 **Campeonatos** com filtros combináveis por jogo e status (também via URL: `?jogo=valorant&status=aberta`)
- 📝 **Inscrição com regras de negócio** verificadas em ordem: login → prazo → duplicidade → cadastro → capitão → tamanho da equipe → autorizações → vagas
- ✍️ **Autorizações em 2 etapas** (pais/responsáveis e escola) com **assinatura digital em `<canvas>`** ou confirmação por e-mail simulado
- 👥 **Equipes** criadas e editadas pelo capitão, com tamanho mínimo e máximo por campeonato
- 🗓️ **Chaveamento dinâmico e calendário**, com a 1ª fase preenchida pelas equipes inscritas e datas em cada fase
- 📊 **Ranking** com pódio, filtro por modalidade e busca
- 📺 **Transmissões**: links do YouTube/Twitch convertidos em embed, partidas gravadas e atualização em tempo real entre abas
- 🛡️ **Painel ADM**: validação de cadastros (idade, faixa etária, comprovantes) e gestão da transmissão oficial
- 📱 **Layout responsivo** com a paleta azul e branca da FEDEPE

## 🖼️ Preview

<!-- Substitua pelos prints reais (sugestão: salve em docs/screenshots/). -->
| Início | Campeonato / chaveamento | Painel ADM |
|---|---|---|
| _print da página inicial_ | _print de `inscricao.html`_ | _print de `admin.html`_ |

## 🚀 Como rodar

Não há dependências para instalar. Basta clonar e servir a pasta:

```bash
git clone https://github.com/gustavo123c/Fedepe-site.git
cd Fedepe-site/Fedepe-HTML
python3 -m http.server 8000
# acesse http://localhost:8000
```

> Também funciona abrindo `Fedepe-HTML/index.html` direto no navegador, mas aí os players do YouTube e da Twitch não tocam dentro da página (o YouTube recusa o player sem um endereço de site e a Twitch exige um domínio). Nesse caso o site mostra a miniatura com o botão “Assistir no YouTube/Twitch”.

### Publicar grátis no GitHub Pages

1. No GitHub, abra o repositório → **Settings** → **Pages**.
2. Em *Build and deployment*, escolha **Deploy from a branch**, branch **main** e pasta **/ (root)** → **Save**.
3. Em 1 a 2 minutos o site fica em `https://gustavo123c.github.io/Fedepe-site/` (o `index.html` da raiz redireciona para `Fedepe-HTML/`).

> Os dados ficam salvos no navegador de cada visitante (banco mockado), então cada pessoa vê a sua própria cópia da demonstração.

## 🔑 Acessos de teste

Na tela de login há botões de **acesso rápido**:

| Perfil | Nome | RA/Matrícula | Senha |
|---|---|---|---|
| Aluno demo (17 anos, sem equipe e sem autorização) | Gabriel Silva | `2026001` | `demo1234` |
| Administrador | Coordenação FEDEPE | `ADMIN` | `Fedepe2026` |

Os demais alunos fictícios usam a senha `demo1234`. O botão **“Resetar dados demo”** no rodapé restaura o estado inicial.

## 🧭 Páginas

| Página | Arquivo | O que faz |
|---|---|---|
| Início | `index.html` | Hero, 5 modalidades clicáveis (filtram os campeonatos), próximos campeonatos e a transmissão oficial definida pelo ADM |
| Campeonatos | `campeonatos.html` | Filtros combináveis por jogo e status |
| Detalhes / inscrição | `inscricao.html?id=...` | Informações, regras, chaveamento e **Confirmar inscrição** com regras de negócio |
| Transmissões | `transmissoes.html` | Player principal com a transmissão do ADM (YouTube/Twitch), filtro por jogo e partidas gravadas |
| Ranking | `ranking.html` | Pódio, filtro por modalidade (inclui Free Fire, com abates e Booyahs) e tabela com busca |
| Login / Cadastro | `login.html`, `cadastro.html` | Abas Entrar/Criar conta; cadastro com data de nascimento (idade calculada, faixa de 10 a 25 anos) e as etapas de autorização dos pais e da escola |
| Meu perfil | `perfil.html` | Estatísticas, idade, editar perfil, status das duas autorizações, inscrições e criação/edição da equipe |
| Painel ADM | `admin.html` | Aba **Validação de cadastros** (idade, faixa etária, comprovantes, Aprovado/Reprovado) e aba **Gerenciar transmissão** |

## 🏗️ Arquitetura

```
 Páginas HTML  ──►  js/ui/ (layout, autorizações)
      │
      ▼
 window.Api  (js/services/mockApi.js)
   ├─ regras de negócio, validações, latência simulada
   ├─ evento "fedepe:dados" → atualiza telas em tempo real (inclusive entre abas)
   └─ localStorage  ◄──  seed inicial (js/mock/database.js)
```

Todas as páginas falam **somente** com `window.Api`. Cada função devolve `{ ok: true, ... }` ou `{ ok: false, erro, motivo }`. Para trocar o mock por um backend real (ex.: Back4App), basta reimplementar essas funções com `fetch()` mantendo os mesmos retornos, sem mudar as páginas.

<details>
<summary><b>Regras de negócio da inscrição</b></summary>

Ao clicar em **Confirmar inscrição** o sistema verifica, nesta ordem: login → inscrições abertas e dentro do prazo → não inscrito ainda → cadastro não reprovado → equipe (em campeonatos por equipe, apenas o capitão inscreve) → **tamanho da equipe** exigido pelo campeonato → **autorização dos pais/responsáveis** (menores de 18 anos) → **autorização da escola** (todos os alunos) → vagas.
Se faltar uma autorização, ela abre na hora; ao concluir, a inscrição continua sozinha (e abre a próxima etapa, se faltar).

</details>

<details>
<summary><b>Campeonatos: equipes, chaveamento e calendário</b></summary>

- **Tamanho da equipe por campeonato** (`jogadores: { min, max }` em `js/mock/database.js`): Valorant, LoL e CS2 exigem 5 titulares (+1 reserva), Free Fire Squad 4 (+1), Valorant Duos 2 (+1). Se a equipe tiver menos ou mais jogadores, a inscrição é bloqueada com a explicação e um atalho para editar a equipe.
- **Inscrições dinâmicas:** as vagas contam as inscrições reais e a lista “Equipes inscritas” mostra todas, em ordem. Em campeonatos com inscrições abertas, a 1ª fase do chaveamento é preenchida com as equipes inscritas (mata-mata em pares ou grupos), com “Vaga aberta” no que falta. A sua equipe aparece marcada com ★.
- **Calendário:** cada fase tem data (e horário). A página do campeonato mostra a linha do tempo (inscrições → fases → final) e a data em cima de cada coluna do chaveamento.
- Os jogos ficam em `Api.JOGOS` (`js/services/mockApi.js`): os filtros de campeonatos, transmissões e ranking são gerados a partir dessa lista. O ícone e o banner do Free Fire são ilustrações próprias, não o logo oficial do jogo.

</details>

<details>
<summary><b>Autorizações (2 etapas)</b></summary>

Componente reutilizável em `js/ui/parental-auth.js` (`ParentalAuth.montar/abrir` com `tipo: 'pais' | 'escola'`), usado no cadastro, no perfil e na inscrição.

| Etapa | Quem precisa | Dados | Formas de validar |
|---|---|---|---|
| 1. Pais/Responsáveis | Menores de 18 anos | Nome, CPF (máscara + validação), parentesco, e-mail, WhatsApp opcional | Assinatura no `<canvas>` ou e-mail simulado com o botão “Autorizar Participação” |
| 2. Escola (vínculo institucional) | Todos os alunos | Nome da escola, diretor(a)/coordenador(a) esportivo(a), e-mail institucional, matrícula/RA | Assinatura do responsável escolar no `<canvas>` ou e-mail simulado com o botão “Confirmar Vínculo Escolar do Estudante” |

A assinatura é salva em Base64 com data e hora. O perfil mostra o status de cada etapa e o Painel ADM mostra os dois comprovantes (assinatura ou log do e-mail) antes de Aprovado/Reprovado.

</details>

<details>
<summary><b>Equipe e transmissões (ADM)</b></summary>

**Equipe:** no perfil, o capitão cria a equipe e depois pode editá-la: renomear, editar, adicionar e remover membros (o capitão fica travado) e salvar com **“Salvar alterações da equipe”**.

**Transmissões:** em **Painel ADM → Gerenciar transmissão**, o administrador informa URL, título da partida, modalidade e status (Ao Vivo/Gravado). O link é convertido para embed por `Api.paraEmbed()`:

- YouTube: `youtube.com/watch?v=…`, `youtu.be/…`, `youtube.com/live/…`, `/shorts/…` (respeita `?t=`)
- Twitch: `twitch.tv/canal`, `twitch.tv/videos/…`, `clips.twitch.tv/…`

O player aparece na página inicial e em Transmissões (inclusive em abas já abertas). A seção **Partidas gravadas** permite adicionar, editar e remover vídeos (URL, título, modalidade, data e duração). A Twitch exige que o site rode em um domínio ou em `localhost`.

</details>

## 📂 Estrutura de pastas

```
Fedepe-site/
├── index.html                    # redireciona para Fedepe-HTML/ (GitHub Pages)
└── Fedepe-HTML/
    ├── index.html                # início
    ├── campeonatos.html          # lista e filtros
    ├── inscricao.html            # detalhes, chaveamento e inscrição
    ├── transmissoes.html         # player e partidas gravadas
    ├── ranking.html              # pódio e tabela
    ├── login.html · cadastro.html
    ├── perfil.html               # perfil, autorizações e equipe
    ├── admin.html                # painel da coordenação
    ├── style.css                 # paleta azul e branca da FEDEPE (responsivo)
    ├── img/                      # brasão, ícones e banners dos jogos
    └── js/
        ├── mock/database.js      # seed: escolas, alunos, equipes, campeonatos, chaveamentos, transmissões, autorizações
        ├── services/mockApi.js   # "backend": localStorage, latência simulada, regras de negócio, eventos
        └── ui/
            ├── layout.js         # cabeçalho, rodapé, modal, toast e utilitários
            └── parental-auth.js  # autorizações dos pais e da escola (canvas + e-mail simulado)
```

## 🗺️ Próximos passos

- [ ] Backend real (Back4App) no lugar do `mockApi.js`
- [ ] Envio real de e-mails de autorização (link com token) para responsáveis e escolas
- [ ] Edição de campeonatos e chaveamentos pelo Painel ADM

> ⚠️ O hash de senha no mock serve apenas para demonstração. Em produção, a autenticação e o hash (bcrypt/argon2) devem ficar no servidor.

## 👥 Equipe

Projeto desenvolvido em equipe por:

- **Gustavo Costa** · [@gustavo123c](https://github.com/gustavo123c)
- **Pedro Garcia** · [@pedrogarciia](https://github.com/pedrogarciia)
- **Pedro Henrique Lima**

<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&height=90&color=0:2F5BB5,100:163574&section=footer" width="100%" alt="" />
</div>
