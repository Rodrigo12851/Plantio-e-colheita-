# Documento de Requisitos de Produto (PRD)
## Sistema Cristalina - Controle Agrícola e Apontamentos do Campo

---

## 1. Visão Geral e Objetivo do Sistema

### 1.1 Objetivo do Sistema
O **Cristalina - Controle Agrícola** é uma plataforma web para gestão operacional de atividades agrícolas, focada no acompanhamento em tempo real e consolidação de dados de **Plantio**, **Colheita**, **Gestão de Unidades/Filiais**, **Acompanhamento de Máquinas/Ônibus/Motoristas**, **Amarração de Glebas e Pivôs** e **Cadastro de Colaboradores e Apontadores**. 

O sistema visa eliminar retrabalhos manuais, automatizar o cálculo de hectares restantes e produtividades médias por área colhida, garantir a integridade dos dados cruzando as informações de colheita com as de plantio real, e facilitar o compartilhamento instantâneo de relatórios operacionais via WhatsApp, E-mail e Exportação CSV.

### 1.2 Público-Alvo e Perfis de Usuários
1. **Apontadores de Campo**: Registram diariamente as áreas plantadas e colhidas, volume produzido (caixas, sacas, bins), movimentação de ônibus e colaboradores em campo.
2. **Engenheiros Agrônomos e Gerentes de Produção**: Acompanham a evolução do plantio e ritmo da colheita em tempo real, filtram por fazendas/pivôs/glebas e acompanham indicadores de rendimento médio (Média/HA).
3. **Administradores de Unidade / Controladoria**: Gerenciam cadastros mestres (empresas, culturas, variedades, colaboradores, veículos), configuram as amarrações de áreas e gerenciam dados entre diferentes unidades operacionais (ex: Cristalina, Unaí, Paracatu).

---

## 2. Escopo das Funcionalidades

### 2.1 Módulo de Plantio
- **Registro Diário de Plantio**:
  - Data do plantio, Empresa responsável, Cultura, Ordem de Serviço (O.S.), Fazenda, Pivô, Gleba, Variedade, Área Plantada no Dia (ha/dia), Área Restante (ha/restante), Indicador de Gleba Finalizada e Média por Hectare.
- **Auto-cálculos**:
  - Cálculo automático de hectares restantes com base no histórico de plantio da mesma área e variedade.
  - Formatação inteligente de datas (dd/mm/aaaa) e numéricos decimais.

### 2.2 Módulo de Colheita
- **Registro e Apontamento da Colheita**:
  - Data da colheita, Empresa, Cultura, O.S., Fazenda, Pivô, Gleba, Variedade, Área Colhida no Dia (ha/dia), Área Geral (ha/geral), Hectares Restantes, Quantidade Colhida (caixas/sacas/bins/bag), Status de Finalização, Média por Hectare, Mês e Ano.
- **Validação Cruzada com Plantio**:
  - As opções dos seletores de Fazenda, Pivô, Gleba e Variedade na tela de Colheita são filtradas dinamicamente para exibir apenas combinações onde houve **Plantio prévio registrado**.
  - Bloqueio de salvamento caso não exista registro prévio de plantio para a combinação selecionada de Cultura e Fazenda.

### 2.3 Módulo de Cadastros Mestres (Cadastros)
- **Empresas**: Cadastro com código e nome da empresa/parceiro agrícola.
- **Anos/Safras**: Cadastro e gestão de anos agrícolas de referência (ex: 2024, 2025, 2026).
- **Culturas**: Cadastro de tipos de cultivo (ex: Alho, Batata, Cebola, Soja, Milho, Feijão).
- **Fazendas**: Gestão das propriedades rurais pertencentes ou arrendadas pela empresa.
- **Pivôs**: Identificação e dimensionamento numérico dos pivôs de irrigação por fazenda.
- **Glebas**: Cadastro dos talhões/glebas de terra e capacidade nominal em hectares.
- **Variedades**: Cadastro de variedades por cultura com códigos de identificação.
- **Colaboradores / Apontadores**: Registro de matrícula, nome, status (Ativo/Inativo), local de alocação e função de apontador.
- **Motoristas**: Cadastro de motoristas com código de capa, nome completo e abreviação.
- **Ônibus / Veículos de Transporte**: Gestão de frota com placa, cor, motorista atribuído, local de atuação e status de cooperado.

