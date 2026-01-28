-- Enum para status da obra
CREATE TYPE public.obra_status AS ENUM ('planejamento', 'em_andamento', 'concluida', 'pausada');

-- Enum para clima do diário
CREATE TYPE public.clima_tipo AS ENUM ('ensolarado', 'nublado', 'chuvoso', 'parcialmente_nublado');

-- Enum para status de item do cronograma
CREATE TYPE public.item_status AS ENUM ('pendente', 'em_andamento', 'concluido');

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  telefone TEXT,
  empresa TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de obras
CREATE TABLE public.obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  endereco TEXT NOT NULL,
  status public.obra_status DEFAULT 'planejamento' NOT NULL,
  progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  foto_capa TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de fases (template padrão MCMV)
CREATE TABLE public.fases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL,
  icone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Insert das 6 fases padrão MCMV
INSERT INTO public.fases (nome, descricao, ordem, icone) VALUES
  ('Serviços Preliminares', 'Limpeza do terreno, locação da obra, instalações provisórias', 1, 'Shovel'),
  ('Fundação', 'Escavação, sapatas, vigas baldrame, impermeabilização', 2, 'Hammer'),
  ('Estrutura', 'Alvenaria, pilares, vigas, lajes', 3, 'Building2'),
  ('Cobertura', 'Estrutura do telhado, telhas, calhas e rufos', 4, 'Home'),
  ('Instalações', 'Elétrica, hidráulica, esgoto, gás', 5, 'Zap'),
  ('Acabamento', 'Reboco, pintura, pisos, louças, esquadrias', 6, 'Paintbrush');

-- Tabela de itens do cronograma (checklist por obra/fase)
CREATE TABLE public.cronograma_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE NOT NULL,
  fase_id UUID REFERENCES public.fases(id) ON DELETE CASCADE NOT NULL,
  descricao TEXT NOT NULL,
  status public.item_status DEFAULT 'pendente' NOT NULL,
  data_conclusao DATE,
  observacoes TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de materiais (estoque por obra)
CREATE TABLE public.materiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'un',
  qtd_atual DECIMAL(10,2) DEFAULT 0 NOT NULL,
  qtd_minima DECIMAL(10,2) DEFAULT 0 NOT NULL,
  preco_unitario DECIMAL(10,2),
  categoria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de diário de obra
CREATE TABLE public.diario_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE NOT NULL,
  data DATE DEFAULT CURRENT_DATE NOT NULL,
  clima public.clima_tipo DEFAULT 'ensolarado' NOT NULL,
  atividades_realizadas TEXT NOT NULL,
  observacoes TEXT,
  fotos TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de consumo diário (rastreamento de gastos)
CREATE TABLE public.consumo_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diario_id UUID REFERENCES public.diario_log(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES public.materiais(id) ON DELETE CASCADE NOT NULL,
  qtd_consumida DECIMAL(10,2) NOT NULL CHECK (qtd_consumida > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cronograma_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diario_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumo_diario ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas RLS para obras
CREATE POLICY "Users can view own obras"
  ON public.obras FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own obras"
  ON public.obras FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own obras"
  ON public.obras FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own obras"
  ON public.obras FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para fases (leitura pública - são templates)
CREATE POLICY "Anyone can view fases"
  ON public.fases FOR SELECT
  TO authenticated
  USING (true);

-- Políticas RLS para cronograma_itens (via obra)
CREATE POLICY "Users can view own cronograma items"
  ON public.cronograma_itens FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.obras 
    WHERE obras.id = cronograma_itens.obra_id 
    AND obras.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own cronograma items"
  ON public.cronograma_itens FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.obras 
    WHERE obras.id = cronograma_itens.obra_id 
    AND obras.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own cronograma items"
  ON public.cronograma_itens FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.obras 
    WHERE obras.id = cronograma_itens.obra_id 
    AND obras.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own cronograma items"
  ON public.cronograma_itens FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.obras 
    WHERE obras.id = cronograma_itens.obra_id 
    AND obras.user_id = auth.uid()
  ));

-- Políticas RLS para materiais (via obra)
CREATE POLICY "Users can view own materiais"
  ON public.materiais FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.obras 
    WHERE obras.id = materiais.obra_id 
    AND obras.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own materiais"
  ON public.materiais FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.obras 
    WHERE obras.id = materiais.obra_id 
    AND obras.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own materiais"
  ON public.materiais FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.obras 
    WHERE obras.id = materiais.obra_id 
    AND obras.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own materiais"
  ON public.materiais FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.obras 
    WHERE obras.id = materiais.obra_id 
    AND obras.user_id = auth.uid()
  ));

