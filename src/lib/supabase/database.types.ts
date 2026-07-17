// Gerado via Supabase MCP (generate_typescript_types) a partir do projeto
// chef-hub-profissional (twvcusuuhtrmnivfuosf). Não editar manualmente —
// regerar sempre que o schema em supabase/migrations mudar.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      canais_venda: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          criado_em: string;
          empresa_id: string;
          id: string;
          nome: string;
          taxa_fixa: number;
          taxa_percentual: number;
          tipo: string;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          criado_em?: string;
          empresa_id: string;
          id?: string;
          nome: string;
          taxa_fixa?: number;
          taxa_percentual?: number;
          tipo?: string;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          criado_em?: string;
          empresa_id?: string;
          id?: string;
          nome?: string;
          taxa_fixa?: number;
          taxa_percentual?: number;
          tipo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "canais_venda_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      categorias_ingredientes: {
        Row: {
          created_at: string;
          descricao: string | null;
          empresa_id: string;
          id: string;
          nome: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          descricao?: string | null;
          empresa_id: string;
          id?: string;
          nome: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          descricao?: string | null;
          empresa_id?: string;
          id?: string;
          nome?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categorias_ingredientes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      custos_fixos: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          categoria: string;
          criado_em: string;
          empresa_id: string;
          id: string;
          nome: string;
          valor_mensal: number;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          categoria?: string;
          criado_em?: string;
          empresa_id: string;
          id?: string;
          nome: string;
          valor_mensal: number;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          categoria?: string;
          criado_em?: string;
          empresa_id?: string;
          id?: string;
          nome?: string;
          valor_mensal?: number;
        };
        Relationships: [
          {
            foreignKeyName: "custos_fixos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      custos_variaveis: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          criado_em: string;
          empresa_id: string;
          id: string;
          nome: string;
          tipo: string;
          valor: number;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          criado_em?: string;
          empresa_id: string;
          id?: string;
          nome: string;
          tipo: string;
          valor: number;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          criado_em?: string;
          empresa_id?: string;
          id?: string;
          nome?: string;
          tipo?: string;
          valor?: number;
        };
        Relationships: [
          {
            foreignKeyName: "custos_variaveis_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      empresas: {
        Row: {
          created_at: string;
          id: string;
          margem_contribuicao_padrao: number | null;
          nome: string;
          tipo_negocio: string;
          updated_at: string;
          usuario_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          margem_contribuicao_padrao?: number | null;
          nome: string;
          tipo_negocio?: string;
          updated_at?: string;
          usuario_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          margem_contribuicao_padrao?: number | null;
          nome?: string;
          tipo_negocio?: string;
          updated_at?: string;
          usuario_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "empresas_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      estoque_inventario_itens: {
        Row: {
          id: string;
          ingrediente_id: string;
          inventario_id: string;
          quantidade_contada: number | null;
          quantidade_sistema: number;
        };
        Insert: {
          id?: string;
          ingrediente_id: string;
          inventario_id: string;
          quantidade_contada?: number | null;
          quantidade_sistema?: number;
        };
        Update: {
          id?: string;
          ingrediente_id?: string;
          inventario_id?: string;
          quantidade_contada?: number | null;
          quantidade_sistema?: number;
        };
        Relationships: [
          {
            foreignKeyName: "estoque_inventario_itens_ingrediente_id_fkey";
            columns: ["ingrediente_id"];
            isOneToOne: false;
            referencedRelation: "ingredientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "estoque_inventario_itens_inventario_id_fkey";
            columns: ["inventario_id"];
            isOneToOne: false;
            referencedRelation: "estoque_inventarios";
            referencedColumns: ["id"];
          },
        ];
      };
      estoque_inventarios: {
        Row: {
          concluido_em: string | null;
          criado_em: string;
          criado_por: string | null;
          empresa_id: string;
          id: string;
          nome: string;
          status: string;
        };
        Insert: {
          concluido_em?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          empresa_id: string;
          id?: string;
          nome: string;
          status?: string;
        };
        Update: {
          concluido_em?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          empresa_id?: string;
          id?: string;
          nome?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "estoque_inventarios_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "estoque_inventarios_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      estoque_lotes: {
        Row: {
          created_at: string;
          custo_unitario: number;
          data_entrada: string;
          data_validade: string | null;
          empresa_id: string;
          id: string;
          ingrediente_id: string;
          numero_lote: string | null;
          quantidade_atual: number;
          quantidade_inicial: number;
        };
        Insert: {
          created_at?: string;
          custo_unitario: number;
          data_entrada?: string;
          data_validade?: string | null;
          empresa_id: string;
          id?: string;
          ingrediente_id: string;
          numero_lote?: string | null;
          quantidade_atual: number;
          quantidade_inicial: number;
        };
        Update: {
          created_at?: string;
          custo_unitario?: number;
          data_entrada?: string;
          data_validade?: string | null;
          empresa_id?: string;
          id?: string;
          ingrediente_id?: string;
          numero_lote?: string | null;
          quantidade_atual?: number;
          quantidade_inicial?: number;
        };
        Relationships: [
          {
            foreignKeyName: "estoque_lotes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "estoque_lotes_ingrediente_id_fkey";
            columns: ["ingrediente_id"];
            isOneToOne: false;
            referencedRelation: "ingredientes";
            referencedColumns: ["id"];
          },
        ];
      };
      estoque_movimentacoes: {
        Row: {
          criado_em: string;
          criado_por: string | null;
          custo_unitario: number;
          empresa_id: string;
          id: string;
          ingrediente_id: string;
          lote_id: string | null;
          observacao: string | null;
          quantidade: number;
          referencia_id: string | null;
          referencia_tipo: string | null;
          tipo: string;
        };
        Insert: {
          criado_em?: string;
          criado_por?: string | null;
          custo_unitario: number;
          empresa_id: string;
          id?: string;
          ingrediente_id: string;
          lote_id?: string | null;
          observacao?: string | null;
          quantidade: number;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          tipo: string;
        };
        Update: {
          criado_em?: string;
          criado_por?: string | null;
          custo_unitario?: number;
          empresa_id?: string;
          id?: string;
          ingrediente_id?: string;
          lote_id?: string | null;
          observacao?: string | null;
          quantidade?: number;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          tipo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "estoque_movimentacoes_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "estoque_movimentacoes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "estoque_movimentacoes_ingrediente_id_fkey";
            columns: ["ingrediente_id"];
            isOneToOne: false;
            referencedRelation: "ingredientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "estoque_movimentacoes_lote_id_fkey";
            columns: ["lote_id"];
            isOneToOne: false;
            referencedRelation: "estoque_lotes";
            referencedColumns: ["id"];
          },
        ];
      };
      estoque_saldos: {
        Row: {
          atualizado_em: string;
          custo_medio_ponderado: number;
          empresa_id: string;
          ingrediente_id: string;
          quantidade_total: number;
        };
        Insert: {
          atualizado_em?: string;
          custo_medio_ponderado?: number;
          empresa_id: string;
          ingrediente_id: string;
          quantidade_total?: number;
        };
        Update: {
          atualizado_em?: string;
          custo_medio_ponderado?: number;
          empresa_id?: string;
          ingrediente_id?: string;
          quantidade_total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "estoque_saldos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "estoque_saldos_ingrediente_id_fkey";
            columns: ["ingrediente_id"];
            isOneToOne: false;
            referencedRelation: "ingredientes";
            referencedColumns: ["id"];
          },
        ];
      };
      fichas_tecnicas: {
        Row: {
          ativo: boolean;
          cmv_percentual: number | null;
          created_at: string;
          created_by: string | null;
          custo_por_porcao: number;
          custo_total: number;
          empresa_id: string;
          id: string;
          margem_contribuicao_percentual: number | null;
          margem_contribuicao_percentual_alvo: number | null;
          markup_percentual: number | null;
          modo_preparo: string | null;
          nome: string;
          peso_bruto_total: number;
          peso_liquido_total: number;
          preco_sugerido: number | null;
          preco_venda_praticado: number | null;
          rendimento_quantidade: number;
          rendimento_unidade_id: string;
          tempo_preparo_minutos: number | null;
          updated_at: string;
          versao_atual: number;
        };
        Insert: {
          ativo?: boolean;
          cmv_percentual?: number | null;
          created_at?: string;
          created_by?: string | null;
          custo_por_porcao?: number;
          custo_total?: number;
          empresa_id: string;
          id?: string;
          margem_contribuicao_percentual?: number | null;
          margem_contribuicao_percentual_alvo?: number | null;
          markup_percentual?: number | null;
          modo_preparo?: string | null;
          nome: string;
          peso_bruto_total?: number;
          peso_liquido_total?: number;
          preco_sugerido?: number | null;
          preco_venda_praticado?: number | null;
          rendimento_quantidade: number;
          rendimento_unidade_id: string;
          tempo_preparo_minutos?: number | null;
          updated_at?: string;
          versao_atual?: number;
        };
        Update: {
          ativo?: boolean;
          cmv_percentual?: number | null;
          created_at?: string;
          created_by?: string | null;
          custo_por_porcao?: number;
          custo_total?: number;
          empresa_id?: string;
          id?: string;
          margem_contribuicao_percentual?: number | null;
          margem_contribuicao_percentual_alvo?: number | null;
          markup_percentual?: number | null;
          modo_preparo?: string | null;
          nome?: string;
          peso_bruto_total?: number;
          peso_liquido_total?: number;
          preco_sugerido?: number | null;
          preco_venda_praticado?: number | null;
          rendimento_quantidade?: number;
          rendimento_unidade_id?: string;
          tempo_preparo_minutos?: number | null;
          updated_at?: string;
          versao_atual?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fichas_tecnicas_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fichas_tecnicas_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fichas_tecnicas_rendimento_unidade_id_fkey";
            columns: ["rendimento_unidade_id"];
            isOneToOne: false;
            referencedRelation: "unidades_medida";
            referencedColumns: ["id"];
          },
        ];
      };
      fichas_tecnicas_itens: {
        Row: {
          created_at: string;
          custo_total_item: number | null;
          custo_unitario_utilizado: number;
          ficha_tecnica_id: string;
          id: string;
          ingrediente_id: string;
          ordem: number;
          percentual_perda: number;
          peso_bruto: number;
          peso_liquido: number | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          custo_total_item?: number | null;
          custo_unitario_utilizado?: number;
          ficha_tecnica_id: string;
          id?: string;
          ingrediente_id: string;
          ordem?: number;
          percentual_perda?: number;
          peso_bruto: number;
          peso_liquido?: number | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          custo_total_item?: number | null;
          custo_unitario_utilizado?: number;
          ficha_tecnica_id?: string;
          id?: string;
          ingrediente_id?: string;
          ordem?: number;
          percentual_perda?: number;
          peso_bruto?: number;
          peso_liquido?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fichas_tecnicas_itens_ficha_tecnica_id_fkey";
            columns: ["ficha_tecnica_id"];
            isOneToOne: false;
            referencedRelation: "fichas_tecnicas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fichas_tecnicas_itens_ingrediente_id_fkey";
            columns: ["ingrediente_id"];
            isOneToOne: false;
            referencedRelation: "ingredientes";
            referencedColumns: ["id"];
          },
        ];
      };
      fichas_tecnicas_versoes: {
        Row: {
          criado_em: string;
          criado_por: string | null;
          ficha_tecnica_id: string;
          id: string;
          motivo: string | null;
          numero_versao: number;
          snapshot: Json;
        };
        Insert: {
          criado_em?: string;
          criado_por?: string | null;
          ficha_tecnica_id: string;
          id?: string;
          motivo?: string | null;
          numero_versao: number;
          snapshot: Json;
        };
        Update: {
          criado_em?: string;
          criado_por?: string | null;
          ficha_tecnica_id?: string;
          id?: string;
          motivo?: string | null;
          numero_versao?: number;
          snapshot?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "fichas_tecnicas_versoes_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fichas_tecnicas_versoes_ficha_tecnica_id_fkey";
            columns: ["ficha_tecnica_id"];
            isOneToOne: false;
            referencedRelation: "fichas_tecnicas";
            referencedColumns: ["id"];
          },
        ];
      };
      fornecedor_ingredientes: {
        Row: {
          atualizado_em: string;
          empresa_id: string;
          fornecedor_id: string;
          id: string;
          ingrediente_id: string;
          preco_unitario: number;
        };
        Insert: {
          atualizado_em?: string;
          empresa_id: string;
          fornecedor_id: string;
          id?: string;
          ingrediente_id: string;
          preco_unitario: number;
        };
        Update: {
          atualizado_em?: string;
          empresa_id?: string;
          fornecedor_id?: string;
          id?: string;
          ingrediente_id?: string;
          preco_unitario?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fornecedor_ingredientes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fornecedor_ingredientes_fornecedor_id_fkey";
            columns: ["fornecedor_id"];
            isOneToOne: false;
            referencedRelation: "fornecedores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fornecedor_ingredientes_ingrediente_id_fkey";
            columns: ["ingrediente_id"];
            isOneToOne: false;
            referencedRelation: "ingredientes";
            referencedColumns: ["id"];
          },
        ];
      };
      fornecedores: {
        Row: {
          ativo: boolean;
          created_at: string;
          documento: string | null;
          email: string | null;
          empresa_id: string;
          endereco: string | null;
          id: string;
          nome: string;
          observacoes: string | null;
          telefone: string | null;
          updated_at: string;
        };
        Insert: {
          ativo?: boolean;
          created_at?: string;
          documento?: string | null;
          email?: string | null;
          empresa_id: string;
          endereco?: string | null;
          id?: string;
          nome: string;
          observacoes?: string | null;
          telefone?: string | null;
          updated_at?: string;
        };
        Update: {
          ativo?: boolean;
          created_at?: string;
          documento?: string | null;
          email?: string | null;
          empresa_id?: string;
          endereco?: string | null;
          id?: string;
          nome?: string;
          observacoes?: string | null;
          telefone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fornecedores_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      ingredientes: {
        Row: {
          ativo: boolean;
          categoria_id: string | null;
          created_at: string;
          custo_unitario_atual: number;
          empresa_id: string;
          estoque_minimo: number;
          id: string;
          nome: string;
          unidade_medida_id: string;
          updated_at: string;
        };
        Insert: {
          ativo?: boolean;
          categoria_id?: string | null;
          created_at?: string;
          custo_unitario_atual?: number;
          empresa_id: string;
          estoque_minimo?: number;
          id?: string;
          nome: string;
          unidade_medida_id: string;
          updated_at?: string;
        };
        Update: {
          ativo?: boolean;
          categoria_id?: string | null;
          created_at?: string;
          custo_unitario_atual?: number;
          empresa_id?: string;
          estoque_minimo?: number;
          id?: string;
          nome?: string;
          unidade_medida_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ingredientes_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias_ingredientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ingredientes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ingredientes_unidade_medida_id_fkey";
            columns: ["unidade_medida_id"];
            isOneToOne: false;
            referencedRelation: "unidades_medida";
            referencedColumns: ["id"];
          },
        ];
      };
      ingredientes_historico_precos: {
        Row: {
          criado_por: string | null;
          custo_unitario: number;
          data_referencia: string;
          id: string;
          ingrediente_id: string;
          observacao: string | null;
        };
        Insert: {
          criado_por?: string | null;
          custo_unitario: number;
          data_referencia?: string;
          id?: string;
          ingrediente_id: string;
          observacao?: string | null;
        };
        Update: {
          criado_por?: string | null;
          custo_unitario?: number;
          data_referencia?: string;
          id?: string;
          ingrediente_id?: string;
          observacao?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ingredientes_historico_precos_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ingredientes_historico_precos_ingrediente_id_fkey";
            columns: ["ingrediente_id"];
            isOneToOne: false;
            referencedRelation: "ingredientes";
            referencedColumns: ["id"];
          },
        ];
      };
      listas_compra: {
        Row: {
          criado_em: string;
          criado_por: string | null;
          data_fim_referencia: string;
          data_inicio_referencia: string;
          empresa_id: string;
          id: string;
          nome: string;
          status: string;
        };
        Insert: {
          criado_em?: string;
          criado_por?: string | null;
          data_fim_referencia: string;
          data_inicio_referencia: string;
          empresa_id: string;
          id?: string;
          nome: string;
          status?: string;
        };
        Update: {
          criado_em?: string;
          criado_por?: string | null;
          data_fim_referencia?: string;
          data_inicio_referencia?: string;
          empresa_id?: string;
          id?: string;
          nome?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listas_compra_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listas_compra_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      listas_compra_itens: {
        Row: {
          fornecedor_id: string | null;
          id: string;
          ingrediente_id: string;
          lista_id: string;
          preco_unitario_previsto: number;
          quantidade_sugerida: number;
          valor_previsto: number | null;
        };
        Insert: {
          fornecedor_id?: string | null;
          id?: string;
          ingrediente_id: string;
          lista_id: string;
          preco_unitario_previsto?: number;
          quantidade_sugerida: number;
          valor_previsto?: number | null;
        };
        Update: {
          fornecedor_id?: string | null;
          id?: string;
          ingrediente_id?: string;
          lista_id?: string;
          preco_unitario_previsto?: number;
          quantidade_sugerida?: number;
          valor_previsto?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "listas_compra_itens_fornecedor_id_fkey";
            columns: ["fornecedor_id"];
            isOneToOne: false;
            referencedRelation: "fornecedores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listas_compra_itens_ingrediente_id_fkey";
            columns: ["ingrediente_id"];
            isOneToOne: false;
            referencedRelation: "ingredientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listas_compra_itens_lista_id_fkey";
            columns: ["lista_id"];
            isOneToOne: false;
            referencedRelation: "listas_compra";
            referencedColumns: ["id"];
          },
        ];
      };
      metas_vendas: {
        Row: {
          atualizado_em: string;
          criado_em: string;
          empresa_id: string;
          id: string;
          mes_referencia: string;
          observacao: string | null;
          quantidade_meta: number | null;
          valor_meta_receita: number;
        };
        Insert: {
          atualizado_em?: string;
          criado_em?: string;
          empresa_id: string;
          id?: string;
          mes_referencia: string;
          observacao?: string | null;
          quantidade_meta?: number | null;
          valor_meta_receita: number;
        };
        Update: {
          atualizado_em?: string;
          criado_em?: string;
          empresa_id?: string;
          id?: string;
          mes_referencia?: string;
          observacao?: string | null;
          quantidade_meta?: number | null;
          valor_meta_receita?: number;
        };
        Relationships: [
          {
            foreignKeyName: "metas_vendas_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      pedidos_compra: {
        Row: {
          atualizado_em: string;
          criado_em: string;
          criado_por: string | null;
          data_pedido: string;
          data_prevista_entrega: string | null;
          empresa_id: string;
          fornecedor_id: string;
          id: string;
          observacao: string | null;
          solicitacao_origem_id: string | null;
          status: string;
        };
        Insert: {
          atualizado_em?: string;
          criado_em?: string;
          criado_por?: string | null;
          data_pedido?: string;
          data_prevista_entrega?: string | null;
          empresa_id: string;
          fornecedor_id: string;
          id?: string;
          observacao?: string | null;
          solicitacao_origem_id?: string | null;
          status?: string;
        };
        Update: {
          atualizado_em?: string;
          criado_em?: string;
          criado_por?: string | null;
          data_pedido?: string;
          data_prevista_entrega?: string | null;
          empresa_id?: string;
          fornecedor_id?: string;
          id?: string;
          observacao?: string | null;
          solicitacao_origem_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedidos_compra_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedidos_compra_fornecedor_id_fkey";
            columns: ["fornecedor_id"];
            isOneToOne: false;
            referencedRelation: "fornecedores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedidos_compra_solicitacao_origem_id_fkey";
            columns: ["solicitacao_origem_id"];
            isOneToOne: false;
            referencedRelation: "solicitacoes_compra";
            referencedColumns: ["id"];
          },
        ];
      };
      pedidos_compra_itens: {
        Row: {
          id: string;
          ingrediente_id: string;
          pedido_id: string;
          preco_unitario: number;
          quantidade_pedida: number;
          quantidade_recebida: number;
          valor_total: number | null;
        };
        Insert: {
          id?: string;
          ingrediente_id: string;
          pedido_id: string;
          preco_unitario: number;
          quantidade_pedida: number;
          quantidade_recebida?: number;
          valor_total?: number | null;
        };
        Update: {
          id?: string;
          ingrediente_id?: string;
          pedido_id?: string;
          preco_unitario?: number;
          quantidade_pedida?: number;
          quantidade_recebida?: number;
          valor_total?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_itens_ingrediente_id_fkey";
            columns: ["ingrediente_id"];
            isOneToOne: false;
            referencedRelation: "ingredientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedidos_compra_itens_pedido_id_fkey";
            columns: ["pedido_id"];
            isOneToOne: false;
            referencedRelation: "pedidos_compra";
            referencedColumns: ["id"];
          },
        ];
      };
      producoes_planejadas: {
        Row: {
          atualizado_em: string;
          criado_em: string;
          criado_por: string | null;
          data_producao: string;
          empresa_id: string;
          ficha_tecnica_id: string;
          id: string;
          observacao: string | null;
          quantidade_planejada: number;
          status: string;
        };
        Insert: {
          atualizado_em?: string;
          criado_em?: string;
          criado_por?: string | null;
          data_producao: string;
          empresa_id: string;
          ficha_tecnica_id: string;
          id?: string;
          observacao?: string | null;
          quantidade_planejada: number;
          status?: string;
        };
        Update: {
          atualizado_em?: string;
          criado_em?: string;
          criado_por?: string | null;
          data_producao?: string;
          empresa_id?: string;
          ficha_tecnica_id?: string;
          id?: string;
          observacao?: string | null;
          quantidade_planejada?: number;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "producoes_planejadas_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "producoes_planejadas_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "producoes_planejadas_ficha_tecnica_id_fkey";
            columns: ["ficha_tecnica_id"];
            isOneToOne: false;
            referencedRelation: "fichas_tecnicas";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          nome_completo: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          nome_completo: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          nome_completo?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      solicitacoes_compra: {
        Row: {
          atualizado_em: string;
          criado_em: string;
          criado_por: string | null;
          empresa_id: string;
          id: string;
          observacao: string | null;
          status: string;
        };
        Insert: {
          atualizado_em?: string;
          criado_em?: string;
          criado_por?: string | null;
          empresa_id: string;
          id?: string;
          observacao?: string | null;
          status?: string;
        };
        Update: {
          atualizado_em?: string;
          criado_em?: string;
          criado_por?: string | null;
          empresa_id?: string;
          id?: string;
          observacao?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "solicitacoes_compra_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "solicitacoes_compra_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      solicitacoes_compra_itens: {
        Row: {
          id: string;
          ingrediente_id: string;
          observacao: string | null;
          quantidade: number;
          solicitacao_id: string;
        };
        Insert: {
          id?: string;
          ingrediente_id: string;
          observacao?: string | null;
          quantidade: number;
          solicitacao_id: string;
        };
        Update: {
          id?: string;
          ingrediente_id?: string;
          observacao?: string | null;
          quantidade?: number;
          solicitacao_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "solicitacoes_compra_itens_ingrediente_id_fkey";
            columns: ["ingrediente_id"];
            isOneToOne: false;
            referencedRelation: "ingredientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "solicitacoes_compra_itens_solicitacao_id_fkey";
            columns: ["solicitacao_id"];
            isOneToOne: false;
            referencedRelation: "solicitacoes_compra";
            referencedColumns: ["id"];
          },
        ];
      };
      unidades_medida: {
        Row: {
          created_at: string;
          empresa_id: string | null;
          id: string;
          nome: string;
          sigla: string;
          tipo_grandeza: string;
        };
        Insert: {
          created_at?: string;
          empresa_id?: string | null;
          id?: string;
          nome: string;
          sigla: string;
          tipo_grandeza?: string;
        };
        Update: {
          created_at?: string;
          empresa_id?: string | null;
          id?: string;
          nome?: string;
          sigla?: string;
          tipo_grandeza?: string;
        };
        Relationships: [
          {
            foreignKeyName: "unidades_medida_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      fn_concluir_inventario: {
        Args: { p_inventario_id: string };
        Returns: undefined;
      };
      fn_concluir_producao: {
        Args: { p_producao_id: string };
        Returns: undefined;
      };
      fn_converter_lista_em_pedidos: {
        Args: { p_lista_id: string };
        Returns: string[];
      };
      fn_duplicar_ficha_tecnica: {
        Args: { p_ficha_id: string };
        Returns: string;
      };
      fn_gerar_lista_compras: {
        Args: {
          p_data_fim: string;
          p_data_inicio: string;
          p_empresa_id: string;
          p_nome: string;
        };
        Returns: string;
      };
      fn_recalcular_estoque_saldo: {
        Args: { p_empresa_id: string; p_ingrediente_id: string };
        Returns: undefined;
      };
      fn_receber_item_pedido_compra: {
        Args: {
          p_data_validade?: string;
          p_numero_lote?: string;
          p_pedido_item_id: string;
          p_quantidade: number;
        };
        Returns: undefined;
      };
      fn_registrar_entrada_estoque: {
        Args: {
          p_custo_unitario: number;
          p_data_validade?: string;
          p_ingrediente_id: string;
          p_numero_lote?: string;
          p_observacao?: string;
          p_quantidade: number;
          p_referencia_id?: string;
          p_referencia_tipo?: string;
        };
        Returns: string;
      };
      fn_registrar_saida_estoque: {
        Args: {
          p_ingrediente_id: string;
          p_observacao?: string;
          p_quantidade: number;
          p_referencia_id?: string;
          p_referencia_tipo?: string;
          p_tipo?: string;
        };
        Returns: undefined;
      };
      recalcular_ficha_tecnica: {
        Args: { p_ficha_id: string };
        Returns: undefined;
      };
      salvar_ficha_tecnica: {
        // p_modo_preparo/p_preco_venda_praticado/p_margem_contribuicao_percentual_alvo/
        // p_tempo_preparo_minutos têm NENHUM default em SQL (por isso o
        // gerador não os marca `?:`), mas os 4 aceitam NULL em runtime (ver
        // migration 0010) — o gerador da Supabase não expressa "obrigatório
        // porém aceita null" para argumentos de função, então isso é
        // corrigido manualmente aqui (mesma limitação em fn_registrar_*
        // abaixo, que optional-param cobre porque aqueles TÊM default).
        Args: {
          p_empresa_id: string;
          p_ficha_id: string | null;
          p_itens: Json;
          p_margem_contribuicao_percentual_alvo: number | null;
          p_modo_preparo: string | null;
          p_motivo_versao?: string;
          p_nome: string;
          p_preco_venda_praticado: number | null;
          p_rendimento_quantidade: number;
          p_rendimento_unidade_id: string;
          p_tempo_preparo_minutos: number | null;
        };
        Returns: string;
      };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { "": string }; Returns: string[] };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
