// Materiais sugeridos por fase de obra - Lista Oficial Atualizada
export interface MaterialSugerido {
  nome: string;
  unidade: string;
  categoria: string;
}

export interface FaseMateriais {
  faseNome: string;
  materiais: MaterialSugerido[];
}

export const materiaisPorFase: FaseMateriais[] = [
  {
    faseNome: 'Fundação',
    materiais: [
      { nome: 'Areia', unidade: 'm³', categoria: 'Agregado' },
      { nome: 'Pedra 0', unidade: 'm³', categoria: 'Agregado' },
      { nome: 'Pedra 1', unidade: 'm³', categoria: 'Agregado' },
      { nome: 'Aterro', unidade: 'm³', categoria: 'Terraplanagem' },
      { nome: 'Concreto Usinado', unidade: 'm³', categoria: 'Concreto' },
      { nome: 'Arame', unidade: 'kg', categoria: 'Ferragem' },
      { nome: 'Espaçador', unidade: 'un', categoria: 'Ferragem' },
      { nome: 'Fossa', unidade: 'un', categoria: 'Infraestrutura' },
    ],
  },
  {
    faseNome: 'Estrutura',
    materiais: [
      { nome: 'Bloco Cerâmico', unidade: 'un', categoria: 'Alvenaria' },
      { nome: 'Tijolo Baiano', unidade: 'un', categoria: 'Alvenaria' },
      { nome: 'Escoras', unidade: 'un', categoria: 'Forma' },
      { nome: 'Prego', unidade: 'kg', categoria: 'Fixação' },
      { nome: 'Tela de Amarração', unidade: 'm', categoria: 'Ferragem' },
      { nome: 'Poste de Concreto 6,0m', unidade: 'un', categoria: 'Estrutura' },
      { nome: 'Poste de Alumínio Galvanizado', unidade: 'un', categoria: 'Estrutura' },
    ],
  },
  {
    faseNome: 'Cobertura',
    materiais: [
      { nome: 'Telhas Brancas', unidade: 'un', categoria: 'Telhas' },
      { nome: 'Sisal', unidade: 'm', categoria: 'Amarração' },
    ],
  },
  {
    faseNome: 'Instalações Hidráulicas',
    materiais: [
      { nome: 'Caixa d\'água 500L', unidade: 'un', categoria: 'Reservatório' },
      { nome: 'Caixa d\'água 1000L', unidade: 'un', categoria: 'Reservatório' },
      { nome: 'Registro Hidráulico', unidade: 'un', categoria: 'Hidráulica' },
      { nome: 'Torneira', unidade: 'un', categoria: 'Metais' },
      { nome: 'Chuveiro', unidade: 'un', categoria: 'Metais' },
      { nome: 'Ducha', unidade: 'un', categoria: 'Metais' },
      { nome: 'Filtro', unidade: 'un', categoria: 'Acessórios' },
      { nome: 'Ralo Box', unidade: 'un', categoria: 'Drenagem' },
    ],
  },
  {
    faseNome: 'Instalações Elétricas',
    materiais: [
      { nome: 'Caixa de Passagem', unidade: 'un', categoria: 'Elétrica' },
    ],
  },
  {
    faseNome: 'Acabamento',
    materiais: [
      { nome: 'Gesso', unidade: 'sc', categoria: 'Revestimento' },
      { nome: 'Encartelado Gesso', unidade: 'un', categoria: 'Revestimento' },
      { nome: 'Sancas De Gesso', unidade: 'm', categoria: 'Revestimento' },
      { nome: 'Rejunte Piso', unidade: 'kg', categoria: 'Revestimento' },
      { nome: 'Espaçador 4mm', unidade: 'un', categoria: 'Revestimento' },
      { nome: 'Silicone', unidade: 'un', categoria: 'Vedação' },
      { nome: 'Bisnaga de silicone', unidade: 'un', categoria: 'Vedação' },
    ],
  },
  {
    faseNome: 'Esquadrias',
    materiais: [
      { nome: 'Portas', unidade: 'un', categoria: 'Esquadrias' },
      { nome: 'Porta Alçapão', unidade: 'un', categoria: 'Esquadrias' },
      { nome: 'Porta Alçapão Gesso', unidade: 'un', categoria: 'Esquadrias' },
      { nome: 'Janelas', unidade: 'un', categoria: 'Esquadrias' },
      { nome: 'Kits Janelas', unidade: 'un', categoria: 'Esquadrias' },
      { nome: 'Vidro Verde 8mm Sacada', unidade: 'm²', categoria: 'Vidros' },
      { nome: 'Portão 0,80m Social', unidade: 'un', categoria: 'Portões' },
      { nome: 'Portão 2,20m Garagem', unidade: 'un', categoria: 'Portões' },
      { nome: 'Portão 2,40m Garagem', unidade: 'un', categoria: 'Portões' },
      { nome: 'Cadeado', unidade: 'un', categoria: 'Segurança' },
    ],
  },
  {
    faseNome: 'Louças e Metais',
    materiais: [
      { nome: 'Vaso Acoplado', unidade: 'un', categoria: 'Louças' },
      { nome: 'Caixa Acoplada', unidade: 'un', categoria: 'Louças' },
      { nome: 'Anel de Cera', unidade: 'un', categoria: 'Acessórios' },
      { nome: 'Nichos Banheiros', unidade: 'un', categoria: 'Acessórios' },
      { nome: 'Mão Francesa Pias', unidade: 'un', categoria: 'Suportes' },
    ],
  },
  {
    faseNome: 'Área Externa',
    materiais: [
      { nome: 'Churrasqueira Pré-Moldada 60cm', unidade: 'un', categoria: 'Lazer' },
    ],
  },
  {
    faseNome: 'Ferramentas e Consumíveis',
    materiais: [
      { nome: 'Serra Starrett', unidade: 'un', categoria: 'Ferramentas' },
      { nome: 'Arruela', unidade: 'un', categoria: 'Fixação' },
    ],
  },
];

// Todos os materiais únicos (removendo duplicatas)
export const todosMateriais: MaterialSugerido[] = Array.from(
  new Map(
    materiaisPorFase
      .flatMap((f) => f.materiais)
      .map((m) => [m.nome, m])
  ).values()
);

// Categorias únicas
export const categorias = Array.from(
  new Set(todosMateriais.map((m) => m.categoria))
).sort();

// Fases únicas
export const fases = materiaisPorFase.map((f) => f.faseNome);
