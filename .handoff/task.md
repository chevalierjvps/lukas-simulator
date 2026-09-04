# 🎯 Tarefa Ativa: Sprint 6 — Visualizador de Patologia (5 Lâminas Gigapixel Reais & Distintas)

> **Para**: Claude Code  
> **De**: Antigravity / Jvps  
> **Status**: Pronto para Execução  
> **Contexto Principal**: `CLAUDE.md` e `/home/jagermeister/Documents/Obsidian Vault/Lukas-Simulator/01 - Arquitetura & Engenharia/Manual de Engenharia Hardcore (Guia Claude Code & Lukas 1.0).md`

---

## 📌 Escopo Cirúrgico da Tarefa (Sprint 6)

1. **Visualizador de Patologia (OpenSeadragon / WSI DZI)**:
   - **Arquivos**: `src/components/pathology/PathologyScreen.jsx`, `src/plugins/pathology/index.jsx`, `server/routes/plugins-routes.js`.
   - **Assets Prontos**: Todas as 5 lâminas reais inteiras e de altíssima resolução já estão geradas no disco em `server/plugin-content/pathology/tiles/`:
     1. `cardiac-infarct-he.dzi` ($2220 \times 2967\text{ px}$, Miocárdio Infartado)
     2. `cardiac-normal-he.dzi` ($15374 \times 17497\text{ px}$, Miocárdio Normal de Controle)
     3. `coronary-atheroma.dzi` ($78000 \times 30462\text{ px}$, Ateroma Masson)
     4. `pulmonary-consolidation-he.dzi` ($66000 \times 45402\text{ px}$, Consolidação Pulmonar H&E)
     5. `renal-microangiopathy-he.dzi` ($46000 \times 32914\text{ px}$, Microangiopatia Renal PAS/H&E)
   - **Metas**:
     - Garantir que o OpenSeadragon abra cada uma das 5 lâminas na rota `/api/plugins/pathology/tiles/...` com `crossOriginPolicy: 'Anonymous'`.
     - Validar que a troca de lâmina na lista lateral atualize o visualizador instantaneamente com zoom fluido e sem travar a interface.
     - Exibir a barra de escala óptica em $\mu\text{m}$ baseada no `nativeMpp = 0.25`.

2. **Verificação & Testes**:
   - Rodar `npx vitest run --project=client` para manter a suíte 100% verde (204 arquivos, 2108 testes).
   - Validar abrindo o app desktop Tauri e navegando na aba Patologia.
   - Salvar o resumo em `.handoff/result.md`.
