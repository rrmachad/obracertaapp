// Materiais sugeridos por fase de obra (baseado no padrão MCMV)
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
    faseNome: 'Preliminares',
    materiais: [
      { nome: 'Lona plástica', unidade: 'm²', categoria: 'Proteção' },
      { nome: 'Madeira para tapume', unidade: 'm', categoria: 'Proteção' },
      { nome: 'Pregos diversos', unidade: 'kg', categoria: 'Fixação' },
      { nome: 'Estacas de madeira', unidade: 'un', categoria: 'Demarcação' },
      { nome: 'Linha de nylon', unidade: 'm', categoria: 'Demarcação' },
    ],
  },
  {
    faseNome: 'Fundação',
    materiais: [
      { nome: 'Cimento CP II', unidade: 'sc', categoria: 'Cimento' },
      { nome: 'Areia média', unidade: 'm³', categoria: 'Agregado' },
      { nome: 'Brita 1', unidade: 'm³', categoria: 'Agregado' },
      { nome: 'Brita 0 (pedrisco)', unidade: 'm³', categoria: 'Agregado' },
      { nome: 'Ferro CA-50 8mm', unidade: 'kg', categoria: 'Ferragem' },
      { nome: 'Ferro CA-50 10mm', unidade: 'kg', categoria: 'Ferragem' },
      { nome: 'Ferro CA-60 5mm', unidade: 'kg', categoria: 'Ferragem' },
      { nome: 'Arame recozido', unidade: 'kg', categoria: 'Ferragem' },
      { nome: 'Espaçadores plásticos', unidade: 'un', categoria: 'Ferragem' },
      { nome: 'Tábuas para forma', unidade: 'un', categoria: 'Forma' },
      { nome: 'Pontaletes', unidade: 'un', categoria: 'Forma' },
      { nome: 'Desmoldante', unidade: 'lt', categoria: 'Forma' },
    ],
  },
  {
    faseNome: 'Estrutura',
    materiais: [
      { nome: 'Cimento CP II', unidade: 'sc', categoria: 'Cimento' },
      { nome: 'Areia média', unidade: 'm³', categoria: 'Agregado' },
      { nome: 'Brita 1', unidade: 'm³', categoria: 'Agregado' },
      { nome: 'Ferro CA-50 10mm', unidade: 'kg', categoria: 'Ferragem' },
      { nome: 'Ferro CA-50 12.5mm', unidade: 'kg', categoria: 'Ferragem' },
      { nome: 'Estribos 5x20', unidade: 'un', categoria: 'Ferragem' },
      { nome: 'Bloco cerâmico 14x19x29', unidade: 'un', categoria: 'Alvenaria' },
      { nome: 'Bloco cerâmico 9x19x29', unidade: 'un', categoria: 'Alvenaria' },
      { nome: 'Tijolo maciço', unidade: 'un', categoria: 'Alvenaria' },
      { nome: 'Cal hidratada', unidade: 'sc', categoria: 'Argamassa' },
      { nome: 'Argamassa pronta', unidade: 'sc', categoria: 'Argamassa' },
      { nome: 'Verga pré-moldada', unidade: 'un', categoria: 'Estrutura' },
      { nome: 'Contraverga pré-moldada', unidade: 'un', categoria: 'Estrutura' },
    ],
  },
  {
    faseNome: 'Cobertura',
    materiais: [
      { nome: 'Telha cerâmica', unidade: 'un', categoria: 'Telhas' },
      { nome: 'Telha de fibrocimento', unidade: 'un', categoria: 'Telhas' },
      { nome: 'Cumeeira', unidade: 'un', categoria: 'Telhas' },
      { nome: 'Madeira para tesoura', unidade: 'm³', categoria: 'Madeiramento' },
      { nome: 'Caibros 5x6', unidade: 'm', categoria: 'Madeiramento' },
      { nome: 'Ripas 1x5', unidade: 'm', categoria: 'Madeiramento' },
      { nome: 'Terças 6x12', unidade: 'm', categoria: 'Madeiramento' },
      { nome: 'Pregos 18x30', unidade: 'kg', categoria: 'Fixação' },
      { nome: 'Parafusos para telha', unidade: 'un', categoria: 'Fixação' },
      { nome: 'Manta subcobertura', unidade: 'm²', categoria: 'Impermeabilização' },
      { nome: 'Calha galvanizada', unidade: 'm', categoria: 'Drenagem' },
      { nome: 'Rufo', unidade: 'm', categoria: 'Drenagem' },
    ],
  },
  {
    faseNome: 'Instalações',
    materiais: [
      { nome: 'Tubo PVC 100mm esgoto', unidade: 'm', categoria: 'Hidráulica' },
      { nome: 'Tubo PVC 50mm esgoto', unidade: 'm', categoria: 'Hidráulica' },
      { nome: 'Tubo PVC 25mm água fria', unidade: 'm', categoria: 'Hidráulica' },
      { nome: 'Tubo PVC 32mm água fria', unidade: 'm', categoria: 'Hidráulica' },
      { nome: 'Joelhos e conexões PVC', unidade: 'un', categoria: 'Hidráulica' },
      { nome: 'Caixa sifonada', unidade: 'un', categoria: 'Hidráulica' },
      { nome: 'Caixa de gordura', unidade: 'un', categoria: 'Hidráulica' },
      { nome: 'Registro de gaveta', unidade: 'un', categoria: 'Hidráulica' },
      { nome: 'Eletroduto PVC 25mm', unidade: 'm', categoria: 'Elétrica' },
      { nome: 'Eletroduto PVC 32mm', unidade: 'm', categoria: 'Elétrica' },
      { nome: 'Caixa de luz 4x2', unidade: 'un', categoria: 'Elétrica' },
      { nome: 'Caixa de luz 4x4', unidade: 'un', categoria: 'Elétrica' },
      { nome: 'Fio 2.5mm²', unidade: 'm', categoria: 'Elétrica' },
      { nome: 'Fio 4mm²', unidade: 'm', categoria: 'Elétrica' },
      { nome: 'Fio 6mm²', unidade: 'm', categoria: 'Elétrica' },
      { nome: 'Disjuntores', unidade: 'un', categoria: 'Elétrica' },
      { nome: 'Quadro de distribuição', unidade: 'un', categoria: 'Elétrica' },
    ],
  },
  {
    faseNome: 'Acabamento',
    materiais: [
      { nome: 'Massa corrida', unidade: 'lt', categoria: 'Pintura' },
      { nome: 'Tinta látex', unidade: 'lt', categoria: 'Pintura' },
      { nome: 'Tinta acrílica', unidade: 'lt', categoria: 'Pintura' },
      { nome: 'Selador', unidade: 'lt', categoria: 'Pintura' },
      { nome: 'Lixa para parede', unidade: 'un', categoria: 'Pintura' },
      { nome: 'Argamassa colante AC I', unidade: 'sc', categoria: 'Revestimento' },
      { nome: 'Argamassa colante AC II', unidade: 'sc', categoria: 'Revestimento' },
      { nome: 'Rejunte', unidade: 'kg', categoria: 'Revestimento' },
      { nome: 'Piso cerâmico', unidade: 'm²', categoria: 'Revestimento' },
      { nome: 'Azulejo', unidade: 'm²', categoria: 'Revestimento' },
      { nome: 'Rodapé', unidade: 'm', categoria: 'Revestimento' },
      { nome: 'Porta interna', unidade: 'un', categoria: 'Esquadrias' },
      { nome: 'Porta externa', unidade: 'un', categoria: 'Esquadrias' },
      { nome: 'Janela de alumínio', unidade: 'un', categoria: 'Esquadrias' },
      { nome: 'Fechadura', unidade: 'un', categoria: 'Esquadrias' },
      { nome: 'Dobradiças', unidade: 'un', categoria: 'Esquadrias' },
      { nome: 'Vaso sanitário', unidade: 'un', categoria: 'Louças' },
      { nome: 'Lavatório', unidade: 'un', categoria: 'Louças' },
      { nome: 'Pia de cozinha', unidade: 'un', categoria: 'Louças' },
      { nome: 'Tanque', unidade: 'un', categoria: 'Louças' },
      { nome: 'Torneira', unidade: 'un', categoria: 'Metais' },
      { nome: 'Chuveiro', unidade: 'un', categoria: 'Metais' },
      { nome: 'Interruptores', unidade: 'un', categoria: 'Elétrica' },
      { nome: 'Tomadas', unidade: 'un', categoria: 'Elétrica' },
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