### 2.4 Módulo de Amarração de Áreas (Vínculo de Pivô / Gleba / Hectares)
- Permite vincular estruturalmente Fazenda + Pivô + Gleba + Variedade + Quantidade Total de Hectares.
- Serve como base de conhecimento para validação de capacidade produtiva total da propriedade.

### 2.5 Gerenciamento Multi-Unidade
- Seletor de Unidades no topo do sistema (ex: Cristalina - GO, Unaí - MG, Paracatu - MG).
- Isolamento de dados por unidade com suporte à visualização global unificada.

### 2.6 Modo Grade (Edição Direta em Tabela)
- Alternância instantânea para modo "Spreadsheet/Grid", permitindo edição direta de células (`contentEditable`) com salvamento em tempo real e atualização de totais.

### 2.7 Filtragem Avançada e Busca Multi-Coluna
- Filtro global por busca textual.
- Popover de filtro independente por coluna em todas as tabelas (Colheita, Plantio e Cadastros).
- Indicadores visuais quando há filtros ativos em uma ou mais colunas.

### 2.8 Central de Compartilhamento e Relatórios
- **Detecção de Dispositivo**: Uso nativo do `navigator.share` em dispositivos móveis (Android/iOS).
- **Suporte Desktop / PC**:
  - Link direto otimizado para **WhatsApp Web** (`web.whatsapp.com`) e aplicativo do WhatsApp.
  - Integração com Telegram Web/App.
  - Envio direto por E-mail (`mailto`).
  - Copiar texto formatado do relatório para a área de transferência com fallback para navegadores antigos.
  - Impressão direta formatada para papel/PDF.

### 2.9 Módulo de Lixeira e Restauração de Dados (Soft-Delete)
- Exclusão segura de dados: qualquer item deletado é movido para a **Lixeira** com suporte a **Desfazer (Undo)** e recuperação posterior.
- Modal de confirmação detalhado exibindo resumo do item antes da exclusão.

---

## 3. Estrutura de Telas e Interface do Usuario

### 3.1 Cabeçalho e Navegação Superior
- **Barra Superior**: Logo "Cristalina - Controle Agrícola", Seletor de Unidades Ativas, Indicadores Globais de Registros.
- **Menu de Abas**:
  - `Colheita`
  - `Plantio`
  - `Cadastros` (Dropdown/Abas secundárias: Empresas, Anos, Culturas, Fazendas, Pivôs, Glebas, Variedades, Colaboradores, Motoristas, Ônibus, Amarração)
  - `Lixeira`

### 3.2 Painel Principal (Dashboard de Dados)
- **Barra de Ações**: Botão de Adicionar Novo Registro, Botão de Modo Grade (Ativar/Desativar), Botão de Compartilhar, Botão de Exportar CSV, Campo de Busca Global.
- **Tabela de Dados Responsiva**:
  - Cabeçalhos ordenáveis com botões de filtro individual.
  - Linhas com suporte a ações rápidas: Editar, Excluir (Lixeira).
  - Células editáveis em Modo Grade.
- **Rodapé da Tabela**: Contador de registros visíveis e totais acumulados de Hectares e Volumes.

---

## 4. Regras de Negócio Críticas

1. **Dependência Plantio -> Colheita**:
   - Um registro de Colheita de determinada Fazenda, Pivô, Gleba e Variedade deve obrigatoriamente referenciar uma área previamente cadastrada no Plantio.
   - O seletor de variedades, glebas e pivôs na colheita ajusta automaticamente os hectares totais disponíveis com base na soma dos hectares plantados.
2. **Integridade de Códigos**:
   - Códigos de colaboradores, variedades, veículos e empresas devem conter apenas dígitos numéricos e ser únicos por unidade operacional.
3. **Cálculo da Média / HA**:
   - Média = Quantidade Total Colhida / Hectares Colhidos no Dia.
   - Truncamento e formatação decimal em padrão nacional (vírgula como separador decimal).
4. **Soft Delete e Lixeira**:
   - Nenhuma exclusão no sistema é destrutiva imediatamente. Todos os registros vão para a `LixeiraData` mantendo metadata do objeto original para eventual restauração.
5. **Acessibilidade de Compartilhamento no Computador**:
   - Em sistemas desktop, o clique no botão WhatsApp direciona prioritariamente para `https://web.whatsapp.com/send?text=...`, garantindo que o usuário consiga enviar relatórios sem dependência de protocolo nativo mobile.

---

## 5. Estrutura e Modelo de Dados (TypeScript Interfaces)

