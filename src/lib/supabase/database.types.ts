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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {

      accounts_payable: {
        Row: {
          amount: number
          attachment_url: string | null
          bank_account_id: string | null
          category_id: string | null
          competence_date: string
          cost_center_id: string | null
          created_at: string
          description: string
          due_date: string
          empresa_id: string
          fine_amount: number
          fornecedor_id: string | null
          id: string
          installment_number: number
          installment_total: number
          interest_amount: number
          metadata: Json
          notes: string | null
          paid_amount: number
          paid_at: string | null
          parent_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          bank_account_id?: string | null
          category_id?: string | null
          competence_date: string
          cost_center_id?: string | null
          created_at?: string
          description: string
          due_date: string
          empresa_id: string
          fine_amount?: number
          fornecedor_id?: string | null
          id?: string
          installment_number?: number
          installment_total?: number
          interest_amount?: number
          metadata?: Json
          notes?: string | null
          paid_amount?: number
          paid_at?: string | null
          parent_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          bank_account_id?: string | null
          category_id?: string | null
          competence_date?: string
          cost_center_id?: string | null
          created_at?: string
          description?: string
          due_date?: string
          empresa_id?: string
          fine_amount?: number
          fornecedor_id?: string | null
          id?: string
          installment_number?: number
          installment_total?: number
          interest_amount?: number
          metadata?: Json
          notes?: string | null
          paid_amount?: number
          paid_at?: string | null
          parent_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      accounts_receivable: {
        Row: {
          amount: number
          auto_settle: boolean
          bank_account_id: string | null
          category_id: string | null
          cliente_id: string | null
          competence_date: string
          cost_center_id: string | null
          created_at: string
          description: string
          due_date: string
          empresa_id: string
          fine_amount: number
          id: string
          installment_number: number
          installment_total: number
          interest_amount: number
          metadata: Json
          notes: string | null
          parent_id: string | null
          pedido_id: string | null
          received_amount: number
          received_at: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          auto_settle?: boolean
          bank_account_id?: string | null
          category_id?: string | null
          cliente_id?: string | null
          competence_date: string
          cost_center_id?: string | null
          created_at?: string
          description: string
          due_date: string
          empresa_id: string
          fine_amount?: number
          id?: string
          installment_number?: number
          installment_total?: number
          interest_amount?: number
          metadata?: Json
          notes?: string | null
          parent_id?: string | null
          pedido_id?: string | null
          received_amount?: number
          received_at?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          auto_settle?: boolean
          bank_account_id?: string | null
          category_id?: string | null
          cliente_id?: string | null
          competence_date?: string
          cost_center_id?: string | null
          created_at?: string
          description?: string
          due_date?: string
          empresa_id?: string
          fine_amount?: number
          id?: string
          installment_number?: number
          installment_total?: number
          interest_amount?: number
          metadata?: Json
          notes?: string | null
          parent_id?: string | null
          pedido_id?: string | null
          received_amount?: number
          received_at?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_number: string | null
          active: boolean
          agency: string | null
          bank_name: string | null
          created_at: string
          empresa_id: string
          id: string
          name: string
          opening_balance: number
          tipo: string
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          active?: boolean
          agency?: string | null
          bank_name?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          name: string
          opening_balance?: number
          tipo?: string
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          active?: boolean
          agency?: string | null
          bank_name?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          name?: string
          opening_balance?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string
          created_at: string
          description: string
          empresa_id: string
          id: string
          metadata: Json
          reconciled: boolean
          reconciled_at: string | null
          reference_id: string | null
          reference_type: string | null
          source: string
          tipo: string
          tx_date: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          created_at?: string
          description: string
          empresa_id: string
          id?: string
          metadata?: Json
          reconciled?: boolean
          reconciled_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          source?: string
          tipo: string
          tx_date: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          created_at?: string
          description?: string
          empresa_id?: string
          id?: string
          metadata?: Json
          reconciled?: boolean
          reconciled_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          source?: string
          tipo?: string
          tx_date?: string
        }
        Relationships: []
      }
      cash_flow: {
        Row: {
          amount: number
          bank_account_id: string | null
          category_id: string | null
          cost_center_id: string | null
          created_at: string
          description: string
          empresa_id: string
          flow_date: string
          id: string
          metadata: Json
          reference_id: string | null
          reference_type: string | null
          tipo: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          category_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          description: string
          empresa_id: string
          flow_date: string
          id?: string
          metadata?: Json
          reference_id?: string | null
          reference_type?: string | null
          tipo: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          category_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          description?: string
          empresa_id?: string
          flow_date?: string
          id?: string
          metadata?: Json
          reference_id?: string | null
          reference_type?: string | null
          tipo?: string
        }
        Relationships: []
      }
      cost_centers: {
        Row: {
          active: boolean
          code: string
          created_at: string
          empresa_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          empresa_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          empresa_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_accounts: {
        Row: {
          active: boolean
          category_id: string | null
          code: string
          cost_center_id: string | null
          created_at: string
          empresa_id: string
          id: string
          name: string
          tipo: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          code: string
          cost_center_id?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          name: string
          tipo: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          code?: string
          cost_center_id?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          name?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          active: boolean
          created_at: string
          empresa_id: string
          id: string
          name: string
          parent_id: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          name: string
          parent_id?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          name?: string
          parent_id?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_forecasts: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          metadata: Json
          period_end: string
          period_start: string
          projected_balance: number
          projected_in: number
          projected_out: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          metadata?: Json
          period_end: string
          period_start: string
          projected_balance?: number
          projected_in?: number
          projected_out?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          metadata?: Json
          period_end?: string
          period_start?: string
          projected_balance?: number
          projected_in?: number
          projected_out?: number
          updated_at?: string
        }
        Relationships: []
      }
      financial_reports: {
        Row: {
          created_at: string
          empresa_id: string
          generated_by: string | null
          id: string
          payload: Json
          period_end: string
          period_start: string
          report_type: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          generated_by?: string | null
          id?: string
          payload?: Json
          period_end: string
          period_start: string
          report_type: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          generated_by?: string | null
          id?: string
          payload?: Json
          period_end?: string
          period_start?: string
          report_type?: string
        }
        Relationships: []
      }
      agentes_impressao: {
        Row: {
          ativo: boolean
          atualizado_em: string
          chave_api_hash: string
          criado_em: string
          empresa_id: string
          id: string
          nome: string
          ultimo_ping_em: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          chave_api_hash: string
          criado_em?: string
          empresa_id: string
          id?: string
          nome: string
          ultimo_ping_em?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          chave_api_hash?: string
          criado_em?: string
          empresa_id?: string
          id?: string
          nome?: string
          ultimo_ping_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agentes_impressao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria_eventos: {
        Row: {
          acao: string
          criado_em: string
          empresa_id: string | null
          entidade: string
          id: string
          ip: string | null
          metadados: Json
          papel: string | null
          registro_id: string | null
          user_agent: string | null
          usuario_id: string | null
          valor_anterior: Json | null
          valor_novo: Json | null
        }
        Insert: {
          acao: string
          criado_em?: string
          empresa_id?: string | null
          entidade: string
          id?: string
          ip?: string | null
          metadados?: Json
          papel?: string | null
          registro_id?: string | null
          user_agent?: string | null
          usuario_id?: string | null
          valor_anterior?: Json | null
          valor_novo?: Json | null
        }
        Update: {
          acao?: string
          criado_em?: string
          empresa_id?: string | null
          entidade?: string
          id?: string
          ip?: string | null
          metadados?: Json
          papel?: string | null
          registro_id?: string | null
          user_agent?: string | null
          usuario_id?: string | null
          valor_anterior?: Json | null
          valor_novo?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_eventos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_eventos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      caixa_movimentacoes: {
        Row: {
          caixa_id: string
          criado_em: string
          criado_por: string | null
          empresa_id: string
          forma_pagamento: string | null
          id: string
          observacao: string | null
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: string
          valor: number
        }
        Insert: {
          caixa_id: string
          criado_em?: string
          criado_por?: string | null
          empresa_id: string
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo: string
          valor: number
        }
        Update: {
          caixa_id?: string
          criado_em?: string
          criado_por?: string | null
          empresa_id?: string
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "caixa_movimentacoes_caixa_id_fkey"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixa_movimentacoes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixa_movimentacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      caixas: {
        Row: {
          aberto_em: string
          diferenca: number | null
          empresa_id: string
          fechado_em: string | null
          id: string
          observacoes_abertura: string | null
          observacoes_fechamento: string | null
          operador_id: string
          saldo_esperado: number | null
          saldo_informado: number | null
          saldo_inicial: number
          status: string
        }
        Insert: {
          aberto_em?: string
          diferenca?: number | null
          empresa_id: string
          fechado_em?: string | null
          id?: string
          observacoes_abertura?: string | null
          observacoes_fechamento?: string | null
          operador_id: string
          saldo_esperado?: number | null
          saldo_informado?: number | null
          saldo_inicial?: number
          status?: string
        }
        Update: {
          aberto_em?: string
          diferenca?: number | null
          empresa_id?: string
          fechado_em?: string | null
          id?: string
          observacoes_abertura?: string | null
          observacoes_fechamento?: string | null
          operador_id?: string
          saldo_esperado?: number | null
          saldo_informado?: number | null
          saldo_inicial?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "caixas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixas_operador_id_fkey"
            columns: ["operador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      canais_venda: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          empresa_id: string
          id: string
          nome: string
          taxa_fixa: number
          taxa_percentual: number
          tipo: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          empresa_id: string
          id?: string
          nome: string
          taxa_fixa?: number
          taxa_percentual?: number
          tipo?: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          empresa_id?: string
          id?: string
          nome?: string
          taxa_fixa?: number
          taxa_percentual?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "canais_venda_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_ingredientes: {
        Row: {
          created_at: string
          descricao: string | null
          empresa_id: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_ingredientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          documento: string | null
          email: string | null
          empresa_id: string
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          preferencias: string | null
          segmento: string | null
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          documento?: string | null
          email?: string | null
          empresa_id: string
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          preferencias?: string | null
          segmento?: string | null
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          documento?: string | null
          email?: string | null
          empresa_id?: string
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          preferencias?: string | null
          segmento?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      comandas: {
        Row: {
          aberta_em: string
          empresa_id: string
          fechada_em: string | null
          id: string
          mesa_id: string | null
          quantidade_pessoas: number | null
          responsavel_id: string | null
          status: string
        }
        Insert: {
          aberta_em?: string
          empresa_id: string
          fechada_em?: string | null
          id?: string
          mesa_id?: string | null
          quantidade_pessoas?: number | null
          responsavel_id?: string | null
          status?: string
        }
        Update: {
          aberta_em?: string
          empresa_id?: string
          fechada_em?: string | null
          id?: string
          mesa_id?: string | null
          quantidade_pessoas?: number | null
          responsavel_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "comandas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contadores_pedidos: {
        Row: {
          empresa_id: string
          proximo_numero: number
        }
        Insert: {
          empresa_id: string
          proximo_numero?: number
        }
        Update: {
          empresa_id?: string
          proximo_numero?: number
        }
        Relationships: [
          {
            foreignKeyName: "contadores_pedidos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      custos_fixos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          categoria: string
          criado_em: string
          empresa_id: string
          id: string
          nome: string
          valor_mensal: number
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          categoria?: string
          criado_em?: string
          empresa_id: string
          id?: string
          nome: string
          valor_mensal: number
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          categoria?: string
          criado_em?: string
          empresa_id?: string
          id?: string
          nome?: string
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "custos_fixos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      custos_variaveis: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          empresa_id: string
          id: string
          nome: string
          tipo: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          empresa_id: string
          id?: string
          nome: string
          tipo: string
          valor: number
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          empresa_id?: string
          id?: string
          nome?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "custos_variaveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          bloquear_venda_sem_estoque: boolean
          created_at: string
          id: string
          margem_contribuicao_padrao: number | null
          nome: string
          tipo_negocio: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          bloquear_venda_sem_estoque?: boolean
          created_at?: string
          id?: string
          margem_contribuicao_padrao?: number | null
          nome: string
          tipo_negocio?: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          bloquear_venda_sem_estoque?: boolean
          created_at?: string
          id?: string
          margem_contribuicao_padrao?: number | null
          nome?: string
          tipo_negocio?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entregadores: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          empresa_id: string
          id: string
          nome: string
          telefone: string | null
          veiculo: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          empresa_id: string
          id?: string
          nome: string
          telefone?: string | null
          veiculo?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          empresa_id?: string
          id?: string
          nome?: string
          telefone?: string | null
          veiculo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entregadores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_inventario_itens: {
        Row: {
          id: string
          ingrediente_id: string
          inventario_id: string
          quantidade_contada: number | null
          quantidade_sistema: number
        }
        Insert: {
          id?: string
          ingrediente_id: string
          inventario_id: string
          quantidade_contada?: number | null
          quantidade_sistema?: number
        }
        Update: {
          id?: string
          ingrediente_id?: string
          inventario_id?: string
          quantidade_contada?: number | null
          quantidade_sistema?: number
        }
        Relationships: [
          {
            foreignKeyName: "estoque_inventario_itens_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_inventario_itens_inventario_id_fkey"
            columns: ["inventario_id"]
            isOneToOne: false
            referencedRelation: "estoque_inventarios"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_inventarios: {
        Row: {
          concluido_em: string | null
          criado_em: string
          criado_por: string | null
          empresa_id: string
          id: string
          nome: string
          status: string
        }
        Insert: {
          concluido_em?: string | null
          criado_em?: string
          criado_por?: string | null
          empresa_id: string
          id?: string
          nome: string
          status?: string
        }
        Update: {
          concluido_em?: string | null
          criado_em?: string
          criado_por?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_inventarios_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_inventarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_lotes: {
        Row: {
          created_at: string
          custo_unitario: number
          data_entrada: string
          data_validade: string | null
          empresa_id: string
          id: string
          ingrediente_id: string
          numero_lote: string | null
          quantidade_atual: number
          quantidade_inicial: number
        }
        Insert: {
          created_at?: string
          custo_unitario: number
          data_entrada?: string
          data_validade?: string | null
          empresa_id: string
          id?: string
          ingrediente_id: string
          numero_lote?: string | null
          quantidade_atual: number
          quantidade_inicial: number
        }
        Update: {
          created_at?: string
          custo_unitario?: number
          data_entrada?: string
          data_validade?: string | null
          empresa_id?: string
          id?: string
          ingrediente_id?: string
          numero_lote?: string | null
          quantidade_atual?: number
          quantidade_inicial?: number
        }
        Relationships: [
          {
            foreignKeyName: "estoque_lotes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_lotes_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_movimentacoes: {
        Row: {
          criado_em: string
          criado_por: string | null
          custo_unitario: number
          empresa_id: string
          id: string
          ingrediente_id: string
          lote_id: string | null
          observacao: string | null
          quantidade: number
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          custo_unitario: number
          empresa_id: string
          id?: string
          ingrediente_id: string
          lote_id?: string | null
          observacao?: string | null
          quantidade: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo: string
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          custo_unitario?: number
          empresa_id?: string
          id?: string
          ingrediente_id?: string
          lote_id?: string | null
          observacao?: string | null
          quantidade?: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentacoes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "estoque_lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_saldos: {
        Row: {
          atualizado_em: string
          custo_medio_ponderado: number
          empresa_id: string
          ingrediente_id: string
          quantidade_total: number
        }
        Insert: {
          atualizado_em?: string
          custo_medio_ponderado?: number
          empresa_id: string
          ingrediente_id: string
          quantidade_total?: number
        }
        Update: {
          atualizado_em?: string
          custo_medio_ponderado?: number
          empresa_id?: string
          ingrediente_id?: string
          quantidade_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "estoque_saldos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_saldos_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
        ]
      }
      etiquetas_impressas: {
        Row: {
          codigo_interno: string
          criado_por: string | null
          emitido_em: string
          empresa_id: string
          fila_impressao_id: string | null
          id: string
          lote_id: string | null
          quantidade_etiquetas: number
          responsavel_id: string | null
          tamanho: string
        }
        Insert: {
          codigo_interno: string
          criado_por?: string | null
          emitido_em?: string
          empresa_id: string
          fila_impressao_id?: string | null
          id?: string
          lote_id?: string | null
          quantidade_etiquetas?: number
          responsavel_id?: string | null
          tamanho?: string
        }
        Update: {
          codigo_interno?: string
          criado_por?: string | null
          emitido_em?: string
          empresa_id?: string
          fila_impressao_id?: string | null
          id?: string
          lote_id?: string | null
          quantidade_etiquetas?: number
          responsavel_id?: string | null
          tamanho?: string
        }
        Relationships: [
          {
            foreignKeyName: "etiquetas_impressas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etiquetas_impressas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etiquetas_impressas_fila_impressao_id_fkey"
            columns: ["fila_impressao_id"]
            isOneToOne: false
            referencedRelation: "fila_impressao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etiquetas_impressas_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "estoque_lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etiquetas_impressas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expedicoes: {
        Row: {
          criado_em: string
          empresa_id: string
          entregador_id: string | null
          horario_entrega: string | null
          horario_saida: string | null
          id: string
          observacoes: string | null
          pedido_id: string
          responsavel_id: string | null
          status: string
        }
        Insert: {
          criado_em?: string
          empresa_id: string
          entregador_id?: string | null
          horario_entrega?: string | null
          horario_saida?: string | null
          id?: string
          observacoes?: string | null
          pedido_id: string
          responsavel_id?: string | null
          status?: string
        }
        Update: {
          criado_em?: string
          empresa_id?: string
          entregador_id?: string | null
          horario_entrega?: string | null
          horario_saida?: string | null
          id?: string
          observacoes?: string | null
          pedido_id?: string
          responsavel_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "expedicoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedicoes_entregador_id_fkey"
            columns: ["entregador_id"]
            isOneToOne: false
            referencedRelation: "entregadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedicoes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedicoes_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fichas_tecnicas: {
        Row: {
          ativo: boolean
          cmv_percentual: number | null
          created_at: string
          created_by: string | null
          custo_por_porcao: number
          custo_total: number
          disponivel_como_adicional: boolean
          empresa_id: string
          id: string
          margem_contribuicao_percentual: number | null
          margem_contribuicao_percentual_alvo: number | null
          markup_percentual: number | null
          modo_preparo: string | null
          nome: string
          peso_bruto_total: number
          peso_liquido_total: number
          praca_producao_id: string | null
          preco_sugerido: number | null
          preco_venda_praticado: number | null
          rendimento_quantidade: number
          rendimento_unidade_id: string
          tempo_preparo_minutos: number | null
          updated_at: string
          versao_atual: number
        }
        Insert: {
          ativo?: boolean
          cmv_percentual?: number | null
          created_at?: string
          created_by?: string | null
          custo_por_porcao?: number
          custo_total?: number
          disponivel_como_adicional?: boolean
          empresa_id: string
          id?: string
          margem_contribuicao_percentual?: number | null
          margem_contribuicao_percentual_alvo?: number | null
          markup_percentual?: number | null
          modo_preparo?: string | null
          nome: string
          peso_bruto_total?: number
          peso_liquido_total?: number
          praca_producao_id?: string | null
          preco_sugerido?: number | null
          preco_venda_praticado?: number | null
          rendimento_quantidade: number
          rendimento_unidade_id: string
          tempo_preparo_minutos?: number | null
          updated_at?: string
          versao_atual?: number
        }
        Update: {
          ativo?: boolean
          cmv_percentual?: number | null
          created_at?: string
          created_by?: string | null
          custo_por_porcao?: number
          custo_total?: number
          disponivel_como_adicional?: boolean
          empresa_id?: string
          id?: string
          margem_contribuicao_percentual?: number | null
          margem_contribuicao_percentual_alvo?: number | null
          markup_percentual?: number | null
          modo_preparo?: string | null
          nome?: string
          peso_bruto_total?: number
          peso_liquido_total?: number
          praca_producao_id?: string | null
          preco_sugerido?: number | null
          preco_venda_praticado?: number | null
          rendimento_quantidade?: number
          rendimento_unidade_id?: string
          tempo_preparo_minutos?: number | null
          updated_at?: string
          versao_atual?: number
        }
        Relationships: [
          {
            foreignKeyName: "fichas_tecnicas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_tecnicas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_tecnicas_praca_producao_id_fkey"
            columns: ["praca_producao_id"]
            isOneToOne: false
            referencedRelation: "pracas_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_tecnicas_rendimento_unidade_id_fkey"
            columns: ["rendimento_unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["id"]
          },
        ]
      }
      fichas_tecnicas_itens: {
        Row: {
          created_at: string
          custo_total_item: number | null
          custo_unitario_utilizado: number
          ficha_tecnica_id: string
          id: string
          ingrediente_id: string
          ordem: number
          percentual_perda: number
          peso_bruto: number
          peso_liquido: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custo_total_item?: number | null
          custo_unitario_utilizado?: number
          ficha_tecnica_id: string
          id?: string
          ingrediente_id: string
          ordem?: number
          percentual_perda?: number
          peso_bruto: number
          peso_liquido?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custo_total_item?: number | null
          custo_unitario_utilizado?: number
          ficha_tecnica_id?: string
          id?: string
          ingrediente_id?: string
          ordem?: number
          percentual_perda?: number
          peso_bruto?: number
          peso_liquido?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fichas_tecnicas_itens_ficha_tecnica_id_fkey"
            columns: ["ficha_tecnica_id"]
            isOneToOne: false
            referencedRelation: "fichas_tecnicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_tecnicas_itens_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
        ]
      }
      fichas_tecnicas_versoes: {
        Row: {
          criado_em: string
          criado_por: string | null
          ficha_tecnica_id: string
          id: string
          motivo: string | null
          numero_versao: number
          snapshot: Json
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          ficha_tecnica_id: string
          id?: string
          motivo?: string | null
          numero_versao: number
          snapshot: Json
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          ficha_tecnica_id?: string
          id?: string
          motivo?: string | null
          numero_versao?: number
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "fichas_tecnicas_versoes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_tecnicas_versoes_ficha_tecnica_id_fkey"
            columns: ["ficha_tecnica_id"]
            isOneToOne: false
            referencedRelation: "fichas_tecnicas"
            referencedColumns: ["id"]
          },
        ]
      }
      fila_impressao: {
        Row: {
          atualizado_em: string
          criado_em: string
          criado_por: string | null
          empresa_id: string
          erro_mensagem: string | null
          id: string
          payload: Json
          processado_em: string | null
          referencia_id: string | null
          referencia_tipo: string | null
          status: string
          tentativas: number
          tipo: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          empresa_id: string
          erro_mensagem?: string | null
          id?: string
          payload: Json
          processado_em?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          status?: string
          tentativas?: number
          tipo?: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          empresa_id?: string
          erro_mensagem?: string | null
          id?: string
          payload?: Json
          processado_em?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          status?: string
          tentativas?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "fila_impressao_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_impressao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedor_ingredientes: {
        Row: {
          atualizado_em: string
          empresa_id: string
          fornecedor_id: string
          id: string
          ingrediente_id: string
          preco_unitario: number
        }
        Insert: {
          atualizado_em?: string
          empresa_id: string
          fornecedor_id: string
          id?: string
          ingrediente_id: string
          preco_unitario: number
        }
        Update: {
          atualizado_em?: string
          empresa_id?: string
          fornecedor_id?: string
          id?: string
          ingrediente_id?: string
          preco_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "fornecedor_ingredientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fornecedor_ingredientes_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fornecedor_ingredientes_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          created_at: string
          documento: string | null
          email: string | null
          empresa_id: string
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          documento?: string | null
          email?: string | null
          empresa_id: string
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          documento?: string | null
          email?: string | null
          empresa_id?: string
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          ativo: boolean
          atualizado_em: string
          beneficios_mensais: number
          carga_horaria_semanal: number
          cargo: string | null
          criado_em: string
          empresa_id: string
          id: string
          nome: string
          observacoes: string | null
          percentual_encargos: number
          salario_bruto: number
          tipo_contrato: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          beneficios_mensais?: number
          carga_horaria_semanal?: number
          cargo?: string | null
          criado_em?: string
          empresa_id: string
          id?: string
          nome: string
          observacoes?: string | null
          percentual_encargos?: number
          salario_bruto: number
          tipo_contrato?: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          beneficios_mensais?: number
          carga_horaria_semanal?: number
          cargo?: string | null
          criado_em?: string
          empresa_id?: string
          id?: string
          nome?: string
          observacoes?: string | null
          percentual_encargos?: number
          salario_bruto?: number
          tipo_contrato?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }

      integration_credentials: {
        Row: {
          ciphertext: string
          created_at: string
          empresa_id: string
          id: string
          integration_id: string
          key_version: number
          updated_at: string
        }
        Insert: {
          ciphertext: string
          created_at?: string
          empresa_id: string
          id?: string
          integration_id: string
          key_version?: number
          updated_at?: string
        }
        Update: {
          ciphertext?: string
          created_at?: string
          empresa_id?: string
          id?: string
          integration_id?: string
          key_version?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_credentials_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_credentials_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: true
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_events: {
        Row: {
          created_at: string
          empresa_id: string
          event_type: string
          id: string
          integration_id: string | null
          payload: Json
        }
        Insert: {
          created_at?: string
          empresa_id: string
          event_type: string
          id?: string
          integration_id?: string | null
          payload?: Json
        }
        Update: {
          created_at?: string
          empresa_id?: string
          event_type?: string
          id?: string
          integration_id?: string | null
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "integration_events_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_events_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_failures: {
        Row: {
          attempt: number
          created_at: string
          empresa_id: string
          error_message: string
          id: string
          integration_id: string | null
          metadata: Json
          operation: string
          response_ms: number | null
        }
        Insert: {
          attempt?: number
          created_at?: string
          empresa_id: string
          error_message: string
          id?: string
          integration_id?: string | null
          metadata?: Json
          operation: string
          response_ms?: number | null
        }
        Update: {
          attempt?: number
          created_at?: string
          empresa_id?: string
          error_message?: string
          id?: string
          integration_id?: string | null
          metadata?: Json
          operation?: string
          response_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_failures_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_failures_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          empresa_id: string
          event_type: string
          id: string
          integration_id: string | null
          level: string
          message: string
          payload: Json
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          empresa_id: string
          event_type: string
          id?: string
          integration_id?: string | null
          level: string
          message: string
          payload?: Json
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          empresa_id?: string
          event_type?: string
          id?: string
          integration_id?: string | null
          level?: string
          message?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_syncs: {
        Row: {
          duration_ms: number | null
          empresa_id: string
          error_message: string | null
          finished_at: string | null
          id: string
          integration_id: string | null
          items_count: number
          metadata: Json
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          duration_ms?: number | null
          empresa_id: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          integration_id?: string | null
          items_count?: number
          metadata?: Json
          started_at?: string
          status: string
          sync_type: string
        }
        Update: {
          duration_ms?: number | null
          empresa_id?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          integration_id?: string | null
          items_count?: number
          metadata?: Json
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_syncs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_syncs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_webhooks: {
        Row: {
          created_at: string
          empresa_id: string | null
          error_message: string | null
          id: string
          integration_id: string | null
          payload: Json
          processed: boolean
          provider: string
          signature_valid: boolean
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          error_message?: string | null
          id?: string
          integration_id?: string | null
          payload: Json
          processed?: boolean
          provider: string
          signature_valid?: boolean
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          error_message?: string | null
          id?: string
          integration_id?: string | null
          payload?: Json
          processed?: boolean
          provider?: string
          signature_valid?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "integration_webhooks_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_webhooks_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          category: string
          config: Json
          created_at: string
          empresa_id: string
          id: string
          last_error: string | null
          last_sync_at: string | null
          last_test_at: string | null
          metadata: Json
          provider: string
          status: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          category: string
          config?: Json
          created_at?: string
          empresa_id: string
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          last_test_at?: string | null
          metadata?: Json
          provider: string
          status?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          category?: string
          config?: Json
          created_at?: string
          empresa_id?: string
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          last_test_at?: string | null
          metadata?: Json
          provider?: string
          status?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredientes: {
        Row: {
          ativo: boolean
          categoria_id: string | null
          created_at: string
          custo_unitario_atual: number
          empresa_id: string
          estoque_minimo: number
          id: string
          nome: string
          unidade_medida_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          custo_unitario_atual?: number
          empresa_id: string
          estoque_minimo?: number
          id?: string
          nome: string
          unidade_medida_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          custo_unitario_atual?: number
          empresa_id?: string
          estoque_minimo?: number
          id?: string
          nome?: string
          unidade_medida_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredientes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredientes_unidade_medida_id_fkey"
            columns: ["unidade_medida_id"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredientes_historico_precos: {
        Row: {
          criado_por: string | null
          custo_unitario: number
          data_referencia: string
          id: string
          ingrediente_id: string
          observacao: string | null
        }
        Insert: {
          criado_por?: string | null
          custo_unitario: number
          data_referencia?: string
          id?: string
          ingrediente_id: string
          observacao?: string | null
        }
        Update: {
          criado_por?: string | null
          custo_unitario?: number
          data_referencia?: string
          id?: string
          ingrediente_id?: string
          observacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredientes_historico_precos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredientes_historico_precos_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
        ]
      }
      integracoes_canais: {
        Row: {
          atualizado_em: string
          conectado_em: string | null
          credenciais_criptografadas: string | null
          criado_em: string
          empresa_id: string
          id: string
          metadata: Json
          provedor: string
          status_conexao: string
        }
        Insert: {
          atualizado_em?: string
          conectado_em?: string | null
          credenciais_criptografadas?: string | null
          criado_em?: string
          empresa_id: string
          id?: string
          metadata?: Json
          provedor: string
          status_conexao?: string
        }
        Update: {
          atualizado_em?: string
          conectado_em?: string | null
          credenciais_criptografadas?: string | null
          criado_em?: string
          empresa_id?: string
          id?: string
          metadata?: Json
          provedor?: string
          status_conexao?: string
        }
        Relationships: [
          {
            foreignKeyName: "integracoes_canais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      integracoes_logs_sincronizacao: {
        Row: {
          criado_em: string
          empresa_id: string
          id: string
          integracao_id: string | null
          mensagem: string | null
          payload_resumo: Json | null
          status: string
          tipo_evento: string
        }
        Insert: {
          criado_em?: string
          empresa_id: string
          id?: string
          integracao_id?: string | null
          mensagem?: string | null
          payload_resumo?: Json | null
          status: string
          tipo_evento: string
        }
        Update: {
          criado_em?: string
          empresa_id?: string
          id?: string
          integracao_id?: string | null
          mensagem?: string | null
          payload_resumo?: Json | null
          status?: string
          tipo_evento?: string
        }
        Relationships: [
          {
            foreignKeyName: "integracoes_logs_sincronizacao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integracoes_logs_sincronizacao_integracao_id_fkey"
            columns: ["integracao_id"]
            isOneToOne: false
            referencedRelation: "integracoes_canais"
            referencedColumns: ["id"]
          },
        ]
      }
      integracoes_webhooks_recebidos: {
        Row: {
          assinatura_valida: boolean
          criado_em: string
          empresa_id: string | null
          erro_mensagem: string | null
          id: string
          payload: Json
          processado: boolean
          provedor: string
        }
        Insert: {
          assinatura_valida?: boolean
          criado_em?: string
          empresa_id?: string | null
          erro_mensagem?: string | null
          id?: string
          payload: Json
          processado?: boolean
          provedor: string
        }
        Update: {
          assinatura_valida?: boolean
          criado_em?: string
          empresa_id?: string | null
          erro_mensagem?: string | null
          id?: string
          payload?: Json
          processado?: boolean
          provedor?: string
        }
        Relationships: [
          {
            foreignKeyName: "integracoes_webhooks_recebidos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      kds_config: {
        Row: {
          alerta_atraso_minutos: number
          alerta_sonoro: boolean
          atualizado_em: string
          criado_em: string
          empresa_id: string
          impressao_automatica: boolean
          prioridade_entrega_boost: number
        }
        Insert: {
          alerta_atraso_minutos?: number
          alerta_sonoro?: boolean
          atualizado_em?: string
          criado_em?: string
          empresa_id: string
          impressao_automatica?: boolean
          prioridade_entrega_boost?: number
        }
        Update: {
          alerta_atraso_minutos?: number
          alerta_sonoro?: boolean
          atualizado_em?: string
          criado_em?: string
          empresa_id?: string
          impressao_automatica?: boolean
          prioridade_entrega_boost?: number
        }
        Relationships: [
          {
            foreignKeyName: "kds_config_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      kds_events: {
        Row: {
          criado_em: string
          criado_por: string | null
          empresa_id: string
          evento: string
          id: string
          metadados: Json
          pedido_id: string
          pedido_item_id: string | null
          praca_producao_id: string | null
          setor: string | null
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          empresa_id: string
          evento: string
          id?: string
          metadados?: Json
          pedido_id: string
          pedido_item_id?: string | null
          praca_producao_id?: string | null
          setor?: string | null
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          empresa_id?: string
          evento?: string
          id?: string
          metadados?: Json
          pedido_id?: string
          pedido_item_id?: string | null
          praca_producao_id?: string | null
          setor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kds_events_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kds_events_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kds_events_pedido_item_id_fkey"
            columns: ["pedido_item_id"]
            isOneToOne: false
            referencedRelation: "pedido_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kds_events_praca_producao_id_fkey"
            columns: ["praca_producao_id"]
            isOneToOne: false
            referencedRelation: "pracas_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kds_events_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listas_compra: {
        Row: {
          criado_em: string
          criado_por: string | null
          data_fim_referencia: string
          data_inicio_referencia: string
          empresa_id: string
          id: string
          nome: string
          status: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          data_fim_referencia: string
          data_inicio_referencia: string
          empresa_id: string
          id?: string
          nome: string
          status?: string
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          data_fim_referencia?: string
          data_inicio_referencia?: string
          empresa_id?: string
          id?: string
          nome?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "listas_compra_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listas_compra_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      listas_compra_itens: {
        Row: {
          fornecedor_id: string | null
          id: string
          ingrediente_id: string
          lista_id: string
          preco_unitario_previsto: number
          quantidade_sugerida: number
          valor_previsto: number | null
        }
        Insert: {
          fornecedor_id?: string | null
          id?: string
          ingrediente_id: string
          lista_id: string
          preco_unitario_previsto?: number
          quantidade_sugerida: number
          valor_previsto?: number | null
        }
        Update: {
          fornecedor_id?: string | null
          id?: string
          ingrediente_id?: string
          lista_id?: string
          preco_unitario_previsto?: number
          quantidade_sugerida?: number
          valor_previsto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listas_compra_itens_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listas_compra_itens_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listas_compra_itens_lista_id_fkey"
            columns: ["lista_id"]
            isOneToOne: false
            referencedRelation: "listas_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      membros_empresa: {
        Row: {
          ativo: boolean
          atualizado_em: string
          convidado_por: string | null
          criado_em: string
          empresa_id: string
          id: string
          papel: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          convidado_por?: string | null
          criado_em?: string
          empresa_id: string
          id?: string
          papel?: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          convidado_por?: string | null
          criado_em?: string
          empresa_id?: string
          id?: string
          papel?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membros_empresa_convidado_por_fkey"
            columns: ["convidado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membros_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membros_empresa_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mesas: {
        Row: {
          atualizado_em: string
          capacidade: number | null
          criado_em: string
          empresa_id: string
          id: string
          identificador: string
          status: string
        }
        Insert: {
          atualizado_em?: string
          capacidade?: number | null
          criado_em?: string
          empresa_id: string
          id?: string
          identificador: string
          status?: string
        }
        Update: {
          atualizado_em?: string
          capacidade?: number | null
          criado_em?: string
          empresa_id?: string
          id?: string
          identificador?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mesas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_vendas: {
        Row: {
          atualizado_em: string
          criado_em: string
          empresa_id: string
          id: string
          mes_referencia: string
          observacao: string | null
          quantidade_meta: number | null
          valor_meta_receita: number
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          empresa_id: string
          id?: string
          mes_referencia: string
          observacao?: string | null
          quantidade_meta?: number | null
          valor_meta_receita: number
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          empresa_id?: string
          id?: string
          mes_referencia?: string
          observacao?: string | null
          quantidade_meta?: number | null
          valor_meta_receita?: number
        }
        Relationships: [
          {
            foreignKeyName: "metas_vendas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          caixa_id: string | null
          criado_em: string
          criado_por: string | null
          empresa_id: string
          forma_pagamento: string
          id: string
          observacao: string | null
          pedido_id: string
          troco_para: number | null
          valor: number
        }
        Insert: {
          caixa_id?: string | null
          criado_em?: string
          criado_por?: string | null
          empresa_id: string
          forma_pagamento: string
          id?: string
          observacao?: string | null
          pedido_id: string
          troco_para?: number | null
          valor: number
        }
        Update: {
          caixa_id?: string | null
          criado_em?: string
          criado_por?: string | null
          empresa_id?: string
          forma_pagamento?: string
          id?: string
          observacao?: string | null
          pedido_id?: string
          troco_para?: number | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_caixa_id_fkey"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_item_adicionais: {
        Row: {
          criado_em: string
          custo_unitario_snapshot: number
          empresa_id: string
          ficha_tecnica_id: string
          id: string
          pedido_item_id: string
          preco_unitario_praticado: number
          quantidade: number
          valor_total: number | null
        }
        Insert: {
          criado_em?: string
          custo_unitario_snapshot?: number
          empresa_id: string
          ficha_tecnica_id: string
          id?: string
          pedido_item_id: string
          preco_unitario_praticado?: number
          quantidade: number
          valor_total?: number | null
        }
        Update: {
          criado_em?: string
          custo_unitario_snapshot?: number
          empresa_id?: string
          ficha_tecnica_id?: string
          id?: string
          pedido_item_id?: string
          preco_unitario_praticado?: number
          quantidade?: number
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_item_adicionais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_item_adicionais_ficha_tecnica_id_fkey"
            columns: ["ficha_tecnica_id"]
            isOneToOne: false
            referencedRelation: "fichas_tecnicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_item_adicionais_pedido_item_id_fkey"
            columns: ["pedido_item_id"]
            isOneToOne: false
            referencedRelation: "pedido_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_itens: {
        Row: {
          criado_em: string
          custo_unitario_snapshot: number
          desconto_valor: number
          empresa_id: string
          ficha_tecnica_id: string
          id: string
          observacao: string | null
          ordem: number
          pedido_id: string
          preco_unitario_praticado: number
          preparo_iniciado_em: string | null
          pronto_em: string | null
          quantidade: number
          status_preparo: string
          valor_total: number | null
        }
        Insert: {
          criado_em?: string
          custo_unitario_snapshot?: number
          desconto_valor?: number
          empresa_id: string
          ficha_tecnica_id: string
          id?: string
          observacao?: string | null
          ordem?: number
          pedido_id: string
          preco_unitario_praticado?: number
          preparo_iniciado_em?: string | null
          pronto_em?: string | null
          quantidade: number
          status_preparo?: string
          valor_total?: number | null
        }
        Update: {
          criado_em?: string
          custo_unitario_snapshot?: number
          desconto_valor?: number
          empresa_id?: string
          ficha_tecnica_id?: string
          id?: string
          observacao?: string | null
          ordem?: number
          pedido_id?: string
          preco_unitario_praticado?: number
          preparo_iniciado_em?: string | null
          pronto_em?: string | null
          quantidade?: number
          status_preparo?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_ficha_tecnica_id_fkey"
            columns: ["ficha_tecnica_id"]
            isOneToOne: false
            referencedRelation: "fichas_tecnicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_status_historico: {
        Row: {
          criado_em: string
          criado_por: string | null
          empresa_id: string
          id: string
          motivo: string | null
          pedido_id: string
          status_anterior: string | null
          status_novo: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          empresa_id: string
          id?: string
          motivo?: string | null
          pedido_id: string
          status_anterior?: string | null
          status_novo: string
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          empresa_id?: string
          id?: string
          motivo?: string | null
          pedido_id?: string
          status_anterior?: string | null
          status_novo?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedido_status_historico_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_status_historico_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_status_historico_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          acrescimo_valor: number
          atualizado_em: string
          canal_venda_id: string | null
          cancelado_em: string | null
          cliente_id: string | null
          comanda_id: string | null
          confirmado_em: string | null
          criado_em: string
          criado_por: string | null
          desconto_percentual: number
          desconto_valor_fixo: number
          empresa_id: string
          entregue_em: string | null
          id: string
          motivo_cancelamento: string | null
          numero: number
          observacoes: string | null
          responsavel_id: string | null
          status: string
          subtotal: number
          taxa_entrega: number
          tipo: string
          total: number
        }
        Insert: {
          acrescimo_valor?: number
          atualizado_em?: string
          canal_venda_id?: string | null
          cancelado_em?: string | null
          cliente_id?: string | null
          comanda_id?: string | null
          confirmado_em?: string | null
          criado_em?: string
          criado_por?: string | null
          desconto_percentual?: number
          desconto_valor_fixo?: number
          empresa_id: string
          entregue_em?: string | null
          id?: string
          motivo_cancelamento?: string | null
          numero?: number
          observacoes?: string | null
          responsavel_id?: string | null
          status?: string
          subtotal?: number
          taxa_entrega?: number
          tipo: string
          total?: number
        }
        Update: {
          acrescimo_valor?: number
          atualizado_em?: string
          canal_venda_id?: string | null
          cancelado_em?: string | null
          cliente_id?: string | null
          comanda_id?: string | null
          confirmado_em?: string | null
          criado_em?: string
          criado_por?: string | null
          desconto_percentual?: number
          desconto_valor_fixo?: number
          empresa_id?: string
          entregue_em?: string | null
          id?: string
          motivo_cancelamento?: string | null
          numero?: number
          observacoes?: string | null
          responsavel_id?: string | null
          status?: string
          subtotal?: number
          taxa_entrega?: number
          tipo?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_canal_venda_id_fkey"
            columns: ["canal_venda_id"]
            isOneToOne: false
            referencedRelation: "canais_venda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_compra: {
        Row: {
          atualizado_em: string
          criado_em: string
          criado_por: string | null
          data_pedido: string
          data_prevista_entrega: string | null
          empresa_id: string
          fornecedor_id: string
          id: string
          observacao: string | null
          solicitacao_origem_id: string | null
          status: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          data_pedido?: string
          data_prevista_entrega?: string | null
          empresa_id: string
          fornecedor_id: string
          id?: string
          observacao?: string | null
          solicitacao_origem_id?: string | null
          status?: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          data_pedido?: string
          data_prevista_entrega?: string | null
          empresa_id?: string
          fornecedor_id?: string
          id?: string
          observacao?: string | null
          solicitacao_origem_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_solicitacao_origem_id_fkey"
            columns: ["solicitacao_origem_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_compra_itens: {
        Row: {
          id: string
          ingrediente_id: string
          pedido_id: string
          preco_unitario: number
          quantidade_pedida: number
          quantidade_recebida: number
          valor_total: number | null
        }
        Insert: {
          id?: string
          ingrediente_id: string
          pedido_id: string
          preco_unitario: number
          quantidade_pedida: number
          quantidade_recebida?: number
          valor_total?: number | null
        }
        Update: {
          id?: string
          ingrediente_id?: string
          pedido_id?: string
          preco_unitario?: number
          quantidade_pedida?: number
          quantidade_recebida?: number
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_itens_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_samples: {
        Row: {
          criado_em: string
          duracao_ms: number
          empresa_id: string | null
          id: string
          metadados: Json
          nome: string
          tipo: string
        }
        Insert: {
          criado_em?: string
          duracao_ms: number
          empresa_id?: string | null
          id?: string
          metadados?: Json
          nome: string
          tipo: string
        }
        Update: {
          criado_em?: string
          duracao_ms?: number
          empresa_id?: string | null
          id?: string
          metadados?: Json
          nome?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_samples_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      pracas_producao: {
        Row: {
          ativo: boolean
          criado_em: string
          empresa_id: string | null
          id: string
          nome: string
          ordem_exibicao: number
          setor: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          empresa_id?: string | null
          id?: string
          nome: string
          ordem_exibicao?: number
          setor?: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          ordem_exibicao?: number
          setor?: string
        }
        Relationships: [
          {
            foreignKeyName: "pracas_producao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      producoes_planejadas: {
        Row: {
          atualizado_em: string
          criado_em: string
          criado_por: string | null
          data_producao: string
          empresa_id: string
          ficha_tecnica_id: string
          id: string
          observacao: string | null
          quantidade_planejada: number
          status: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          data_producao: string
          empresa_id: string
          ficha_tecnica_id: string
          id?: string
          observacao?: string | null
          quantidade_planejada: number
          status?: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          data_producao?: string
          empresa_id?: string
          ficha_tecnica_id?: string
          id?: string
          observacao?: string | null
          quantidade_planejada?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "producoes_planejadas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producoes_planejadas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producoes_planejadas_ficha_tecnica_id_fkey"
            columns: ["ficha_tecnica_id"]
            isOneToOne: false
            referencedRelation: "fichas_tecnicas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nome_completo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nome_completo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome_completo?: string
          updated_at?: string
        }
        Relationships: []
      }
      solicitacoes_compra: {
        Row: {
          atualizado_em: string
          criado_em: string
          criado_por: string | null
          empresa_id: string
          id: string
          observacao: string | null
          status: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          empresa_id: string
          id?: string
          observacao?: string | null
          status?: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          empresa_id?: string
          id?: string
          observacao?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_compra_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_compra_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_compra_itens: {
        Row: {
          id: string
          ingrediente_id: string
          observacao: string | null
          quantidade: number
          solicitacao_id: string
        }
        Insert: {
          id?: string
          ingrediente_id: string
          observacao?: string | null
          quantidade: number
          solicitacao_id: string
        }
        Update: {
          id?: string
          ingrediente_id?: string
          observacao?: string | null
          quantidade?: number
          solicitacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_compra_itens_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_compra_itens_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      system_alerts: {
        Row: {
          criado_em: string
          empresa_id: string
          entidade: string | null
          id: string
          mensagem: string
          metadados: Json
          registro_id: string | null
          resolvido: boolean
          resolvido_em: string | null
          resolvido_por: string | null
          severidade: string
          tipo: string
          titulo: string
        }
        Insert: {
          criado_em?: string
          empresa_id: string
          entidade?: string | null
          id?: string
          mensagem: string
          metadados?: Json
          registro_id?: string | null
          resolvido?: boolean
          resolvido_em?: string | null
          resolvido_por?: string | null
          severidade: string
          tipo: string
          titulo: string
        }
        Update: {
          criado_em?: string
          empresa_id?: string
          entidade?: string | null
          id?: string
          mensagem?: string
          metadados?: Json
          registro_id?: string | null
          resolvido?: boolean
          resolvido_em?: string | null
          resolvido_por?: string | null
          severidade?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_alerts_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_alerts_resolvido_por_fkey"
            columns: ["resolvido_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          criado_em: string
          detalhes: Json
          duracao_ms: number | null
          empresa_id: string | null
          id: string
          mensagem: string
          modulo: string
          nivel: string
          usuario_id: string | null
        }
        Insert: {
          criado_em?: string
          detalhes?: Json
          duracao_ms?: number | null
          empresa_id?: string | null
          id?: string
          mensagem: string
          modulo: string
          nivel: string
          usuario_id?: string | null
        }
        Update: {
          criado_em?: string
          detalhes?: Json
          duracao_ms?: number | null
          empresa_id?: string | null
          id?: string
          mensagem?: string
          modulo?: string
          nivel?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_logs_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades_medida: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: string
          nome: string
          sigla: string
          tipo_grandeza: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome: string
          sigla: string
          tipo_grandeza?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          sigla?: string
          tipo_grandeza?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidades_medida_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          atualizado_em: string
          canal_venda_id: string | null
          cliente_id: string | null
          criado_em: string
          criado_por: string | null
          custo_unitario_snapshot: number
          data_venda: string
          empresa_id: string
          ficha_tecnica_id: string
          id: string
          margem_total: number | null
          observacao: string | null
          preco_unitario_praticado: number
          quantidade: number
          valor_total: number | null
        }
        Insert: {
          atualizado_em?: string
          canal_venda_id?: string | null
          cliente_id?: string | null
          criado_em?: string
          criado_por?: string | null
          custo_unitario_snapshot?: number
          data_venda?: string
          empresa_id: string
          ficha_tecnica_id: string
          id?: string
          margem_total?: number | null
          observacao?: string | null
          preco_unitario_praticado: number
          quantidade: number
          valor_total?: number | null
        }
        Update: {
          atualizado_em?: string
          canal_venda_id?: string | null
          cliente_id?: string | null
          criado_em?: string
          criado_por?: string | null
          custo_unitario_snapshot?: number
          data_venda?: string
          empresa_id?: string
          ficha_tecnica_id?: string
          id?: string
          margem_total?: number | null
          observacao?: string | null
          preco_unitario_praticado?: number
          quantidade?: number
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_canal_venda_id_fkey"
            columns: ["canal_venda_id"]
            isOneToOne: false
            referencedRelation: "canais_venda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_ficha_tecnica_id_fkey"
            columns: ["ficha_tecnica_id"]
            isOneToOne: false
            referencedRelation: "fichas_tecnicas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fn_abrir_caixa: {
        Args: {
          p_empresa_id: string
          p_observacoes?: string
          p_saldo_inicial: number
        }
        Returns: string
      }
      fn_abrir_comanda: {
        Args: { p_mesa_id: string; p_quantidade_pessoas?: number }
        Returns: string
      }
      fn_cancelar_pedido: {
        Args: { p_motivo: string; p_pedido_id: string }
        Returns: undefined
      }
      fn_concluir_inventario: {
        Args: { p_inventario_id: string }
        Returns: undefined
      }
      fn_concluir_pedido: { Args: { p_pedido_id: string }; Returns: undefined }
      fn_concluir_producao: {
        Args: { p_producao_id: string }
        Returns: undefined
      }
      fn_convidar_membro_por_email: {
        Args: {
          p_empresa_id: string
          p_email: string
          p_papel?: string
        }
        Returns: string
      }
      fn_confirmar_pedido: { Args: { p_pedido_id: string }; Returns: undefined }
      fn_converter_lista_em_pedidos: {
        Args: { p_lista_id: string }
        Returns: string[]
      }
      fn_duplicar_ficha_tecnica: {
        Args: { p_ficha_id: string }
        Returns: string
      }
      fn_emitir_etiqueta: {
        Args: {
          p_empresa_id: string
          p_lote_id: string
          p_payload: Json
          p_quantidade_etiquetas: number
          p_tamanho: string
        }
        Returns: string
      }
      fn_empresas_acessiveis: { Args: never; Returns: string[] }
      fn_fechar_caixa: {
        Args: {
          p_caixa_id: string
          p_observacoes?: string
          p_saldo_informado: number
        }
        Returns: undefined
      }
      fn_fechar_comanda: { Args: { p_comanda_id: string }; Returns: undefined }
      fn_gerar_lista_compras: {
        Args: {
          p_data_fim: string
          p_data_inicio: string
          p_empresa_id: string
          p_nome: string
        }
        Returns: string
      }
      fn_avancar_status_pedido: {
        Args: { p_pedido_id: string; p_status_atual: string }
        Returns: undefined
      }
      fn_finalizar_venda_pdv: {
        Args: { p_pedido_id: string }
        Returns: undefined
      }
      fn_iniciar_preparo_pedido: {
        Args: { p_pedido_id: string }
        Returns: undefined
      }
      fn_marcar_item_pronto: {
        Args: { p_pedido_item_id: string }
        Returns: undefined
      }
      fn_marcar_itens_pronto: {
        Args: { p_pedido_id: string; p_praca_producao_id?: string }
        Returns: undefined
      }
      fn_expedir_pedido_kds: {
        Args: { p_pedido_id: string }
        Returns: undefined
      }
      fn_registrar_kds_evento: {
        Args: {
          p_empresa_id: string
          p_pedido_id: string
          p_evento: string
          p_pedido_item_id?: string
          p_setor?: string
          p_praca_producao_id?: string
          p_metadados?: Json
        }
        Returns: string
      }
      fn_seed_kds_config: {
        Args: { p_empresa_id: string }
        Returns: undefined
      }
      fn_papel_na_empresa: {
        Args: { p_empresa_id: string }
        Returns: string
      }
      fn_proximo_numero_pedido: {
        Args: { p_empresa_id: string }
        Returns: number
      }
      fn_recalcular_estoque_saldo: {
        Args: { p_empresa_id: string; p_ingrediente_id: string }
        Returns: undefined
      }
      fn_receber_item_pedido_compra: {
        Args: {
          p_data_validade?: string
          p_numero_lote?: string
          p_pedido_item_id: string
          p_quantidade: number
        }
        Returns: undefined
      }
      fn_seed_financeiro_defaults: { Args: { p_empresa_id: string }; Returns: undefined }
      fn_registrar_auditoria: {
        Args: {
          p_acao: string
          p_empresa_id: string | null
          p_entidade: string
          p_ip?: string
          p_metadados?: Json
          p_registro_id?: string
          p_user_agent?: string
          p_valor_anterior?: Json
          p_valor_novo?: Json
        }
        Returns: string
      }
      fn_registrar_entrada_estoque: {
        Args: {
          p_custo_unitario: number
          p_data_validade?: string
          p_ingrediente_id: string
          p_numero_lote?: string
          p_observacao?: string
          p_quantidade: number
          p_referencia_id?: string
          p_referencia_tipo?: string
        }
        Returns: string
      }
      fn_registrar_movimentacao_caixa: {
        Args: {
          p_caixa_id: string
          p_forma_pagamento?: string
          p_observacao?: string
          p_referencia_id?: string
          p_referencia_tipo?: string
          p_tipo: string
          p_valor: number
        }
        Returns: string
      }
      fn_registrar_pagamento_pedido: {
        Args: {
          p_caixa_id?: string
          p_forma_pagamento: string
          p_observacao?: string
          p_pedido_id: string
          p_troco_para?: number
          p_valor: number
        }
        Returns: string
      }
      fn_registrar_saida_estoque: {
        Args: {
          p_ingrediente_id: string
          p_observacao?: string
          p_quantidade: number
          p_referencia_id?: string
          p_referencia_tipo?: string
          p_tipo?: string
        }
        Returns: undefined
      }
      fn_transferir_comanda_mesa: {
        Args: { p_comanda_id: string; p_nova_mesa_id: string }
        Returns: undefined
      }
      fn_unir_comandas: {
        Args: { p_comanda_destino_id: string; p_comanda_origem_id: string }
        Returns: undefined
      }
      fn_usuario_acessa_empresa: {
        Args: { p_empresa_id: string }
        Returns: boolean
      }
      recalcular_ficha_tecnica: {
        Args: { p_ficha_id: string }
        Returns: undefined
      }
      recalcular_subtotal_pedido: {
        Args: { p_pedido_id: string }
        Returns: undefined
      }
      salvar_ficha_tecnica: {
        Args: {
          p_empresa_id: string
          p_ficha_id: string
          p_itens: Json
          p_margem_contribuicao_percentual_alvo: number
          p_modo_preparo: string
          p_motivo_versao?: string
          p_nome: string
          p_preco_venda_praticado: number
          p_rendimento_quantidade: number
          p_rendimento_unidade_id: string
          p_tempo_preparo_minutos: number
        }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
