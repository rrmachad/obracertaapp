export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      adiantamentos: {
        Row: {
          abatido_em_medicao_id: string | null
          created_at: string
          data: string
          descricao: string | null
          id: string
          obra_id: string
          updated_at: string
          valor: number
        }
        Insert: {
          abatido_em_medicao_id?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          obra_id: string
          updated_at?: string
          valor: number
        }
        Update: {
          abatido_em_medicao_id?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          obra_id?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "adiantamentos_abatido_em_medicao_id_fkey"
            columns: ["abatido_em_medicao_id"]
            isOneToOne: false
            referencedRelation: "medicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adiantamentos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adiantamentos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adiantamentos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "portal_branding"
            referencedColumns: ["obra_id"]
          },
        ]
      }
      admin_action_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          admin_user_id: string
          created_at: string
          id: string
          target_user_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          admin_user_id: string
          created_at?: string
          id?: string
          target_user_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          target_user_id?: string
        }
        Relationships: []
      }
      consumo_diario: {
        Row: {
          created_at: string
          diario_id: string
          id: string
          material_id: string
          qtd_consumida: number
        }
        Insert: {
          created_at?: string
          diario_id: string
          id?: string
          material_id: string
          qtd_consumida: number
        }
        Update: {
          created_at?: string
          diario_id?: string
          id?: string
          material_id?: string
          qtd_consumida?: number
        }
        Relationships: [
          {
            foreignKeyName: "consumo_diario_diario_id_fkey"
            columns: ["diario_id"]
            isOneToOne: false
            referencedRelation: "diario_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumo_diario_diario_id_fkey"
            columns: ["diario_id"]
            isOneToOne: false
            referencedRelation: "fotos_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumo_diario_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      cronograma_itens: {
        Row: {
          created_at: string
          data_conclusao: string | null
          descricao: string
          fase_id: string
          id: string
          obra_id: string
          observacoes: string | null
          ordem: number | null
          status: Database["public"]["Enums"]["item_status"]
          updated_at: string
          valor_contrato_mao_de_obra: number | null
        }
        Insert: {
          created_at?: string
          data_conclusao?: string | null
          descricao: string
          fase_id: string
          id?: string
          obra_id: string
          observacoes?: string | null
          ordem?: number | null
          status?: Database["public"]["Enums"]["item_status"]
          updated_at?: string
          valor_contrato_mao_de_obra?: number | null
        }
        Update: {
          created_at?: string
          data_conclusao?: string | null
          descricao?: string
          fase_id?: string
          id?: string
          obra_id?: string
          observacoes?: string | null
          ordem?: number | null
          status?: Database["public"]["Enums"]["item_status"]
          updated_at?: string
          valor_contrato_mao_de_obra?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_itens_fase_id_fkey"
            columns: ["fase_id"]
            isOneToOne: false
            referencedRelation: "fases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cronograma_itens_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cronograma_itens_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cronograma_itens_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "portal_branding"
            referencedColumns: ["obra_id"]
          },
        ]
      }
      diario_log: {
        Row: {
          atividades_realizadas: string
          clima: Database["public"]["Enums"]["clima_tipo"]
          created_at: string
          data: string
          equipamentos: Json | null
          fotos: Json | null
          id: string
          obra_id: string
          observacoes: string | null
          profissionais: Json | null
          updated_at: string
        }
        Insert: {
          atividades_realizadas: string
          clima?: Database["public"]["Enums"]["clima_tipo"]
          created_at?: string
          data?: string
          equipamentos?: Json | null
          fotos?: Json | null
          id?: string
          obra_id: string
          observacoes?: string | null
          profissionais?: Json | null
          updated_at?: string
        }
        Update: {
          atividades_realizadas?: string
          clima?: Database["public"]["Enums"]["clima_tipo"]
          created_at?: string
          data?: string
          equipamentos?: Json | null
          fotos?: Json | null
          id?: string
          obra_id?: string
          observacoes?: string | null
          profissionais?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diario_log_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diario_log_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diario_log_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "portal_branding"
            referencedColumns: ["obra_id"]
          },
        ]
      }
      diario_log_alteracoes: {
        Row: {
          campo_alterado: string
          created_at: string
          diario_id: string
          id: string
          motivo: string | null
          user_id: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          campo_alterado: string
          created_at?: string
          diario_id: string
          id?: string
          motivo?: string | null
          user_id: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          campo_alterado?: string
          created_at?: string
          diario_id?: string
          id?: string
          motivo?: string | null
          user_id?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diario_log_alteracoes_diario_id_fkey"
            columns: ["diario_id"]
            isOneToOne: false
            referencedRelation: "diario_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diario_log_alteracoes_diario_id_fkey"
            columns: ["diario_id"]
            isOneToOne: false
            referencedRelation: "fotos_portal"
            referencedColumns: ["id"]
          },
        ]
      }
      fases: {
        Row: {
          created_at: string
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem: number
        }
        Update: {
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      materiais: {
        Row: {
          categoria: string | null
          created_at: string
          data_prevista_chegada: string | null
          id: string
          nome: string
          obra_id: string
          pedido: boolean
          preco_unitario: number | null
          qtd_atual: number
          qtd_minima: number
          unidade: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data_prevista_chegada?: string | null
          id?: string
          nome: string
          obra_id: string
          pedido?: boolean
          preco_unitario?: number | null
          qtd_atual?: number
          qtd_minima?: number
          unidade?: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data_prevista_chegada?: string | null
          id?: string
          nome?: string
          obra_id?: string
          pedido?: boolean
          preco_unitario?: number | null
          qtd_atual?: number
          qtd_minima?: number
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materiais_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiais_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiais_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "portal_branding"
            referencedColumns: ["obra_id"]
          },
        ]
      }
      medicoes: {
        Row: {
          created_at: string
          cronograma_item_id: string | null
          data_medicao: string
          fase_id: string | null
          id: string
          obra_id: string
          observacoes: string | null
          percentual_anterior: number
          percentual_atual: number
          percentual_avanco_periodo: number | null
          retencao_percentual_aplicado: number
          status: string
          updated_at: string
          valor_adiantamentos_descontados: number
          valor_bruto_medido: number
          valor_contrato_referencia: number
          valor_liquido_a_pagar: number
          valor_retencao_tecnica: number
        }
        Insert: {
          created_at?: string
          cronograma_item_id?: string | null
          data_medicao?: string
          fase_id?: string | null
          id?: string
          obra_id: string
          observacoes?: string | null
          percentual_anterior?: number
          percentual_atual?: number
          percentual_avanco_periodo?: number | null
          retencao_percentual_aplicado?: number
          status?: string
          updated_at?: string
          valor_adiantamentos_descontados?: number
          valor_bruto_medido?: number
          valor_contrato_referencia?: number
          valor_liquido_a_pagar?: number
          valor_retencao_tecnica?: number
        }
        Update: {
          created_at?: string
          cronograma_item_id?: string | null
          data_medicao?: string
          fase_id?: string | null
          id?: string
          obra_id?: string
          observacoes?: string | null
          percentual_anterior?: number
          percentual_atual?: number
          percentual_avanco_periodo?: number | null
          retencao_percentual_aplicado?: number
          status?: string
          updated_at?: string
          valor_adiantamentos_descontados?: number
          valor_bruto_medido?: number
          valor_contrato_referencia?: number
          valor_liquido_a_pagar?: number
          valor_retencao_tecnica?: number
        }
        Relationships: [
          {
            foreignKeyName: "medicoes_cronograma_item_id_fkey"
            columns: ["cronograma_item_id"]
            isOneToOne: false
            referencedRelation: "cronograma_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicoes_cronograma_item_id_fkey"
            columns: ["cronograma_item_id"]
            isOneToOne: false
            referencedRelation: "cronograma_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicoes_fase_id_fkey"
            columns: ["fase_id"]
            isOneToOne: false
            referencedRelation: "fases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "portal_branding"
            referencedColumns: ["obra_id"]
          },
        ]
      }
      movimentacao_estoque: {
        Row: {
          created_at: string
          data: string
          id: string
          material_id: string
          observacao: string | null
          quantidade: number
          tipo: string
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          material_id: string
          observacao?: string | null
          quantidade: number
          tipo: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          material_id?: string
          observacao?: string | null
          quantidade?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacao_estoque_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      obra_access: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          obra_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          obra_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          obra_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_access_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_access_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_access_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "portal_branding"
            referencedColumns: ["obra_id"]
          },
        ]
      }
      obra_pin: {
        Row: {
          created_at: string
          id: string
          obra_id: string
          pin_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          obra_id: string
          pin_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          obra_id?: string
          pin_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_pin_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: true
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_pin_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: true
            referencedRelation: "obras_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_pin_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: true
            referencedRelation: "portal_branding"
            referencedColumns: ["obra_id"]
          },
        ]
      }
      obras: {
        Row: {
          created_at: string
          endereco: string
          foto_capa: string | null
          id: string
          nome: string
          portal_ativo: boolean
          progresso: number | null
          retencao_tecnica_percentual: number
          sistema_medidas: string
          status: Database["public"]["Enums"]["obra_status"]
          token_portal: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endereco: string
          foto_capa?: string | null
          id?: string
          nome: string
          portal_ativo?: boolean
          progresso?: number | null
          retencao_tecnica_percentual?: number
          sistema_medidas?: string
          status?: Database["public"]["Enums"]["obra_status"]
          token_portal?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endereco?: string
          foto_capa?: string | null
          id?: string
          nome?: string
          portal_ativo?: boolean
          progresso?: number | null
          retencao_tecnica_percentual?: number
          sistema_medidas?: string
          status?: Database["public"]["Enums"]["obra_status"]
          token_portal?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          blocked: boolean
          created_at: string
          email: string | null
          empresa: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          blocked?: boolean
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          blocked?: boolean
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          max_users: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_users?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_users?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_invites: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          invited_by: string
          obra_id: string
          pin_code: string
          role: Database["public"]["Enums"]["app_role"]
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          invited_by: string
          obra_id: string
          pin_code: string
          role?: Database["public"]["Enums"]["app_role"]
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string
          obra_id?: string
          pin_code?: string
          role?: Database["public"]["Enums"]["app_role"]
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_invites_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invites_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invites_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "portal_branding"
            referencedColumns: ["obra_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          empresa_logo_url: string | null
          empresa_nome: string | null
          id: string
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          empresa_logo_url?: string | null
          empresa_nome?: string | null
          id?: string
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          empresa_logo_url?: string | null
          empresa_nome?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      cronograma_portal: {
        Row: {
          data_conclusao: string | null
          descricao: string | null
          fase_icone: string | null
          fase_id: string | null
          fase_nome: string | null
          fase_ordem: number | null
          id: string | null
          obra_id: string | null
          ordem: number | null
          status: Database["public"]["Enums"]["item_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_itens_fase_id_fkey"
            columns: ["fase_id"]
            isOneToOne: false
            referencedRelation: "fases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cronograma_itens_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cronograma_itens_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cronograma_itens_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "portal_branding"
            referencedColumns: ["obra_id"]
          },
        ]
      }
      fotos_portal: {
        Row: {
          atividades_realizadas: string | null
          data: string | null
          fotos: Json | null
          id: string | null
          obra_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diario_log_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diario_log_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diario_log_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "portal_branding"
            referencedColumns: ["obra_id"]
          },
        ]
      }
      obras_portal: {
        Row: {
          endereco: string | null
          foto_capa: string | null
          id: string | null
          nome: string | null
          portal_ativo: boolean | null
          progresso: number | null
          status: Database["public"]["Enums"]["obra_status"] | null
          token_portal: string | null
        }
        Insert: {
          endereco?: string | null
          foto_capa?: string | null
          id?: string | null
          nome?: string | null
          portal_ativo?: boolean | null
          progresso?: number | null
          status?: Database["public"]["Enums"]["obra_status"] | null
          token_portal?: string | null
        }
        Update: {
          endereco?: string | null
          foto_capa?: string | null
          id?: string | null
          nome?: string | null
          portal_ativo?: boolean | null
          progresso?: number | null
          status?: Database["public"]["Enums"]["obra_status"] | null
          token_portal?: string | null
        }
        Relationships: []
      }
      portal_branding: {
        Row: {
          empresa_logo_url: string | null
          empresa_nome: string | null
          obra_id: string | null
          token_portal: string | null
          whatsapp: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calcular_progresso_obra: { Args: { p_obra_id: string }; Returns: number }
      cleanup_expired_invites: { Args: never; Returns: undefined }
      create_notification: {
        Args: {
          _data?: Json
          _message: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
      generate_pin: { Args: never; Returns: string }
      get_plan_user_limit: {
        Args: { _plan: Database["public"]["Enums"]["subscription_plan"] }
        Returns: number
      }
      has_obra_access: {
        Args: { _obra_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_obra_admin: {
        Args: { _obra_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      clima_tipo: "ensolarado" | "nublado" | "chuvoso" | "parcialmente_nublado"
      item_status: "pendente" | "em_andamento" | "concluido"
      obra_status: "planejamento" | "em_andamento" | "concluida" | "pausada"
      subscription_plan: "free" | "start" | "gold" | "premium"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      clima_tipo: ["ensolarado", "nublado", "chuvoso", "parcialmente_nublado"],
      item_status: ["pendente", "em_andamento", "concluido"],
      obra_status: ["planejamento", "em_andamento", "concluida", "pausada"],
      subscription_plan: ["free", "start", "gold", "premium"],
    },
  },
} as const
