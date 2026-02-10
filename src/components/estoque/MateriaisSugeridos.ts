// Materiais sugeridos por fase de obra — com suporte i18n
export interface MaterialSugerido {
  nome: string;
  unidade: string;
  categoria: string;
}

export interface FaseMateriais {
  faseNome: string;
  materiais: MaterialSugerido[];
}

// ─── Portuguese (default) ───
const materiaisPT: FaseMateriais[] = [
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
      { nome: 'Rejunte Piso', unidade: 'kg', categoria: 'Revestimento' },
      { nome: 'Silicone', unidade: 'un', categoria: 'Vedação' },
    ],
  },
  {
    faseNome: 'Esquadrias',
    materiais: [
      { nome: 'Portas', unidade: 'un', categoria: 'Esquadrias' },
      { nome: 'Janelas', unidade: 'un', categoria: 'Esquadrias' },
      { nome: 'Vidro Verde 8mm Sacada', unidade: 'm²', categoria: 'Vidros' },
      { nome: 'Cadeado', unidade: 'un', categoria: 'Segurança' },
    ],
  },
  {
    faseNome: 'Louças e Metais',
    materiais: [
      { nome: 'Vaso Acoplado', unidade: 'un', categoria: 'Louças' },
      { nome: 'Caixa Acoplada', unidade: 'un', categoria: 'Louças' },
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

// ─── English ───
const materiaisEN: FaseMateriais[] = [
  {
    faseNome: 'Foundation',
    materiais: [
      { nome: 'Sand', unidade: 'm³', categoria: 'Aggregate' },
      { nome: 'Gravel #0', unidade: 'm³', categoria: 'Aggregate' },
      { nome: 'Gravel #1', unidade: 'm³', categoria: 'Aggregate' },
      { nome: 'Fill Material', unidade: 'm³', categoria: 'Earthwork' },
      { nome: 'Ready-Mix Concrete', unidade: 'm³', categoria: 'Concrete' },
      { nome: 'Wire', unidade: 'kg', categoria: 'Rebar' },
      { nome: 'Spacer', unidade: 'un', categoria: 'Rebar' },
      { nome: 'Septic Tank', unidade: 'un', categoria: 'Infrastructure' },
    ],
  },
  {
    faseNome: 'Structure',
    materiais: [
      { nome: 'Ceramic Block', unidade: 'un', categoria: 'Masonry' },
      { nome: 'Hollow Brick', unidade: 'un', categoria: 'Masonry' },
      { nome: 'Shoring Props', unidade: 'un', categoria: 'Formwork' },
      { nome: 'Nails', unidade: 'kg', categoria: 'Fasteners' },
      { nome: 'Tie Wire Mesh', unidade: 'm', categoria: 'Rebar' },
    ],
  },
  {
    faseNome: 'Roofing',
    materiais: [
      { nome: 'White Roof Tiles', unidade: 'un', categoria: 'Tiles' },
      { nome: 'Sisal Rope', unidade: 'm', categoria: 'Ties' },
    ],
  },
  {
    faseNome: 'Plumbing',
    materiais: [
      { nome: 'Water Tank 500L', unidade: 'un', categoria: 'Tank' },
      { nome: 'Water Tank 1000L', unidade: 'un', categoria: 'Tank' },
      { nome: 'Valve', unidade: 'un', categoria: 'Plumbing' },
      { nome: 'Faucet', unidade: 'un', categoria: 'Fixtures' },
      { nome: 'Shower Head', unidade: 'un', categoria: 'Fixtures' },
    ],
  },
  {
    faseNome: 'Electrical',
    materiais: [
      { nome: 'Junction Box', unidade: 'un', categoria: 'Electrical' },
    ],
  },
  {
    faseNome: 'Finishing',
    materiais: [
      { nome: 'Plaster', unidade: 'bag', categoria: 'Coating' },
      { nome: 'Floor Grout', unidade: 'kg', categoria: 'Coating' },
      { nome: 'Silicone Sealant', unidade: 'un', categoria: 'Sealing' },
    ],
  },
  {
    faseNome: 'Doors & Windows',
    materiais: [
      { nome: 'Doors', unidade: 'un', categoria: 'Doors & Windows' },
      { nome: 'Windows', unidade: 'un', categoria: 'Doors & Windows' },
      { nome: 'Green Glass 8mm', unidade: 'm²', categoria: 'Glass' },
      { nome: 'Padlock', unidade: 'un', categoria: 'Security' },
    ],
  },
  {
    faseNome: 'Fixtures',
    materiais: [
      { nome: 'Toilet', unidade: 'un', categoria: 'Fixtures' },
      { nome: 'Cistern', unidade: 'un', categoria: 'Fixtures' },
    ],
  },
  {
    faseNome: 'Outdoor Area',
    materiais: [
      { nome: 'Precast BBQ Grill 60cm', unidade: 'un', categoria: 'Leisure' },
    ],
  },
  {
    faseNome: 'Tools & Consumables',
    materiais: [
      { nome: 'Hacksaw Blade', unidade: 'un', categoria: 'Tools' },
      { nome: 'Washer', unidade: 'un', categoria: 'Fasteners' },
    ],
  },
];

// ─── Spanish ───
const materiaisES: FaseMateriais[] = [
  {
    faseNome: 'Cimentación',
    materiais: [
      { nome: 'Arena', unidade: 'm³', categoria: 'Agregado' },
      { nome: 'Grava #0', unidade: 'm³', categoria: 'Agregado' },
      { nome: 'Grava #1', unidade: 'm³', categoria: 'Agregado' },
      { nome: 'Relleno', unidade: 'm³', categoria: 'Movimiento de Tierras' },
      { nome: 'Hormigón Premezclado', unidade: 'm³', categoria: 'Hormigón' },
      { nome: 'Alambre', unidade: 'kg', categoria: 'Acero' },
      { nome: 'Separador', unidade: 'un', categoria: 'Acero' },
      { nome: 'Fosa Séptica', unidade: 'un', categoria: 'Infraestructura' },
    ],
  },
  {
    faseNome: 'Estructura',
    materiais: [
      { nome: 'Bloque Cerámico', unidade: 'un', categoria: 'Albañilería' },
      { nome: 'Ladrillo Hueco', unidade: 'un', categoria: 'Albañilería' },
      { nome: 'Puntales', unidade: 'un', categoria: 'Encofrado' },
      { nome: 'Clavos', unidade: 'kg', categoria: 'Fijación' },
      { nome: 'Malla de Amarre', unidade: 'm', categoria: 'Acero' },
    ],
  },
  {
    faseNome: 'Techumbre',
    materiais: [
      { nome: 'Tejas Blancas', unidade: 'un', categoria: 'Tejas' },
      { nome: 'Cuerda de Sisal', unidade: 'm', categoria: 'Amarre' },
    ],
  },
  {
    faseNome: 'Instalaciones Hidráulicas',
    materiais: [
      { nome: 'Tanque de Agua 500L', unidade: 'un', categoria: 'Depósito' },
      { nome: 'Tanque de Agua 1000L', unidade: 'un', categoria: 'Depósito' },
      { nome: 'Válvula', unidade: 'un', categoria: 'Hidráulica' },
      { nome: 'Grifo', unidade: 'un', categoria: 'Grifería' },
      { nome: 'Ducha', unidade: 'un', categoria: 'Grifería' },
    ],
  },
  {
    faseNome: 'Instalaciones Eléctricas',
    materiais: [
      { nome: 'Caja de Paso', unidade: 'un', categoria: 'Eléctrica' },
    ],
  },
  {
    faseNome: 'Acabados',
    materiais: [
      { nome: 'Yeso', unidade: 'bolsa', categoria: 'Revestimiento' },
      { nome: 'Lechada de Piso', unidade: 'kg', categoria: 'Revestimiento' },
      { nome: 'Silicona', unidade: 'un', categoria: 'Sellado' },
    ],
  },
  {
    faseNome: 'Carpintería',
    materiais: [
      { nome: 'Puertas', unidade: 'un', categoria: 'Carpintería' },
      { nome: 'Ventanas', unidade: 'un', categoria: 'Carpintería' },
      { nome: 'Vidrio Verde 8mm', unidade: 'm²', categoria: 'Vidrios' },
      { nome: 'Candado', unidade: 'un', categoria: 'Seguridad' },
    ],
  },
  {
    faseNome: 'Sanitarios',
    materiais: [
      { nome: 'Inodoro', unidade: 'un', categoria: 'Sanitarios' },
      { nome: 'Cisterna', unidade: 'un', categoria: 'Sanitarios' },
    ],
  },
  {
    faseNome: 'Área Exterior',
    materiais: [
      { nome: 'Parrilla Prefabricada 60cm', unidade: 'un', categoria: 'Ocio' },
    ],
  },
  {
    faseNome: 'Herramientas y Consumibles',
    materiais: [
      { nome: 'Hoja de Sierra', unidade: 'un', categoria: 'Herramientas' },
      { nome: 'Arandela', unidade: 'un', categoria: 'Fijación' },
    ],
  },
];

// ─── Language-aware exports ───
const materiaisByLang: Record<string, FaseMateriais[]> = {
  'pt-BR': materiaisPT,
  'en-US': materiaisEN,
  'es-ES': materiaisES,
};

export function getMateriaisPorFase(language: string): FaseMateriais[] {
  return materiaisByLang[language] || materiaisPT;
}

export function getTodosMateriais(language: string): MaterialSugerido[] {
  const list = getMateriaisPorFase(language);
  return Array.from(
    new Map(list.flatMap(f => f.materiais).map(m => [m.nome, m])).values()
  );
}

export function getCategorias(language: string): string[] {
  return Array.from(new Set(getTodosMateriais(language).map(m => m.categoria))).sort();
}

export function getFases(language: string): string[] {
  return getMateriaisPorFase(language).map(f => f.faseNome);
}

// Legacy default exports (Portuguese)
export const materiaisPorFase = materiaisPT;
export const todosMateriais = getTodosMateriais('pt-BR');
export const categorias = getCategorias('pt-BR');
export const fases = getFases('pt-BR');
