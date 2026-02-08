export type ObraStatus = 'planejamento' | 'em_andamento' | 'concluida' | 'pausada';
export type ClimaTipo = 'ensolarado' | 'nublado' | 'chuvoso' | 'parcialmente_nublado';
export type ItemStatus = 'pendente' | 'em_andamento' | 'concluido';

export interface Profile {
  id: string;
  user_id: string;
  nome: string;
  telefone?: string;
  empresa?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Obra {
  id: string;
  user_id: string;
  nome: string;
  endereco: string;
  status: ObraStatus;
  progresso: number;
  foto_capa?: string;
  created_at: string;
  updated_at: string;
}

export interface Fase {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  icone?: string;
  created_at: string;
}

export interface CronogramaItem {
  id: string;
  obra_id: string;
  fase_id: string;
  descricao: string;
  status: ItemStatus;
  data_conclusao?: string;
  observacoes?: string;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  obra_id: string;
  nome: string;
  unidade: string;
  qtd_atual: number;
  qtd_minima: number;
  preco_unitario?: number;
  categoria?: string;
  created_at: string;
  updated_at: string;
}

export interface Profissional {
  funcao: string;
  quantidade: number;
}

export interface FotoComLegenda {
  url: string;
  legenda: string;
}

export interface DiarioLog {
  id: string;
  obra_id: string;
  data: string;
  clima: ClimaTipo;
  atividades_realizadas: string;
  observacoes?: string;
  fotos: FotoComLegenda[];
  profissionais?: Profissional[];
  created_at: string;
  updated_at: string;
}

export interface ConsumoDiario {
  id: string;
  diario_id: string;
  material_id: string;
  qtd_consumida: number;
  created_at: string;
}

export interface MovimentacaoEstoque {
  id: string;
  material_id: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  observacao?: string;
  data: string;
  created_at: string;
}

export interface ObraPin {
  id: string;
  obra_id: string;
  pin_hash: string;
  created_at: string;
  updated_at: string;
}

export interface DiarioLogAlteracao {
  id: string;
  diario_id: string;
  user_id: string;
  campo_alterado: string;
  valor_anterior?: string;
  valor_novo?: string;
  motivo?: string;
  created_at: string;
}
