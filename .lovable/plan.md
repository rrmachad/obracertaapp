
# 🏗️ Obra Fácil - App de Gestão de Obras MCMV

Um PWA Mobile-First para pequenos construtores brasileiros gerenciarem múltiplos canteiros de obra com controle de estoque, avanço físico e diário de obra.

---

## 🎨 Identidade Visual

**Tema "Laranja Construção"** com cores que remetem ao canteiro de obra:
- **Primário**: Laranja vibrante (alertador, energético)
- **Secundário**: Cinza escuro/carvão (profissional, sóbrio)
- **Destaques**: Amarelo para alertas, verde para concluído
- **Tipografia**: Grande e legível, botões amplos para uso com luvas

---

## 🔐 Autenticação de Usuários

- **Tela de Login/Cadastro** com visual de canteiro
- Cada usuário vê apenas suas obras
- Opção de recuperação de senha
- Sessão persistente no dispositivo

---

## 📱 Estrutura de Telas

### 1. Dashboard Multi-Obra (Tela Inicial)
- Cards de obras com foto de capa, nome, endereço e barra de progresso
- Status visual por cores (Planejamento, Em Andamento, Concluída)
- Botão flutuante (FAB) laranja "Nova Obra" com ícone de capacete
- Busca/filtro rápido por nome

### 2. Formulário Nova Obra
- Upload de foto de capa do terreno/construção
- Campos: Nome, Endereço, Status inicial
- Criação automática das 6 fases padrão MCMV com seus checklists

### 3. Detalhes da Obra (Navegação por Abas)

**Aba Cronograma (Fases)**
- 6 fases em accordion expansível:
  1. Serviços Preliminares
  2. Fundação
  3. Estrutura
  4. Cobertura
  5. Instalações
  6. Acabamento
- Cada fase mostra itens de checklist personalizáveis
- Checkbox grande para marcar "Feito" com data de conclusão
- Barra de progresso por fase e geral

**Aba Estoque (Materiais)**
- Lista de materiais com ícone de caminhão
- Cada item: Nome, Qtd Atual, Unidade (kg, sc, m³, un)
- Botões grandes "+" e "-" para ajuste rápido
- Badge vermelho "ALERTA" quando abaixo do mínimo
- Botão "Adicionar Material"

**Aba Diário de Obra**
- Formulário do dia:
  - Seletor de clima (☀️ Sol, 🌧️ Chuva, ☁️ Nublado)
  - Textarea "O que foi feito hoje"
  - Upload de fotos do dia
  - Campo de observações
- Botão grande "Salvar Relatório"
- Histórico dos dias anteriores em cards expansíveis

---

## 📊 Banco de Dados (Supabase)

**Tabelas estruturadas:**
- `profiles` - Dados do usuário
- `obras` - Obras vinculadas ao usuário
- `fases` - Template das 6 fases MCMV
- `cronograma_itens` - Checklist por obra/fase
- `materiais` - Estoque isolado por obra
- `diario_log` - Relatórios diários com fotos
- `consumo_diario` - Rastreamento de gastos de material

**Lógica automática:**
- Cálculo de progresso baseado nos itens concluídos
- Subtração de estoque ao registrar consumo

---

## 📦 Armazenamento de Fotos

- Bucket para fotos de capa das obras
- Bucket para fotos do diário de obra
- Compressão automática para economia de dados no canteiro

---

## 📶 Funcionalidade Offline (PWA)

- Instalável na tela inicial do celular
- Cache de dados para funcionar sem internet
- Sincronização automática quando voltar online
- Indicador visual de "modo offline"

---

## 🎯 Recursos UX Mobile-First

- Botões extra grandes (mínimo 48px)
- Ícones em todo lugar (Lucide React)
- Pull-to-refresh para atualizar dados
- Toasts de confirmação de ações
- Navegação simples com bottom bar

---

## 🚀 Resultado Final

Um app que o mestre de obras pode usar no celular, mesmo com luvas, para:
- Ver rapidamente o progresso de todas as obras
- Marcar tarefas como concluídas com um toque
- Ajustar estoque na hora da entrega de material
- Registrar o dia de trabalho com fotos e clima
- Funcionar mesmo sem sinal no canteiro