-- Políticas RLS para diario_log (via obra)
CREATE POLICY "Users can view own diario logs"
  ON public.diario_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.obras 
    WHERE obras.id = diario_log.obra_id 
    AND obras.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own diario logs"
  ON public.diario_log FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.obras 
    WHERE obras.id = diario_log.obra_id 
    AND obras.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own diario logs"
  ON public.diario_log FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.obras 
    WHERE obras.id = diario_log.obra_id 
    AND obras.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own diario logs"
  ON public.diario_log FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.obras 
    WHERE obras.id = diario_log.obra_id 
    AND obras.user_id = auth.uid()
  ));

-- Políticas RLS para consumo_diario (via diario_log -> obra)
CREATE POLICY "Users can view own consumo diario"
  ON public.consumo_diario FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.diario_log dl
    JOIN public.obras o ON o.id = dl.obra_id
    WHERE dl.id = consumo_diario.diario_id 
    AND o.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own consumo diario"
  ON public.consumo_diario FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.diario_log dl
    JOIN public.obras o ON o.id = dl.obra_id
    WHERE dl.id = consumo_diario.diario_id 
    AND o.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own consumo diario"
  ON public.consumo_diario FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.diario_log dl
    JOIN public.obras o ON o.id = dl.obra_id
    WHERE dl.id = consumo_diario.diario_id 
    AND o.user_id = auth.uid()
  ));

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_obras_updated_at
  BEFORE UPDATE ON public.obras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cronograma_itens_updated_at
  BEFORE UPDATE ON public.cronograma_itens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materiais_updated_at
  BEFORE UPDATE ON public.materiais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_diario_log_updated_at
  BEFORE UPDATE ON public.diario_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para subtrair estoque ao registrar consumo
CREATE OR REPLACE FUNCTION public.subtrair_estoque_consumo()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.materiais
  SET qtd_atual = qtd_atual - NEW.qtd_consumida
  WHERE id = NEW.material_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_subtrair_estoque
  AFTER INSERT ON public.consumo_diario
  FOR EACH ROW EXECUTE FUNCTION public.subtrair_estoque_consumo();

-- Função para calcular progresso da obra
CREATE OR REPLACE FUNCTION public.calcular_progresso_obra(p_obra_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_items INTEGER;
  items_concluidos INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'concluido')
  INTO total_items, items_concluidos
  FROM public.cronograma_itens
  WHERE obra_id = p_obra_id;
  
  IF total_items = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((items_concluidos::DECIMAL / total_items::DECIMAL) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar progresso quando item muda
CREATE OR REPLACE FUNCTION public.atualizar_progresso_obra()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.obras
  SET progresso = public.calcular_progresso_obra(COALESCE(NEW.obra_id, OLD.obra_id))
  WHERE id = COALESCE(NEW.obra_id, OLD.obra_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_atualizar_progresso_insert
  AFTER INSERT ON public.cronograma_itens
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_progresso_obra();

CREATE TRIGGER trigger_atualizar_progresso_update
  AFTER UPDATE ON public.cronograma_itens
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_progresso_obra();

CREATE TRIGGER trigger_atualizar_progresso_delete
  AFTER DELETE ON public.cronograma_itens
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_progresso_obra();

-- Criar buckets de storage para fotos
INSERT INTO storage.buckets (id, name, public) VALUES ('obras-fotos', 'obras-fotos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('diario-fotos', 'diario-fotos', true);

-- Políticas de storage para fotos de obras
CREATE POLICY "Authenticated users can upload obra photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'obras-fotos');

CREATE POLICY "Anyone can view obra photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'obras-fotos');

CREATE POLICY "Users can update own obra photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'obras-fotos');

CREATE POLICY "Users can delete own obra photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'obras-fotos');

-- Políticas de storage para fotos do diário
CREATE POLICY "Authenticated users can upload diario photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'diario-fotos');

CREATE POLICY "Anyone can view diario photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'diario-fotos');

CREATE POLICY "Users can update own diario photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'diario-fotos');

CREATE POLICY "Users can delete own diario photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'diario-fotos');