```typescript
// Unidades Operacionais
export interface UnidadeItem {
  id: string;
  nome: string;
}

// Registro de Plantio
export interface PlantioItem {
  data: string;
  empresa?: string;
  cultura: string;
  os?: string;
  fazenda: string;
  pivo?: string;
  gleba?: string;
  variedade?: string;
  haDia?: string;
  haRestante?: string;
  glebasFinalizada?: string;
  mediaHa?: string;
  ano?: string;
  unidade: string;
}

// Registro de Colheita
export interface ColheitaItem {
  data: string;
  empresa?: string;
  cultura: string;
  os?: string;
  fazenda: string;
  pivo?: string;
  gleba?: string;
  variedade?: string;
  haDia?: string;
  haGeral?: string;
  haRestante?: string;
  qtdColhido?: string;
  glebasFinalizada?: string;
  mediaHa?: string;
  mes?: string;
  ano?: string;
  caixasCortadas?: string;
  caixaBinBag?: string;
  unidade: string;
}

// Amarração de Pivô/Gleba
export interface AmarracaoItem {
  id: string;
  fazenda: string;
  pivo: string;
  gleba: string;
  variedade: string;
  ha: string;
  status: 'Ativo' | 'Inativo';
  unidade: string;
}
```

---

## 6. Arquitetura Tecnológica e Estrutura de Pastas

### 6.1 Tecnologias Recomendadas
- **Frontend Framework**: React 18+ com TypeScript
- **Build Tool**: Vite
- **Estilização**: Tailwind CSS + CSS Customizado para tabelas agrícolas responsivas
- **Ícones**: FontAwesome / Lucide React
- **Persistência**: LocalStorage com sincronização reativa / Firestore Ready
- **Ambiente de Runtime**: Node.js no Cloud Run (Porta 3000) com Reverse Proxy Nginx

### 6.2 Estrutura de Arquivos do Projeto
```
/
├── index.html              # Ponto de entrada HTML
├── package.json            # Configurações de dependências e scripts npm
├── vite.config.ts          # Configurações de build do Vite
├── tsconfig.json           # Configurações do compilador TypeScript
├── metadata.json           # Metadados e permissões da aplicação
├── .env.example            # Declaração de variáveis de ambiente
└── src/
    ├── main.tsx            # Inicializador principal do React
    ├── App.tsx             # Aplicação principal (Estado, Telas, Modais)
    ├── index.css           # Estilos globais, temas de tabela e modais
    └── types.ts            # Interfaces e definições de dados
```

---

## 7. Critérios de Aceitação e Qualidade

1. **Desempenho**: Renderização de tabelas com até 5.000 registros sem congelamento da interface.
2. **Fidelidade de Dados**: Cálculo exato de Hectares e Média/HA sem erros de arredondamento de ponto flutuante.
3. **Compatibilidade Desktop & Mobile**:
   - Layout utilizável tanto em celulares de campo quanto em monitores desktop de alta resolução.
   - Botões de compartilhamento funcionais em navegadores de computador (Chrome, Edge, Firefox, Safari).
4. **Validação de Formulários**: Impede envio de dados vazios ou inconsistentes nos cadastros obrigatórios.
5. **Zero Erros de Compilação**: Projeto compila com `tsc --noEmit` e `vite build` sem nenhuma advertência ou falha.

---

## 8. Cronograma e Fases de Desenvolvimento

| Fase | Descrição | Status |
| :--- | :--- | :--- |
| **Fase 1** | Modelagem dos dados e criação das telas de Plantio, Colheita e Cadastros Mestres | **Concluído** |
| **Fase 2** | Implementação das regras de vinculo Plantio -> Colheita e auto-cálculos de Hectares | **Concluído** |
| **Fase 3** | Desenvolvimento do Modo Grade (Spreadsheet view) e Filtros Dinâmicos Multi-Coluna | **Concluído** |
| **Fase 4** | Ajustes no Hub de Compartilhamento com suporte nativo a WhatsApp Web no PC | **Concluído** |
| **Fase 5** | Limpeza de artefatos, sincronização de pacotes e homologação final do PRD | **Concluído** |

---

## 9. Melhorias Futuras (Roadmap)
- **Integração com Offline First / PWA**: Suporte completo a Service Workers para gravação de apontamentos no campo sem conectividade com a internet.
- **Geolocalização e Mapas**: Visualização dos pivôs e glebas sobrepostos a mapas de satélite (Google Maps API).
- **Exportação de Relatórios em PDF**: Gerador automático de boletins diários de colheita em formato PDF com gráficos de desempenho.
