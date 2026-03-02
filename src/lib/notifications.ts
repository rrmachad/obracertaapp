import { supabase } from '@/integrations/supabase/client';

type NotificationType = 
  | 'invite_accepted'
  | 'medicao_criada'
  | 'estoque_baixo'
  | 'cronograma_concluido';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export async function createNotification({ userId, type, title, message, data = {} }: CreateNotificationParams) {
  try {
    const { error } = await supabase.rpc('create_notification', {
      _user_id: userId,
      _type: type,
      _title: title,
      _message: message,
      _data: data as any,
    });
    if (error) console.error('Notification error:', error);
  } catch (e) {
    console.error('Failed to create notification:', e);
  }
}

async function sendNotificationEmail(type: NotificationType, obraId: string, details: Record<string, unknown>) {
  try {
    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: { type, obra_id: obraId, details },
    });
    if (error) console.error('Email notification error:', error);
  } catch (e) {
    console.error('Failed to send notification email:', e);
  }
}

/**
 * Notify the obra owner when a new medição is created
 */
export async function notifyMedicaoCriada(obraId: string, itemDescricao: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  const { data: obra } = await supabase
    .from('obras')
    .select('user_id, nome')
    .eq('id', obraId)
    .single();

  if (!obra) return;

  // Don't notify yourself
  if (obra.user_id === user.user.id) return;

  // Get caller's name
  const { data: profile } = await supabase
    .from('profiles')
    .select('nome')
    .eq('user_id', user.user.id)
    .single();

  const callerName = profile?.nome || 'Usuário';

  // In-app notification
  await createNotification({
    userId: obra.user_id,
    type: 'medicao_criada',
    title: 'Nova medição criada',
    message: `${callerName} registrou uma nova medição para "${itemDescricao}" na obra "${obra.nome}".`,
    data: { obra_id: obraId, obra_nome: obra.nome },
  });

  // Email notification
  await sendNotificationEmail('medicao_criada', obraId, {
    item_descricao: itemDescricao,
    criado_por: callerName,
  });
}

/**
 * Notify the obra owner when a material reaches low stock
 */
export async function notifyEstoqueBaixo(obraId: string, materialNome: string, qtdAtual: number, qtdMinima: number) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  const { data: obra } = await supabase
    .from('obras')
    .select('user_id, nome')
    .eq('id', obraId)
    .single();

  if (!obra) return;

  // In-app notification
  await createNotification({
    userId: obra.user_id,
    type: 'estoque_baixo',
    title: 'Estoque baixo ⚠️',
    message: `"${materialNome}" está com ${qtdAtual} un (mínimo: ${qtdMinima}) na obra "${obra.nome}".`,
    data: { obra_id: obraId, material_nome: materialNome, qtd_atual: qtdAtual },
  });

  // Email notification
  await sendNotificationEmail('estoque_baixo', obraId, {
    material_nome: materialNome,
    qtd_atual: qtdAtual,
    qtd_minima: qtdMinima,
  });
}

/**
 * Notify when a cronograma item is completed
 */
export async function notifyCronogramaConcluido(obraId: string, itemDescricao: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  const { data: obra } = await supabase
    .from('obras')
    .select('user_id, nome')
    .eq('id', obraId)
    .single();

  if (!obra) return;

  if (obra.user_id === user.user.id) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome')
    .eq('user_id', user.user.id)
    .single();

  const callerName = profile?.nome || 'Usuário';

  // In-app notification
  await createNotification({
    userId: obra.user_id,
    type: 'cronograma_concluido',
    title: 'Item concluído ✅',
    message: `${callerName} marcou "${itemDescricao}" como concluído na obra "${obra.nome}".`,
    data: { obra_id: obraId, item_descricao: itemDescricao },
  });

  // Email notification
  await sendNotificationEmail('cronograma_concluido', obraId, {
    item_descricao: itemDescricao,
    concluido_por: callerName,
  });
}
