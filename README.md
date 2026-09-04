# Lukas 1.0 — Simulador Clínico Realista

![Licença](https://img.shields.io/badge/licença-Carm%20Research%20v1.4%20(não%20comercial)-green)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento%20ativo-brightgreen)
![Stack](https://img.shields.io/badge/stack-React%2019%20%7C%20Node%20%7C%20SQLite%20%7C%20Tauri%2FRust-blue)

Lukas 1.0 é um simulador de paciente virtual de alta fidelidade para o ensino
de Medicina, desenvolvido por **João Vitor Pedroso dos Santos (Jvps)**,
estudante de Medicina na Universidade Sudamericana (sede Pedro Juan
Caballero), como aplicativo de mesa (desktop) que roda 100% local — sem
depender de conexão com a internet para operar.

Diferente de um caso clínico estático em slides, o paciente do Lukas
**evolui em tempo real**: os sinais vitais pioram se o estudante demora ou
erra a conduta, e respondem de verdade quando a conduta certa é aplicada. O
objetivo é treinar raciocínio clínico sob pressão de tempo — como acontece de
fato à beira do leito — em vez de memorização de um roteiro fixo.

---

## O que o Lukas oferece

- **Avatar 3D expressivo e monitor multiparamétrico em tempo real** — ECG,
  SpO₂, PA, FR, temperatura e EtCO₂, com motor de fisiologia que reage às
  condutas do estudante (droga, volume, via aérea, choque).
- **Paciente conversacional por voz e texto**, com IA ancorada em gênero e
  coerente com o quadro clínico ativo (a fala do paciente bate com o ECG, a
  dor e os sinais vitais do caso).
- **Ausculta e desfibrilação com causa e efeito reais** — a ausculta
  cardiopulmonar reflete o caso configurado (ex.: normal na dengue, alterada
  na pneumonia), e o choque só tem efeito em ritmo realmente chocável
  (FV/TV sem pulso), como na vida real.
- **Sala de leitura DICOM de verdade** — estudos de raio-X, tomografia e
  outras modalidades, com miniaturas, múltiplas séries e ajuste de
  janela/nível — não é uma imagem estática.
- **Microscópio virtual de patologia digital** — lâminas histológicas reais
  em altíssima resolução (*whole-slide imaging*), com zoom, régua em mícrons
  e ferramentas de anotação.
- **Painel de autoria para o professor** — cada caso (vitais, achados do
  exame físico, laudos de imagem, evolução) é configurado sem escrever
  código.
- **Multilíngue** — português e espanhol ativos na experiência do aluno,
  além de inglês e outros idiomas já suportados pela base da plataforma.
- **Aplicativo de mesa (Tauri/Rust)** — instala e roda localmente em Linux,
  Windows e macOS, sem depender de um servidor remoto.

## Stack técnica

- **Frontend**: React 19 + Vite, Tailwind CSS.
- **Backend**: Node.js/Express + SQLite.
- **Desktop**: Tauri (Rust) — empacota o front + back como aplicativo nativo.
- **Imagem médica**: leitor DICOM próprio e OpenSeadragon para patologia
  digital (*deep zoom*, formato DZI).
- **IA do paciente**: suporte a provedores em nuvem (Anthropic, OpenAI,
  Google) e a modelos locais (LM Studio, Ollama), configurável por caso.
- **Testes**: Vitest (frontend/backend) e testes do motor em Rust
  (`cargo test`).

## Como rodar localmente

```bash
# instala dependências
npm install

# baixa o conteúdo de imagem (DICOM + lâminas de patologia — ver scripts/setup-content.mjs)
npm run setup:content

# sobe o backend (Express, porta 3000) e o frontend (Vite, porta 5173)
npm run dev
```

Para rodar como aplicativo de mesa (Tauri) no Linux:

```bash
GDK_BACKEND=x11 WEBKIT_DISABLE_COMPOSITING_MODE=1 GST_PLUGIN_FEATURE_RANK=pipewiresrc:0 \
  npm run tauri:dev
```

Rodar os testes:

```bash
npx vitest run tests/client      # frontend
npx vitest run tests/server      # backend
cargo test --manifest-path src-tauri/Cargo.toml   # motor em Rust
```

## Origem e licença

Lukas 1.0 é construído sobre a **Rohy**, uma plataforma de simulação de
pacientes virtuais desenvolvida no projeto de pesquisa **CRETIC**
(*Optimizing Clinical Reasoning in Time-Critical Scenarios*), financiado
pelo *Research Council of Finland* e liderado por Sonsoles López-Pernas, sob
a **Carm Research License v1.4** (uso não comercial/acadêmico livre — o
texto completo está em [`LICENSE`](LICENSE)).

Sobre essa base, este projeto acrescenta identidade visual e de marca
própria, conteúdo clínico real curado (estudos DICOM e lâminas de patologia
digital), a lógica de coerência fisiológica (ausculta e desfibrilação
causa-efeito), o painel de autoria de casos, o redesenho completo da
experiência do estudante e o empacotamento como aplicativo de mesa — o
trabalho autoral deste projeto.

**Uso**: educacional e não comercial, no contexto do curso de Medicina da
Universidade Sudamericana. Consulte `LICENSE` antes de qualquer outro uso.

## Contexto do projeto

Este README, junto com o rascunho de inscrição em
[`docs/medhack-unisud-2026-preinscripcion.md`](docs/medhack-unisud-2026-preinscripcion.md),
foi preparado para a submissão do Lukas 1.0 ao **MedHack UNISUD 2026**
(linha temática: Software para a Saúde).
