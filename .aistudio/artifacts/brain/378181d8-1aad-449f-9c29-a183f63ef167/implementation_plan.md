# Revisão: Abas de Categoria no Formulário Financeiro e Remoção da Aba de Cursos no Topo

Ajuste do modal de novos lançamentos conforme anotação na imagem: remoção da barra de alternância do topo (`[ Lançamento Geral ]` / `[ Aba de Cursos ]`) e inclusão das abas de categoria diretamente na seção de **Categoria** do formulário para **Doação**, **Custos de Trabalho** e **Cursos**.

---

## Revisão do Usuário & Decisões Confirmadas

> [!IMPORTANT]
> **Modificações solicitadas na captura de tela:**
> - **Remover aba de cursos do topo**: Eliminar completamente os botões de alternância `[ Lançamento Geral ]` e `[ 🎓 Aba de Cursos ]` localizados no cabeçalho do modal. O modal volta a ter um formulário único, enxuto e direto.
> - **Abas de categoria na seção de Categoria**: A escolha de categoria terá abas/botões visuais diretos no próprio formulário:
>   - `[ 🤲 Doação ]`
>   - `[ 💼 Custos de Trabalho ]`
>   - `[ 🎓 Cursos ]`
>   - `[ ▾ Outras Categorias ]` (Alimentação, Transporte, Moradia, etc.)
> - **Inteligência de preenchimento**:
>   - Clicar em **Doação** já define a categoria como `Doação` e sugere atalhos contextuais.
>   - Clicar em **Custos de Trabalho** define como `Custos de Trabalho` para despesas operacionais e produção.
>   - Clicar em **Cursos** define a categoria como `Cursos` sem sair do formulário principal nem abrir modal separado.

---

## 1. Visão Geral & Conceito

- **O que faz**: Simplifica o modal de novo lançamento financeiro retirando a aba secundária do topo e transferindo a segmentação para a linha de **Categoria** com abas de 1 clique para **Doação**, **Custos de Trabalho** e **Cursos**.
- **Público-alvo**: O usuário que deseja cadastrar despesas e entradas de forma rápida, sem telas fragmentadas.
- **Valor Agregado**: Interface mais limpa, sem confusão de abas superiores, com seleção ágil de categorias frequentes.

---

## 2. Experiência do Usuário & Design Visual

### Fluxos Principais
1. **Abertura do Modal de Novo Lançamento**:
   - Cabeçalho limpo com título *"Novo Lançamento Financeiro"* e botão de fechar (sem barra de abas superiores).
2. **Seleção de Categoria com Abas no Formulário**:
   - No campo **Categoria**, em vez de apenas um `<select>` tradicional, o usuário encontra abas estilizadas:
     ```
     Categoria:
     [ 🤲 Doação ]  [ 💼 Custos de Trabalho ]  [ 🎓 Cursos ]  [ ▾ Mais ]
     ```
   - Ao clicar em qualquer uma das abas, a seleção fica ativa com feedback visual imediato (fundo destacado, borda colorida e texto destacado).
   - Se selecionar `[ ▾ Mais ]`, abre um seletor suspenso com as demais categorias (Alimentação, Transporte, Moradia, Esporte, Lazer, Outros).
3. **Sugestões Contextuais e Pré-definições**:
   - Ao selecionar **Doação**: categoria vira `Doação`, tipo ajusta para `Despesa` e exibe tags rápidas como *"Dízimo"*, *"Ação Beneficente"*.
   - Ao selecionar **Custos de Trabalho**: categoria vira `Custos de Trabalho` com sugestões como *"Equipamentos"*, *"Assinatura/Software"*, *"Diárias"*.
   - Ao selecionar **Cursos**: categoria vira `Cursos`, exibindo um campo sutil opcional de plataforma (ex.: Udemy, Hotmart, Alura) sem trocar de tela.

### Identidade Visual & Cores
- **Doação**: `bg-rose-500/15 text-rose-400 border-rose-500/30` com ícone `HeartHandshake`.
- **Custos de Trabalho**: `bg-blue-500/15 text-blue-400 border-blue-500/30` com ícone `Briefcase`.
- **Cursos**: `bg-cyan-500/15 text-cyan-400 border-cyan-500/30` com ícone `GraduationCap`.

---

## 3. Decisões de Produto & Trade-offs

- **Decisão 1: Remover as abas superiores de modo**
  - *Abordagem*: Remover o bloco `tab-btn-general-finance` e `tab-btn-course-finance` do topo do modal.
  - *Motivo*: Atende diretamente à anotação visual do usuário na imagem (*"remover essa aba de cursos"*).
- **Decisão 2: Centralizar as categorias em abas integradas**
  - *Abordagem*: Colocar as abas de categoria logo acima ou no lugar do select de categoria.
  - *Motivo*: Facilita o preenchimento sem poluir o topo da janela modal.

---

## 4. Arquitetura Técnica & Estrutura de Componentes

```
┌────────────────────────────────────────────────────────┐
│             Modal: Novo Lançamento Financeiro          │
│  (Sem abas no topo - cabeçalho único e direto)         │
├────────────────────────────────────────────────────────┤
│  Tipo: [ Despesa / Saída ]      Valor: [ R$ 0,00 ]     │
│  Descrição: [                                    ]     │
│                                                        │
│  Categoria:                                            │
│  ┌───────────┐ ┌────────────────────┐ ┌──────────────┐│
│  │ 🤲 Doação │ │ 💼 Custos Trabalho │ │  🎓 Cursos   ││
│  └───────────┘ └────────────────────┘ └──────────────┘│
│  [ ▾ Outras categorias...                            ]│
│                                                        │
│  Data: [ 2026-10-31 ]         Status: [ Pago / Pend ]  │
│  [✓] Despesa Recorrente Mensal (Fixa / Assinatura)     │
└────────────────────────────────────────────────────────┘
```

### Arquivos Impactados:
1. **`src/components/Modals.tsx`**:
   - Remover os botões de alternância do topo (`financeTab` tabs).
   - Inserir as abas visuais de categoria (`Doação`, `Custos de Trabalho`, `Cursos`, `Outras`) com estados reativos.
2. **`src/types.ts`**:
   - Atualizar a união `Category` com `'Doação'` e `'Custos de Trabalho'`.
3. **`src/lib/formatters.ts`**:
   - Adicionar `'Doação'` e `'Custos de Trabalho'` no dicionário `CATEGORY_COLORS`.
4. **`src/components/FinanceView.tsx`**:
   - Incluir as categorias nos filtros da tela de finanças.
