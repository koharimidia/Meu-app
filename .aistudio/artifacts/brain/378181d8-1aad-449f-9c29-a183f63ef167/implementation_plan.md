# Modo de Privacidade do Resumo Financeiro

Implementação de um botão e modo de privacidade global no topo da aplicação para ocultar/mascarar valores e dados monetários com asteriscos (`R$ ••••••`), preservando a estrutura dos cards, gráficos e tabelas, com persistência automática no navegador (`localStorage`).

---

## Revisão do Usuário & Decisões Confirmadas

> [!IMPORTANT]
> **Decisões confirmadas nas perguntas de esclarecimento:**
> - **Formato da visualização oculta**: Mascarar os valores monetários com asteriscos elegantes (`R$ ••••••` / `••••`) sem desmontar ou recolher os cards e layouts, mantendo a harmonia visual.
> - **Posicionamento e Persistência**: Botão de alternância com ícone de olho (`Eye` / `EyeOff`) disponível na barra superior (`TopBar`) para acesso em qualquer tela, sincronizado e salvo no `localStorage` do navegador para manter o estado entre recarregamentos, com atalho complementar no cabeçalho do card de Resumo Financeiro na Home.

---

## 1. Visão Geral & Conceito

- **O que faz**: Permite que o usuário oculte instantaneamente valores confidenciais (saldo em conta, faturamento, despesas, valores de notas fiscais e recebíveis) ao utilizar o app em locais públicos, em reuniões ou ao compartilhar a tela.
- **Público-alvo**: O usuário e gestores da Central Kohari que precisam consultar o sistema sem expor cifras monetárias a terceiros próximos ou durante gravações/compartilhamento de tela.
- **Valor Agregado**: Sensação de segurança e privacidade imediata com 1 clique, sem perder a percepção de volume, métricas proporcionais e organização da tela.

---

## 2. Experiência do Usuário & Design Visual

### Fluxos Principais
1. **Ativação pelo Cabeçalho Superior (`TopBar`)**:
   - Um botão interativo com ícone de olho (`EyeOff` quando visível, `Eye` quando oculto) é exibido na barra superior ao lado dos indicadores de status e sincronização.
   - Tooltip explicativo: *"Ocultar valores financeiros"* ou *"Mostrar valores financeiros"*.
   - Ao clicar, o estado muda com transição suave e todos os valores monetários são substituídos por `R$ ••••••` (ou `••••` em contadores sensíveis).
2. **Atalho Direto no Card "Resumo Financeiro"**:
   - No card principal da tela de Início (`HomeView`), um botão compacto de alternância rápida fica posicionado ao lado do título "Resumo Financeiro" para facilidade de clique contextual.
3. **Persistência Automática**:
   - Ao recarregar a página ou abrir em uma nova aba, o estado da privacidade permanece exatamente como o usuário deixou (via chave `kohari_privacy_mode` no `localStorage`).

### Identidade Visual & Estilo dos Valores Mascarados
- **Estilo de Máscara**: Fontes monoespaçadas sutis com pontos ou asteriscos estilizados (ex: `R$ • • • • •`), garantindo que o card preserve altura, largura e alinhamentos de texto originais.
- **Feedback Visual**: Quando o modo de privacidade está ativo, o botão na barra ganha um destaque sutil (borda azul/índigo suave e ícone indicativo com riscado `EyeOff`), informando que o modo discreto está acionado.

---

## 3. Decisões de Produto & Trade-offs

- **Decisão 1: Mascarar com caracteres fixos vs. Ocultar o card inteiro**
  - *Abordagem Escolhida*: Mascarar valores (`R$ ••••••`) mantendo o layout intacto.
  - *Motivo*: Evita "layout shifts" (pulos de tela ou quebra de proporção dos grids) e preserva a leitura dos títulos, status e estrutura do sistema.
  - *Alternativas Consideradas*: Recolher o card ou aplicar `blur` (desfoque visual). O desfoque pode variar entre navegadores e o mascaramento por caracteres é 100% legível, previsível e seguro contra inspeção rápida de ombro.

- **Decisão 2: Persistência em `localStorage`**
  - *Abordagem Escolhida*: Armazenamento local no cliente (`localStorage`).
  - *Motivo*: Não polui o banco de dados nem requer requisições ao backend; cada dispositivo/navegador lembra da preferência do usuário instantaneamente sem delay de rede.

---

## 4. Arquitetura Técnica & Estrutura de Componentes

```
┌────────────────────────────────────────────────────────┐
│                        App.tsx                         │
│  State: isPrivacyMode (lido / gravado no localStorage) │
│  Handler: togglePrivacyMode()                          │
└───────────┬───────────────────────────────┬────────────┘
            │                               │
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────────────┐
│      TopBar.tsx       │       │    HomeView & FinanceView     │
│  - Botão Eye / EyeOff │       │  - Card Resumo Financeiro     │
│  - Indicador ativo    │       │  - KPI Cards (Saldo, Receita) │
│  - Tooltip acessível  │       │  - Tabela & Lista de Contas   │
└───────────────────────┘       └───────────────┬───────────────┘
                                                │
                                                ▼
                                ┌───────────────────────────────┐
                                │      formatters.ts            │
                                │  formatMoney(val, isPrivate)  │
                                │  -> "R$ ••••••" se ativo      │
                                └───────────────────────────────┘
```

### Mapeamento de Modificações:
1. **`src/lib/formatters.ts`**:
   - Atualizar a função auxiliar `formatMoney(val: number, isPrivate?: boolean)` ou fornecer `formatMoneyPrivate(val: number, isPrivate: boolean)` para retornar de forma padronizada `R$ ••••••` quando a privacidade estiver ativada.
2. **`src/App.tsx`**:
   - Inicializar o estado `const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => localStorage.getItem('kohari_privacy_mode') === 'true')`.
   - Adicionar o callback `togglePrivacyMode` que atualiza o estado e sincroniza com o `localStorage`.
   - Passar `isPrivacyMode` e `onTogglePrivacyMode` para o `TopBar`, `HomeView` e `FinanceView`.
3. **`src/components/TopBar.tsx`**:
   - Adicionar o botão com ícone `Eye` / `EyeOff` na barra de ações rápidas ao lado do botão de sincronização / status.
4. **`src/components/HomeView.tsx`**:
   - Aplicar a máscara nos 4 mini-cards de métricas (Saldo Líquido, Receitas, Despesas, A Receber), no valor total central do gráfico de rosca de categorias e nos valores da lista de Contas a Receber.
   - Adicionar botão de atalho no cabeçalho do card "Resumo Financeiro".
5. **`src/components/FinanceView.tsx`**:
   - Aplicar a máscara nos KPIs do topo da tela financeira e nos valores da lista de transações quando ativado.
