export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      agentes_impressao: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          chave_api_hash: string;
          criado_em: string;
          empresa_id: string;
          id: string;
          nome: string;
          ultimo_ping_em: string | null;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          chave_api_hash: string;
          criado_em?: string;
          empresa_id: string;
          id?: string;
          nome: string;
          ultimo_ping_em?: string | null;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          chave_api_hash?: string;
          criado_em?: string;
          empresa_id?: string;
          id?: string;
          nome?: string;
          ultimo_ping_em?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agentes_impressao_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      caixa_movimentacoes: {
        Row: {
          caixa_id: string;
          criado_em: string;
          criado_por: string | null;
          empresa_id: string;
          forma_pagamento: string | null;
          id: string;
          observacao: string | null;
          referencia_id: string | null;
          referencia_tipo: string | null;
          tipo: string;
          valor: number;
        };
        Insert: {
          caixa_id: string;
          criado_em?: string;
          criado_por?: string | null;
          empresa_id: string;
          forma_pagamento?: string | null;
          id?: string;
          observacao?: string | null;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          tipo: string;
          valor: number;
        };
        Update: {
          caixa_id?: string;
          criado_em?: string;
          criado_por?: string | null;
          empresa_id?: string;
          forma_pagamento?: string | null;
          id?: string;
          observacao?: string | null;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          tipo?: string;
          valor?: number;
        };
        Relationships: [
          {
            foreignKeyName: "caixa_movimentacoes_caixa_id_fkey";
            columns: ["caixa_id"];
            isOneToOne: false;
            referencedRelation: "caixas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "caixa_movimentacoes_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "caixa_movimentacoes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      caixas: {
        Row: {
          aberto_em: string;
          diferenca: number | null;
          empresa_id: string;
          fechado_em: string | null;
          id: string;
          observacoes_abertura: string | null;
          observacoes_fechamento: string | null;
          operador_id: string;
          saldo_esperado: number | null;
          saldo_informado: number | null;
          saldo_inicial: number;
          status: string;
        };
        Insert: {
          aberto_em?: string;
          diferenca?: number | null;
          empresa_id: string;
          fechado_em?: string | null;
          id?: string;
          observacoes_abertura?: string | null;
          observacoes_fechamento?: string | null;
          operador_id: string;
          saldo_esperado?: number | null;
          saldo_informado?: number | null;
          saldo_inicial?: number;
          status?: string;
        };
        Update: {
          aberto_em?: string;
          diferenca?: number | null;
          empresa_id?: string;
          fechado_em?: string | null;
          id?: string;
          observacoes_abertura?: string | null;
          observacoes_fechamento?: string | null;
          operador_id?: string;
          saldo_esperado?: number | null;
          saldo_informado?: number | null;
          saldo_inicial?: number;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "caixas_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "caixas_operador_id_fkey";
            columns: ["operador_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
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
      centros_custo: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          codigo: string;
          criado_em: string;
          empresa_id: string;
          id: string;
          nome: string;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          codigo: string;
          criado_em?: string;
          empresa_id: string;
          id?: string;
          nome: string;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          codigo?: string;
          criado_em?: string;
          empresa_id?: string;
          id?: string;
          nome?: string;
        };
        Relationships: [
          {
            foreignKeyName: "centros_custo_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      clientes: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          consentimento_lgpd: boolean;
          consentimento_lgpd_em: string | null;
          criado_em: string;
          data_nascimento: string | null;
          documento: string | null;
          email: string | null;
          empresa_id: string;
          endereco: string | null;
          id: string;
          nome: string;
          observacoes: string | null;
          opt_in_email: boolean;
          opt_in_sms: boolean;
          opt_in_whatsapp: boolean;
          origem: string | null;
          preferencias: string | null;
          restricoes_alimentares: string | null;
          segmento: string | null;
          tags: string[];
          telefone: string | null;
          whatsapp: string | null;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          consentimento_lgpd?: boolean;
          consentimento_lgpd_em?: string | null;
          criado_em?: string;
          data_nascimento?: string | null;
          documento?: string | null;
          email?: string | null;
          empresa_id: string;
          endereco?: string | null;
          id?: string;
          nome: string;
          observacoes?: string | null;
          opt_in_email?: boolean;
          opt_in_sms?: boolean;
          opt_in_whatsapp?: boolean;
          origem?: string | null;
          preferencias?: string | null;
          restricoes_alimentares?: string | null;
          segmento?: string | null;
          tags?: string[];
          telefone?: string | null;
          whatsapp?: string | null;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          consentimento_lgpd?: boolean;
          consentimento_lgpd_em?: string | null;
          criado_em?: string;
          data_nascimento?: string | null;
          documento?: string | null;
          email?: string | null;
          empresa_id?: string;
          endereco?: string | null;
          id?: string;
          nome?: string;
          observacoes?: string | null;
          opt_in_email?: boolean;
          opt_in_sms?: boolean;
          opt_in_whatsapp?: boolean;
          origem?: string | null;
          preferencias?: string | null;
          restricoes_alimentares?: string | null;
          segmento?: string | null;
          tags?: string[];
          telefone?: string | null;
          whatsapp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      comandas: {
        Row: {
          aberta_em: string;
          empresa_id: string;
          fechada_em: string | null;
          id: string;
          mesa_id: string | null;
          quantidade_pessoas: number | null;
          responsavel_id: string | null;
          status: string;
        };
        Insert: {
          aberta_em?: string;
          empresa_id: string;
          fechada_em?: string | null;
          id?: string;
          mesa_id?: string | null;
          quantidade_pessoas?: number | null;
          responsavel_id?: string | null;
          status?: string;
        };
        Update: {
          aberta_em?: string;
          empresa_id?: string;
          fechada_em?: string | null;
          id?: string;
          mesa_id?: string | null;
          quantidade_pessoas?: number | null;
          responsavel_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comandas_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comandas_mesa_id_fkey";
            columns: ["mesa_id"];
            isOneToOne: false;
            referencedRelation: "mesas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comandas_responsavel_id_fkey";
            columns: ["responsavel_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      compras_anexos: {
        Row: {
          criado_em: string;
          criado_por: string | null;
          empresa_id: string;
          id: string;
          nome_arquivo: string;
          referencia_id: string;
          referencia_tipo: string;
          tipo: string;
          url: string;
        };
        Insert: {
          criado_em?: string;
          criado_por?: string | null;
          empresa_id: string;
          id?: string;
          nome_arquivo: string;
          referencia_id: string;
          referencia_tipo: string;
          tipo?: string;
          url: string;
        };
        Update: {
          criado_em?: string;
          criado_por?: string | null;
          empresa_id?: string;
          id?: string;
          nome_arquivo?: string;
          referencia_id?: string;
          referencia_tipo?: string;
          tipo?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compras_anexos_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_anexos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      compras_auditoria: {
        Row: {
          acao: string;
          criado_em: string;
          dados_antigos: Json | null;
          dados_novos: Json | null;
          empresa_id: string;
          id: string;
          registro_id: string;
          tabela: string;
          usuario_id: string | null;
        };
        Insert: {
          acao: string;
          criado_em?: string;
          dados_antigos?: Json | null;
          dados_novos?: Json | null;
          empresa_id: string;
          id?: string;
          registro_id: string;
          tabela: string;
          usuario_id?: string | null;
        };
        Update: {
          acao?: string;
          criado_em?: string;
          dados_antigos?: Json | null;
          dados_novos?: Json | null;
          empresa_id?: string;
          id?: string;
          registro_id?: string;
          tabela?: string;
          usuario_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "compras_auditoria_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_auditoria_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      compras_avaliacoes_fornecedor: {
        Row: {
          atendimento: number;
          comentario: string | null;
          criado_em: string;
          criado_por: string | null;
          empresa_id: string;
          fornecedor_id: string;
          id: string;
          pedido_id: string | null;
          pontualidade: number;
          preco: number;
          qualidade: number;
        };
        Insert: {
          atendimento: number;
          comentario?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          empresa_id: string;
          fornecedor_id: string;
          id?: string;
          pedido_id?: string | null;
          pontualidade: number;
          preco: number;
          qualidade: number;
        };
        Update: {
          atendimento?: number;
          comentario?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          empresa_id?: string;
          fornecedor_id?: string;
          id?: string;
          pedido_id?: string | null;
          pontualidade?: number;
          preco?: number;
          qualidade?: number;
        };
        Relationships: [
          {
            foreignKeyName: "compras_avaliacoes_fornecedor_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_avaliacoes_fornecedor_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_avaliacoes_fornecedor_fornecedor_id_fkey";
            columns: ["fornecedor_id"];
            isOneToOne: false;
            referencedRelation: "compras_fornecedores_score";
            referencedColumns: ["fornecedor_id"];
          },
          {
            foreignKeyName: "compras_avaliacoes_fornecedor_fornecedor_id_fkey";
            columns: ["fornecedor_id"];
            isOneToOne: false;
            referencedRelation: "fornecedores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_avaliacoes_fornecedor_pedido_id_fkey";
            columns: ["pedido_id"];
            isOneToOne: false;
            referencedRelation: "pedidos_compra";
            referencedColumns: ["id"];
          },
        ];
      };
      compras_cotacoes: {
        Row: {
          atualizado_em: string;
          criado_em: string;
          criado_por: string | null;
          empresa_id: string;
          escolha_automatica: boolean;
          finalizado_em: string | null;
          fornecedor_vencedor_id: string | null;
          id: string;
          justificativa_escolha: string | null;
          numero: number | null;
          observacao: string | null;
          solicitacao_origem_id: string | null;
          status: string;
        };
        Insert: {
          atualizado_em?: string;
          criado_em?: string;
          criado_por?: string | null;
          empresa_id: string;
          escolha_automatica?: boolean;
          finalizado_em?: string | null;
          fornecedor_vencedor_id?: string | null;
          id?: string;
          justificativa_escolha?: string | null;
          numero?: number | null;
          observacao?: string | null;
          solicitacao_origem_id?: string | null;
          status?: string;
        };
        Update: {
          atualizado_em?: string;
          criado_em?: string;
          criado_por?: string | null;
          empresa_id?: string;
          escolha_automatica?: boolean;
          finalizado_em?: string | null;
          fornecedor_vencedor_id?: string | null;
          id?: string;
          justificativa_escolha?: string | null;
          numero?: number | null;
          observacao?: string | null;
          solicitacao_origem_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compras_cotacoes_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_cotacoes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_cotacoes_fornecedor_vencedor_id_fkey";
            columns: ["fornecedor_vencedor_id"];
            isOneToOne: false;
            referencedRelation: "compras_fornecedores_score";
            referencedColumns: ["fornecedor_id"];
          },
          {
            foreignKeyName: "compras_cotacoes_fornecedor_vencedor_id_fkey";
            columns: ["fornecedor_vencedor_id"];
            isOneToOne: false;
            referencedRelation: "fornecedores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_cotacoes_solicitacao_origem_id_fkey";
            columns: ["solicitacao_origem_id"];
            isOneToOne: false;
            referencedRelation: "solicitacoes_compra";
            referencedColumns: ["id"];
          },
        ];
      };
      compras_cotacoes_fornecedores: {
        Row: {
          condicao_pagamento: string | null;
          cotacao_id: string;
          criado_em: string;
          empresa_id: string;
          fornecedor_id: string;
          id: string;
          observacao: string | null;
          pedido_minimo: number | null;
          prazo_entrega_dias: number | null;
          respondido_em: string | null;
          status: string;
          valor_frete: number;
          valor_impostos: number;
        };
        Insert: {
          condicao_pagamento?: string | null;
          cotacao_id: string;
          criado_em?: string;
          empresa_id: string;
          fornecedor_id: string;
          id?: string;
          observacao?: string | null;
          pedido_minimo?: number | null;
          prazo_entrega_dias?: number | null;
          respondido_em?: string | null;
          status?: string;
          valor_frete?: number;
          valor_impostos?: number;
        };
        Update: {
          condicao_pagamento?: string | null;
          cotacao_id?: string;
          criado_em?: string;
          empresa_id?: string;
          fornecedor_id?: string;
          id?: string;
          observacao?: string | null;
          pedido_minimo?: number | null;
          prazo_entrega_dias?: number | null;
          respondido_em?: string | null;
          status?: string;
          valor_frete?: number;
          valor_impostos?: number;
        };
        Relationships: [
          {
            foreignKeyName: "compras_cotacoes_fornecedores_cotacao_id_fkey";
            columns: ["cotacao_id"];
            isOneToOne: false;
            referencedRelation: "compras_cotacoes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_cotacoes_fornecedores_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_cotacoes_fornecedores_fornecedor_id_fkey";
            columns: ["fornecedor_id"];
            isOneToOne: false;
            referencedRelation: "compras_fornecedores_score";
            referencedColumns: ["fornecedor_id"];
          },
          {
            foreignKeyName: "compras_cotacoes_fornecedores_fornecedor_id_fkey";
            columns: ["fornecedor_id"];
            isOneToOne: false;
            referencedRelation: "fornecedores";
            referencedColumns: ["id"];
          },
        ];
      };
      compras_cotacoes_itens: {
        Row: {
          cotacao_id: string;
          empresa_id: string;
          id: string;
          ingrediente_id: string;
          quantidade: number;
        };
        Insert: {
          cotacao_id: string;
          empresa_id: string;
          id?: string;
          ingrediente_id: string;
          quantidade: number;
        };
        Update: {
          cotacao_id?: string;
          empresa_id?: string;
          id?: string;
          ingrediente_id?: string;
          quantidade?: number;
        };
        Relationships: [
          {
            foreignKeyName: "compras_cotacoes_itens_cotacao_id_fkey";
            columns: ["cotacao_id"];
            isOneToOne: false;
            referencedRelation: "compras_cotacoes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_cotacoes_itens_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_cotacoes_itens_ingrediente_id_fkey";
            columns: ["ingrediente_id"];
            isOneToOne: false;
            referencedRelation: "ingredientes";
            referencedColumns: ["id"];
          },
        ];
      };
      compras_cotacoes_propostas_itens: {
        Row: {
          atende_pedido_minimo: boolean;
          cotacao_fornecedor_id: string;
          cotacao_item_id: string;
          empresa_id: string;
          id: string;
          preco_unitario: number;
        };
        Insert: {
          atende_pedido_minimo?: boolean;
          cotacao_fornecedor_id: string;
          cotacao_item_id: string;
          empresa_id: string;
          id?: string;
          preco_unitario: number;
        };
        Update: {
          atende_pedido_minimo?: boolean;
          cotacao_fornecedor_id?: string;
          cotacao_item_id?: string;
          empresa_id?: string;
          id?: string;
          preco_unitario?: number;
        };
        Relationships: [
          {
            foreignKeyName: "compras_cotacoes_propostas_itens_cotacao_fornecedor_id_fkey";
            columns: ["cotacao_fornecedor_id"];
            isOneToOne: false;
            referencedRelation: "compras_cotacoes_fornecedores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_cotacoes_propostas_itens_cotacao_item_id_fkey";
            columns: ["cotacao_item_id"];
            isOneToOne: false;
            referencedRelation: "compras_cotacoes_itens";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_cotacoes_propostas_itens_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      compras_niveis_aprovacao: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          centro_custo_id: string | null;
          criado_em: string;
          empresa_id: string;
          id: string;
          nome: string;
          ordem: number;
          papel_aprovador: string | null;
          usuario_aprovador_id: string | null;
          valor_maximo: number | null;
          valor_minimo: number;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          centro_custo_id?: string | null;
          criado_em?: string;
          empresa_id: string;
          id?: string;
          nome: string;
          ordem?: number;
          papel_aprovador?: string | null;
          usuario_aprovador_id?: string | null;
          valor_maximo?: number | null;
          valor_minimo?: number;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          centro_custo_id?: string | null;
          criado_em?: string;
          empresa_id?: string;
          id?: string;
          nome?: string;
          ordem?: number;
          papel_aprovador?: string | null;
          usuario_aprovador_id?: string | null;
          valor_maximo?: number | null;
          valor_minimo?: number;
        };
        Relationships: [
          {
            foreignKeyName: "compras_niveis_aprovacao_centro_custo_id_fkey";
            columns: ["centro_custo_id"];
            isOneToOne: false;
            referencedRelation: "centros_custo";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_niveis_aprovacao_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_niveis_aprovacao_usuario_aprovador_id_fkey";
            columns: ["usuario_aprovador_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      compras_notificacoes: {
        Row: {
          criado_em: string;
          empresa_id: string;
          id: string;
          lida: boolean;
          mensagem: string;
          referencia_id: string | null;
          referencia_tipo: string | null;
          tipo: string;
          usuario_id: string;
        };
        Insert: {
          criado_em?: string;
          empresa_id: string;
          id?: string;
          lida?: boolean;
          mensagem: string;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          tipo: string;
          usuario_id: string;
        };
        Update: {
          criado_em?: string;
          empresa_id?: string;
          id?: string;
          lida?: boolean;
          mensagem?: string;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          tipo?: string;
          usuario_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compras_notificacoes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_notificacoes_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      compras_recebimentos: {
        Row: {
          criado_em: string;
          data_recebimento: string;
          empresa_id: string;
          id: string;
          observacao: string | null;
          pedido_id: string;
          responsavel_id: string | null;
        };
        Insert: {
          criado_em?: string;
          data_recebimento?: string;
          empresa_id: string;
          id?: string;
          observacao?: string | null;
          pedido_id: string;
          responsavel_id?: string | null;
        };
        Update: {
          criado_em?: string;
          data_recebimento?: string;
          empresa_id?: string;
          id?: string;
          observacao?: string | null;
          pedido_id?: string;
          responsavel_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "compras_recebimentos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_recebimentos_pedido_id_fkey";
            columns: ["pedido_id"];
            isOneToOne: false;
            referencedRelation: "pedidos_compra";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_recebimentos_responsavel_id_fkey";
            columns: ["responsavel_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      compras_recebimentos_itens: {
        Row: {
          data_fabricacao: string | null;
          data_validade: string | null;
          divergencia: boolean;
          empresa_id: string;
          id: string;
          motivo_divergencia: string | null;
          numero_lote: string | null;
          pedido_item_id: string;
          preco_conferido: number | null;
          quantidade_recebida: number;
          quantidade_recusada: number;
          recebimento_id: string;
        };
        Insert: {
          data_fabricacao?: string | null;
          data_validade?: string | null;
          divergencia?: boolean;
          empresa_id: string;
          id?: string;
          motivo_divergencia?: string | null;
          numero_lote?: string | null;
          pedido_item_id: string;
          preco_conferido?: number | null;
          quantidade_recebida?: number;
          quantidade_recusada?: number;
          recebimento_id: string;
        };
        Update: {
          data_fabricacao?: string | null;
          data_validade?: string | null;
          divergencia?: boolean;
          empresa_id?: string;
          id?: string;
          motivo_divergencia?: string | null;
          numero_lote?: string | null;
          pedido_item_id?: string;
          preco_conferido?: number | null;
          quantidade_recebida?: number;
          quantidade_recusada?: number;
          recebimento_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compras_recebimentos_itens_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_recebimentos_itens_pedido_item_id_fkey";
            columns: ["pedido_item_id"];
            isOneToOne: false;
            referencedRelation: "pedidos_compra_itens";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_recebimentos_itens_recebimento_id_fkey";
            columns: ["recebimento_id"];
            isOneToOne: false;
            referencedRelation: "compras_recebimentos";
            referencedColumns: ["id"];
          },
        ];
      };
      contadores_compras: {
        Row: {
          empresa_id: string;
          proximo_numero: number;
          tipo: string;
        };
        Insert: {
          empresa_id: string;
          proximo_numero?: number;
          tipo: string;
        };
        Update: {
          empresa_id?: string;
          proximo_numero?: number;
          tipo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contadores_compras_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      contadores_pedidos: {
        Row: {
          empresa_id: string;
          proximo_numero: number;
        };
        Insert: {
          empresa_id: string;
          proximo_numero?: number;
        };
        Update: {
          empresa_id?: string;
          proximo_numero?: number;
        };
        Relationships: [
          {
            foreignKeyName: "contadores_pedidos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: true;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      contas_pagar: {
        Row: {
          atualizado_em: string;
          categoria_origem: string;
          centro_custo_id: string | null;
          conciliado: boolean;
          conciliado_em: string | null;
          conciliado_por: string | null;
          criado_em: string;
          criado_por: string | null;
          data_emissao: string;
          data_pagamento: string | null;
          data_vencimento: string;
          descricao: string;
          empresa_id: string;
          forma_pagamento: string | null;
          fornecedor_id: string | null;
          id: string;
          numero_documento: string | null;
          observacao: string | null;
          plano_conta_id: string | null;
          referencia_id: string | null;
          referencia_tipo: string | null;
          status: string;
          valor: number;
          valor_pago: number | null;
        };
        Insert: {
          atualizado_em?: string;
          categoria_origem?: string;
          centro_custo_id?: string | null;
          conciliado?: boolean;
          conciliado_em?: string | null;
          conciliado_por?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          data_emissao?: string;
          data_pagamento?: string | null;
          data_vencimento: string;
          descricao: string;
          empresa_id: string;
          forma_pagamento?: string | null;
          fornecedor_id?: string | null;
          id?: string;
          numero_documento?: string | null;
          observacao?: string | null;
          plano_conta_id?: string | null;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          status?: string;
          valor: number;
          valor_pago?: number | null;
        };
        Update: {
          atualizado_em?: string;
          categoria_origem?: string;
          centro_custo_id?: string | null;
          conciliado?: boolean;
          conciliado_em?: string | null;
          conciliado_por?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          data_emissao?: string;
          data_pagamento?: string | null;
          data_vencimento?: string;
          descricao?: string;
          empresa_id?: string;
          forma_pagamento?: string | null;
          fornecedor_id?: string | null;
          id?: string;
          numero_documento?: string | null;
          observacao?: string | null;
          plano_conta_id?: string | null;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          status?: string;
          valor?: number;
          valor_pago?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "contas_pagar_centro_custo_id_fkey";
            columns: ["centro_custo_id"];
            isOneToOne: false;
            referencedRelation: "centros_custo";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contas_pagar_conciliado_por_fkey";
            columns: ["conciliado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contas_pagar_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contas_pagar_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey";
            columns: ["fornecedor_id"];
            isOneToOne: false;
            referencedRelation: "compras_fornecedores_score";
            referencedColumns: ["fornecedor_id"];
          },
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey";
            columns: ["fornecedor_id"];
            isOneToOne: false;
            referencedRelation: "fornecedores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contas_pagar_plano_conta_id_fkey";
            columns: ["plano_conta_id"];
            isOneToOne: false;
            referencedRelation: "plano_contas";
            referencedColumns: ["id"];
          },
        ];
      };
      contas_receber: {
        Row: {
          atualizado_em: string;
          centro_custo_id: string | null;
          cliente_id: string | null;
          criado_em: string;
          criado_por: string | null;
          data_emissao: string;
          descricao: string;
          empresa_id: string;
          id: string;
          numero_parcelas: number;
          observacao: string | null;
          plano_conta_id: string | null;
          referencia_id: string | null;
          referencia_tipo: string | null;
          status: string;
          valor_total: number;
        };
        Insert: {
          atualizado_em?: string;
          centro_custo_id?: string | null;
          cliente_id?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          data_emissao?: string;
          descricao: string;
          empresa_id: string;
          id?: string;
          numero_parcelas?: number;
          observacao?: string | null;
          plano_conta_id?: string | null;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          status?: string;
          valor_total: number;
        };
        Update: {
          atualizado_em?: string;
          centro_custo_id?: string | null;
          cliente_id?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          data_emissao?: string;
          descricao?: string;
          empresa_id?: string;
          id?: string;
          numero_parcelas?: number;
          observacao?: string | null;
          plano_conta_id?: string | null;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          status?: string;
          valor_total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "contas_receber_centro_custo_id_fkey";
            columns: ["centro_custo_id"];
            isOneToOne: false;
            referencedRelation: "centros_custo";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contas_receber_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contas_receber_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "crm_clientes_metricas";
            referencedColumns: ["cliente_id"];
          },
          {
            foreignKeyName: "contas_receber_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contas_receber_plano_conta_id_fkey";
            columns: ["plano_conta_id"];
            isOneToOne: false;
            referencedRelation: "plano_contas";
            referencedColumns: ["id"];
          },
        ];
      };
      contas_receber_parcelas: {
        Row: {
          conciliado: boolean;
          conciliado_em: string | null;
          conciliado_por: string | null;
          conta_receber_id: string;
          criado_em: string;
          data_recebimento: string | null;
          data_vencimento: string;
          empresa_id: string;
          forma_pagamento: string | null;
          id: string;
          numero_parcela: number;
          status: string;
          valor: number;
          valor_recebido: number | null;
        };
        Insert: {
          conciliado?: boolean;
          conciliado_em?: string | null;
          conciliado_por?: string | null;
          conta_receber_id: string;
          criado_em?: string;
          data_recebimento?: string | null;
          data_vencimento: string;
          empresa_id: string;
          forma_pagamento?: string | null;
          id?: string;
          numero_parcela: number;
          status?: string;
          valor: number;
          valor_recebido?: number | null;
        };
        Update: {
          conciliado?: boolean;
          conciliado_em?: string | null;
          conciliado_por?: string | null;
          conta_receber_id?: string;
          criado_em?: string;
          data_recebimento?: string | null;
          data_vencimento?: string;
          empresa_id?: string;
          forma_pagamento?: string | null;
          id?: string;
          numero_parcela?: number;
          status?: string;
          valor?: number;
          valor_recebido?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "contas_receber_parcelas_conciliado_por_fkey";
            columns: ["conciliado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contas_receber_parcelas_conta_receber_id_fkey";
            columns: ["conta_receber_id"];
            isOneToOne: false;
            referencedRelation: "contas_receber";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contas_receber_parcelas_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_auditoria: {
        Row: {
          acao: string;
          criado_em: string;
          dados_antigos: Json | null;
          dados_novos: Json | null;
          empresa_id: string;
          id: string;
          registro_id: string;
          tabela: string;
          usuario_id: string | null;
        };
        Insert: {
          acao: string;
          criado_em?: string;
          dados_antigos?: Json | null;
          dados_novos?: Json | null;
          empresa_id: string;
          id?: string;
          registro_id: string;
          tabela: string;
          usuario_id?: string | null;
        };
        Update: {
          acao?: string;
          criado_em?: string;
          dados_antigos?: Json | null;
          dados_novos?: Json | null;
          empresa_id?: string;
          id?: string;
          registro_id?: string;
          tabela?: string;
          usuario_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_auditoria_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_auditoria_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_campanhas: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          criado_em: string;
          cupom_id: string | null;
          dias_inatividade: number | null;
          empresa_id: string;
          gatilho: string;
          id: string;
          nome: string;
          template_id: string | null;
          ultimo_disparo_em: string | null;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          criado_em?: string;
          cupom_id?: string | null;
          dias_inatividade?: number | null;
          empresa_id: string;
          gatilho: string;
          id?: string;
          nome: string;
          template_id?: string | null;
          ultimo_disparo_em?: string | null;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          criado_em?: string;
          cupom_id?: string | null;
          dias_inatividade?: number | null;
          empresa_id?: string;
          gatilho?: string;
          id?: string;
          nome?: string;
          template_id?: string | null;
          ultimo_disparo_em?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_campanhas_cupom_id_fkey";
            columns: ["cupom_id"];
            isOneToOne: false;
            referencedRelation: "crm_cupons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_campanhas_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_campanhas_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "crm_templates_mensagem";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_cashback_config: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          criado_em: string;
          empresa_id: string;
          limite_por_venda: number;
          percentual: number;
          tipo: string;
          validade_dias: number | null;
          valor_fixo: number;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          criado_em?: string;
          empresa_id: string;
          limite_por_venda?: number;
          percentual?: number;
          tipo?: string;
          validade_dias?: number | null;
          valor_fixo?: number;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          criado_em?: string;
          empresa_id?: string;
          limite_por_venda?: number;
          percentual?: number;
          tipo?: string;
          validade_dias?: number | null;
          valor_fixo?: number;
        };
        Relationships: [
          {
            foreignKeyName: "crm_cashback_config_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: true;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_cashback_movimentacoes: {
        Row: {
          cliente_id: string;
          criado_em: string;
          criado_por: string | null;
          empresa_id: string;
          expirado: boolean;
          id: string;
          observacao: string | null;
          referencia_id: string | null;
          referencia_tipo: string | null;
          saldo_apos: number;
          tipo: string;
          validade_em: string | null;
          valor: number;
        };
        Insert: {
          cliente_id: string;
          criado_em?: string;
          criado_por?: string | null;
          empresa_id: string;
          expirado?: boolean;
          id?: string;
          observacao?: string | null;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          saldo_apos: number;
          tipo: string;
          validade_em?: string | null;
          valor: number;
        };
        Update: {
          cliente_id?: string;
          criado_em?: string;
          criado_por?: string | null;
          empresa_id?: string;
          expirado?: boolean;
          id?: string;
          observacao?: string | null;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          saldo_apos?: number;
          tipo?: string;
          validade_em?: string | null;
          valor?: number;
        };
        Relationships: [
          {
            foreignKeyName: "crm_cashback_movimentacoes_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_cashback_movimentacoes_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "crm_clientes_metricas";
            referencedColumns: ["cliente_id"];
          },
          {
            foreignKeyName: "crm_cashback_movimentacoes_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_cashback_movimentacoes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_cupons: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          canal_venda_id: string | null;
          codigo: string;
          compra_minima: number;
          criado_em: string;
          descricao: string | null;
          empresa_id: string;
          ficha_tecnica_gratis_id: string | null;
          id: string;
          limite_uso_por_cliente: number;
          limite_uso_total: number | null;
          segmento: string | null;
          tipo: string;
          valido_ate: string | null;
          valido_de: string | null;
          valor: number;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          canal_venda_id?: string | null;
          codigo: string;
          compra_minima?: number;
          criado_em?: string;
          descricao?: string | null;
          empresa_id: string;
          ficha_tecnica_gratis_id?: string | null;
          id?: string;
          limite_uso_por_cliente?: number;
          limite_uso_total?: number | null;
          segmento?: string | null;
          tipo: string;
          valido_ate?: string | null;
          valido_de?: string | null;
          valor?: number;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          canal_venda_id?: string | null;
          codigo?: string;
          compra_minima?: number;
          criado_em?: string;
          descricao?: string | null;
          empresa_id?: string;
          ficha_tecnica_gratis_id?: string | null;
          id?: string;
          limite_uso_por_cliente?: number;
          limite_uso_total?: number | null;
          segmento?: string | null;
          tipo?: string;
          valido_ate?: string | null;
          valido_de?: string | null;
          valor?: number;
        };
        Relationships: [
          {
            foreignKeyName: "crm_cupons_canal_venda_id_fkey";
            columns: ["canal_venda_id"];
            isOneToOne: false;
            referencedRelation: "canais_venda";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_cupons_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_cupons_ficha_tecnica_gratis_id_fkey";
            columns: ["ficha_tecnica_gratis_id"];
            isOneToOne: false;
            referencedRelation: "fichas_tecnicas";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_cupons_usos: {
        Row: {
          cliente_id: string;
          criado_em: string;
          cupom_id: string;
          empresa_id: string;
          id: string;
          referencia_id: string | null;
          referencia_tipo: string | null;
          valor_compra: number;
          valor_desconto: number;
        };
        Insert: {
          cliente_id: string;
          criado_em?: string;
          cupom_id: string;
          empresa_id: string;
          id?: string;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          valor_compra: number;
          valor_desconto: number;
        };
        Update: {
          cliente_id?: string;
          criado_em?: string;
          cupom_id?: string;
          empresa_id?: string;
          id?: string;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          valor_compra?: number;
          valor_desconto?: number;
        };
        Relationships: [
          {
            foreignKeyName: "crm_cupons_usos_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_cupons_usos_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "crm_clientes_metricas";
            referencedColumns: ["cliente_id"];
          },
          {
            foreignKeyName: "crm_cupons_usos_cupom_id_fkey";
            columns: ["cupom_id"];
            isOneToOne: false;
            referencedRelation: "crm_cupons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_cupons_usos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_fidelidade_config: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          criado_em: string;
          empresa_id: string;
          pontos_por_valor: number;
          validade_dias: number | null;
          valor_ponto_resgate: number;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          criado_em?: string;
          empresa_id: string;
          pontos_por_valor?: number;
          validade_dias?: number | null;
          valor_ponto_resgate?: number;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          criado_em?: string;
          empresa_id?: string;
          pontos_por_valor?: number;
          validade_dias?: number | null;
          valor_ponto_resgate?: number;
        };
        Relationships: [
          {
            foreignKeyName: "crm_fidelidade_config_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: true;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_fidelidade_movimentacoes: {
        Row: {
          cliente_id: string;
          criado_em: string;
          criado_por: string | null;
          empresa_id: string;
          expirado: boolean;
          id: string;
          observacao: string | null;
          pontos: number;
          referencia_id: string | null;
          referencia_tipo: string | null;
          saldo_apos: number;
          tipo: string;
          validade_em: string | null;
        };
        Insert: {
          cliente_id: string;
          criado_em?: string;
          criado_por?: string | null;
          empresa_id: string;
          expirado?: boolean;
          id?: string;
          observacao?: string | null;
          pontos: number;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          saldo_apos: number;
          tipo: string;
          validade_em?: string | null;
        };
        Update: {
          cliente_id?: string;
          criado_em?: string;
          criado_por?: string | null;
          empresa_id?: string;
          expirado?: boolean;
          id?: string;
          observacao?: string | null;
          pontos?: number;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          saldo_apos?: number;
          tipo?: string;
          validade_em?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_fidelidade_movimentacoes_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_fidelidade_movimentacoes_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "crm_clientes_metricas";
            referencedColumns: ["cliente_id"];
          },
          {
            foreignKeyName: "crm_fidelidade_movimentacoes_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_fidelidade_movimentacoes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_fidelidade_niveis: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          beneficios: string | null;
          criado_em: string;
          empresa_id: string;
          id: string;
          nome: string;
          ordem: number;
          pontos_minimos: number;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          beneficios?: string | null;
          criado_em?: string;
          empresa_id: string;
          id?: string;
          nome: string;
          ordem?: number;
          pontos_minimos?: number;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          beneficios?: string | null;
          criado_em?: string;
          empresa_id?: string;
          id?: string;
          nome?: string;
          ordem?: number;
          pontos_minimos?: number;
        };
        Relationships: [
          {
            foreignKeyName: "crm_fidelidade_niveis_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_funil_etapas: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          cor: string;
          criado_em: string;
          empresa_id: string;
          id: string;
          nome: string;
          ordem: number;
          tipo_final: string | null;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          cor?: string;
          criado_em?: string;
          empresa_id: string;
          id?: string;
          nome: string;
          ordem?: number;
          tipo_final?: string | null;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          cor?: string;
          criado_em?: string;
          empresa_id?: string;
          id?: string;
          nome?: string;
          ordem?: number;
          tipo_final?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_funil_etapas_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_interacoes: {
        Row: {
          assunto: string | null;
          campanha_id: string | null;
          canal: string;
          cliente_id: string;
          conteudo: string | null;
          criado_em: string;
          criado_por: string | null;
          direcao: string;
          empresa_id: string;
          id: string;
          reclamacao_resolvida: boolean | null;
          status_entrega: string;
          template_id: string | null;
          tipo: string;
        };
        Insert: {
          assunto?: string | null;
          campanha_id?: string | null;
          canal: string;
          cliente_id: string;
          conteudo?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          direcao?: string;
          empresa_id: string;
          id?: string;
          reclamacao_resolvida?: boolean | null;
          status_entrega?: string;
          template_id?: string | null;
          tipo?: string;
        };
        Update: {
          assunto?: string | null;
          campanha_id?: string | null;
          canal?: string;
          cliente_id?: string;
          conteudo?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          direcao?: string;
          empresa_id?: string;
          id?: string;
          reclamacao_resolvida?: boolean | null;
          status_entrega?: string;
          template_id?: string | null;
          tipo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_interacoes_campanha_fk";
            columns: ["campanha_id"];
            isOneToOne: false;
            referencedRelation: "crm_campanhas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_interacoes_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_interacoes_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "crm_clientes_metricas";
            referencedColumns: ["cliente_id"];
          },
          {
            foreignKeyName: "crm_interacoes_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_interacoes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_interacoes_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "crm_templates_mensagem";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_leads: {
        Row: {
          atualizado_em: string;
          cliente_id: string | null;
          convertido_em: string | null;
          criado_em: string;
          criado_por: string | null;
          email: string | null;
          empresa_id: string;
          etapa_id: string;
          id: string;
          motivo_perda: string | null;
          nome: string;
          observacoes: string | null;
          origem: string | null;
          probabilidade: number;
          proxima_acao: string | null;
          proxima_acao_em: string | null;
          responsavel_id: string | null;
          status: string;
          telefone: string | null;
          valor_estimado: number;
        };
        Insert: {
          atualizado_em?: string;
          cliente_id?: string | null;
          convertido_em?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          email?: string | null;
          empresa_id: string;
          etapa_id: string;
          id?: string;
          motivo_perda?: string | null;
          nome: string;
          observacoes?: string | null;
          origem?: string | null;
          probabilidade?: number;
          proxima_acao?: string | null;
          proxima_acao_em?: string | null;
          responsavel_id?: string | null;
          status?: string;
          telefone?: string | null;
          valor_estimado?: number;
        };
        Update: {
          atualizado_em?: string;
          cliente_id?: string | null;
          convertido_em?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          email?: string | null;
          empresa_id?: string;
          etapa_id?: string;
          id?: string;
          motivo_perda?: string | null;
          nome?: string;
          observacoes?: string | null;
          origem?: string | null;
          probabilidade?: number;
          proxima_acao?: string | null;
          proxima_acao_em?: string | null;
          responsavel_id?: string | null;
          status?: string;
          telefone?: string | null;
          valor_estimado?: number;
        };
        Relationships: [
          {
            foreignKeyName: "crm_leads_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_leads_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "crm_clientes_metricas";
            referencedColumns: ["cliente_id"];
          },
          {
            foreignKeyName: "crm_leads_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_leads_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_leads_etapa_id_fkey";
            columns: ["etapa_id"];
            isOneToOne: false;
            referencedRelation: "crm_funil_etapas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_leads_responsavel_id_fkey";
            columns: ["responsavel_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_leads_historico: {
        Row: {
          criado_em: string;
          criado_por: string | null;
          empresa_id: string;
          etapa_anterior_id: string | null;
          etapa_nova_id: string;
          id: string;
          lead_id: string;
        };
        Insert: {
          criado_em?: string;
          criado_por?: string | null;
          empresa_id: string;
          etapa_anterior_id?: string | null;
          etapa_nova_id: string;
          id?: string;
          lead_id: string;
        };
        Update: {
          criado_em?: string;
          criado_por?: string | null;
          empresa_id?: string;
          etapa_anterior_id?: string | null;
          etapa_nova_id?: string;
          id?: string;
          lead_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_leads_historico_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_leads_historico_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_leads_historico_etapa_anterior_id_fkey";
            columns: ["etapa_anterior_id"];
            isOneToOne: false;
            referencedRelation: "crm_funil_etapas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_leads_historico_etapa_nova_id_fkey";
            columns: ["etapa_nova_id"];
            isOneToOne: false;
            referencedRelation: "crm_funil_etapas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_leads_historico_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "crm_leads";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_segmentos_personalizados: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          criado_em: string;
          criterios: Json;
          descricao: string | null;
          empresa_id: string;
          id: string;
          nome: string;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          criado_em?: string;
          criterios?: Json;
          descricao?: string | null;
          empresa_id: string;
          id?: string;
          nome: string;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          criado_em?: string;
          criterios?: Json;
          descricao?: string | null;
          empresa_id?: string;
          id?: string;
          nome?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_segmentos_personalizados_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_tarefas: {
        Row: {
          atualizado_em: string;
          concluida_em: string | null;
          criado_em: string;
          criado_por: string | null;
          descricao: string | null;
          empresa_id: string;
          id: string;
          lembrete_em: string | null;
          prazo: string | null;
          prioridade: string;
          referencia_id: string | null;
          referencia_tipo: string | null;
          responsavel_id: string | null;
          status: string;
          titulo: string;
        };
        Insert: {
          atualizado_em?: string;
          concluida_em?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          descricao?: string | null;
          empresa_id: string;
          id?: string;
          lembrete_em?: string | null;
          prazo?: string | null;
          prioridade?: string;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          responsavel_id?: string | null;
          status?: string;
          titulo: string;
        };
        Update: {
          atualizado_em?: string;
          concluida_em?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          descricao?: string | null;
          empresa_id?: string;
          id?: string;
          lembrete_em?: string | null;
          prazo?: string | null;
          prioridade?: string;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          responsavel_id?: string | null;
          status?: string;
          titulo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_tarefas_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_tarefas_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_tarefas_responsavel_id_fkey";
            columns: ["responsavel_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_templates_mensagem: {
        Row: {
          assunto: string | null;
          ativo: boolean;
          atualizado_em: string;
          canal: string;
          conteudo: string;
          criado_em: string;
          empresa_id: string;
          id: string;
          nome: string;
        };
        Insert: {
          assunto?: string | null;
          ativo?: boolean;
          atualizado_em?: string;
          canal: string;
          conteudo: string;
          criado_em?: string;
          empresa_id: string;
          id?: string;
          nome: string;
        };
        Update: {
          assunto?: string | null;
          ativo?: boolean;
          atualizado_em?: string;
          canal?: string;
          conteudo?: string;
          criado_em?: string;
          empresa_id?: string;
          id?: string;
          nome?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_templates_mensagem_empresa_id_fkey";
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
          bloquear_venda_sem_estoque: boolean;
          created_at: string;
          id: string;
          margem_contribuicao_padrao: number | null;
          nome: string;
          tipo_negocio: string;
          updated_at: string;
          usuario_id: string;
        };
        Insert: {
          bloquear_venda_sem_estoque?: boolean;
          created_at?: string;
          id?: string;
          margem_contribuicao_padrao?: number | null;
          nome: string;
          tipo_negocio?: string;
          updated_at?: string;
          usuario_id: string;
        };
        Update: {
          bloquear_venda_sem_estoque?: boolean;
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
      entregadores: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          criado_em: string;
          empresa_id: string;
          id: string;
          nome: string;
          telefone: string | null;
          veiculo: string | null;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          criado_em?: string;
          empresa_id: string;
          id?: string;
          nome: string;
          telefone?: string | null;
          veiculo?: string | null;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          criado_em?: string;
          empresa_id?: string;
          id?: string;
          nome?: string;
          telefone?: string | null;
          veiculo?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "entregadores_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
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
      etiquetas_impressas: {
        Row: {
          codigo_interno: string;
          criado_por: string | null;
          emitido_em: string;
          empresa_id: string;
          fila_impressao_id: string | null;
          id: string;
          lote_id: string | null;
          quantidade_etiquetas: number;
          responsavel_id: string | null;
          tamanho: string;
        };
        Insert: {
          codigo_interno: string;
          criado_por?: string | null;
          emitido_em?: string;
          empresa_id: string;
          fila_impressao_id?: string | null;
          id?: string;
          lote_id?: string | null;
          quantidade_etiquetas?: number;
          responsavel_id?: string | null;
          tamanho?: string;
        };
        Update: {
          codigo_interno?: string;
          criado_por?: string | null;
          emitido_em?: string;
          empresa_id?: string;
          fila_impressao_id?: string | null;
          id?: string;
          lote_id?: string | null;
          quantidade_etiquetas?: number;
          responsavel_id?: string | null;
          tamanho?: string;
        };
        Relationships: [
          {
            foreignKeyName: "etiquetas_impressas_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "etiquetas_impressas_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "etiquetas_impressas_fila_impressao_id_fkey";
            columns: ["fila_impressao_id"];
            isOneToOne: false;
            referencedRelation: "fila_impressao";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "etiquetas_impressas_lote_id_fkey";
            columns: ["lote_id"];
            isOneToOne: false;
            referencedRelation: "estoque_lotes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "etiquetas_impressas_responsavel_id_fkey";
            columns: ["responsavel_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      expedicoes: {
        Row: {
          criado_em: string;
          empresa_id: string;
          entregador_id: string | null;
          horario_entrega: string | null;
          horario_saida: string | null;
          id: string;
          observacoes: string | null;
          pedido_id: string;
          responsavel_id: string | null;
          status: string;
        };
        Insert: {
          criado_em?: string;
          empresa_id: string;
          entregador_id?: string | null;
          horario_entrega?: string | null;
          horario_saida?: string | null;
          id?: string;
          observacoes?: string | null;
          pedido_id: string;
          responsavel_id?: string | null;
          status?: string;
        };
        Update: {
          criado_em?: string;
          empresa_id?: string;
          entregador_id?: string | null;
          horario_entrega?: string | null;
          horario_saida?: string | null;
          id?: string;
          observacoes?: string | null;
          pedido_id?: string;
          responsavel_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expedicoes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expedicoes_entregador_id_fkey";
            columns: ["entregador_id"];
            isOneToOne: false;
            referencedRelation: "entregadores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expedicoes_pedido_id_fkey";
            columns: ["pedido_id"];
            isOneToOne: false;
            referencedRelation: "pedidos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expedicoes_responsavel_id_fkey";
            columns: ["responsavel_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
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
          disponivel_como_adicional: boolean;
          empresa_id: string;
          id: string;
          margem_contribuicao_percentual: number | null;
          margem_contribuicao_percentual_alvo: number | null;
          markup_percentual: number | null;
          modo_preparo: string | null;
          nome: string;
          peso_bruto_total: number;
          peso_liquido_total: number;
          praca_producao_id: string | null;
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
          disponivel_como_adicional?: boolean;
          empresa_id: string;
          id?: string;
          margem_contribuicao_percentual?: number | null;
          margem_contribuicao_percentual_alvo?: number | null;
          markup_percentual?: number | null;
          modo_preparo?: string | null;
          nome: string;
          peso_bruto_total?: number;
          peso_liquido_total?: number;
          praca_producao_id?: string | null;
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
          disponivel_como_adicional?: boolean;
          empresa_id?: string;
          id?: string;
          margem_contribuicao_percentual?: number | null;
          margem_contribuicao_percentual_alvo?: number | null;
          markup_percentual?: number | null;
          modo_preparo?: string | null;
          nome?: string;
          peso_bruto_total?: number;
          peso_liquido_total?: number;
          praca_producao_id?: string | null;
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
            foreignKeyName: "fichas_tecnicas_praca_producao_id_fkey";
            columns: ["praca_producao_id"];
            isOneToOne: false;
            referencedRelation: "pracas_producao";
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
      fila_impressao: {
        Row: {
          atualizado_em: string;
          criado_em: string;
          criado_por: string | null;
          empresa_id: string;
          erro_mensagem: string | null;
          id: string;
          payload: Json;
          processado_em: string | null;
          referencia_id: string | null;
          referencia_tipo: string | null;
          status: string;
          tentativas: number;
          tipo: string;
        };
        Insert: {
          atualizado_em?: string;
          criado_em?: string;
          criado_por?: string | null;
          empresa_id: string;
          erro_mensagem?: string | null;
          id?: string;
          payload: Json;
          processado_em?: string | null;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          status?: string;
          tentativas?: number;
          tipo?: string;
        };
        Update: {
          atualizado_em?: string;
          criado_em?: string;
          criado_por?: string | null;
          empresa_id?: string;
          erro_mensagem?: string | null;
          id?: string;
          payload?: Json;
          processado_em?: string | null;
          referencia_id?: string | null;
          referencia_tipo?: string | null;
          status?: string;
          tentativas?: number;
          tipo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fila_impressao_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fila_impressao_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      financeiro_auditoria: {
        Row: {
          acao: string;
          criado_em: string;
          dados_antigos: Json | null;
          dados_novos: Json | null;
          empresa_id: string;
          id: string;
          registro_id: string;
          tabela: string;
          usuario_id: string | null;
        };
        Insert: {
          acao: string;
          criado_em?: string;
          dados_antigos?: Json | null;
          dados_novos?: Json | null;
          empresa_id: string;
          id?: string;
          registro_id: string;
          tabela: string;
          usuario_id?: string | null;
        };
        Update: {
          acao?: string;
          criado_em?: string;
          dados_antigos?: Json | null;
          dados_novos?: Json | null;
          empresa_id?: string;
          id?: string;
          registro_id?: string;
          tabela?: string;
          usuario_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "financeiro_auditoria_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financeiro_auditoria_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      fornecedor_ingredientes: {
        Row: {
          atualizado_em: string;
          codigo_fornecedor: string | null;
          embalagem: string | null;
          empresa_id: string;
          fator_conversao: number;
          fornecedor_id: string;
          id: string;
          ingrediente_id: string;
          marca: string | null;
          pedido_minimo: number | null;
          prazo_entrega_dias: number | null;
          preco_anterior: number | null;
          preco_unitario: number;
          preferencial: boolean;
          quantidade_embalagem: number;
          unidade_compra_id: string | null;
        };
        Insert: {
          atualizado_em?: string;
          codigo_fornecedor?: string | null;
          embalagem?: string | null;
          empresa_id: string;
          fator_conversao?: number;
          fornecedor_id: string;
          id?: string;
          ingrediente_id: string;
          marca?: string | null;
          pedido_minimo?: number | null;
          prazo_entrega_dias?: number | null;
          preco_anterior?: number | null;
          preco_unitario: number;
          preferencial?: boolean;
          quantidade_embalagem?: number;
          unidade_compra_id?: string | null;
        };
        Update: {
          atualizado_em?: string;
          codigo_fornecedor?: string | null;
          embalagem?: string | null;
          empresa_id?: string;
          fator_conversao?: number;
          fornecedor_id?: string;
          id?: string;
          ingrediente_id?: string;
          marca?: string | null;
          pedido_minimo?: number | null;
          prazo_entrega_dias?: number | null;
          preco_anterior?: number | null;
          preco_unitario?: number;
          preferencial?: boolean;
          quantidade_embalagem?: number;
          unidade_compra_id?: string | null;
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
            referencedRelation: "compras_fornecedores_score";
            referencedColumns: ["fornecedor_id"];
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
          {
            foreignKeyName: "fornecedor_ingredientes_unidade_compra_id_fkey";
            columns: ["unidade_compra_id"];
            isOneToOne: false;
            referencedRelation: "unidades_medida";
            referencedColumns: ["id"];
          },
        ];
      };
      fornecedor_ingredientes_historico_precos: {
        Row: {
          criado_por: string | null;
          data_referencia: string;
          empresa_id: string;
          fornecedor_ingrediente_id: string;
          id: string;
          preco_unitario: number;
        };
        Insert: {
          criado_por?: string | null;
          data_referencia?: string;
          empresa_id: string;
          fornecedor_ingrediente_id: string;
          id?: string;
          preco_unitario: number;
        };
        Update: {
          criado_por?: string | null;
          data_referencia?: string;
          empresa_id?: string;
          fornecedor_ingrediente_id?: string;
          id?: string;
          preco_unitario?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fornecedor_ingredientes_historic_fornecedor_ingrediente_id_fkey";
            columns: ["fornecedor_ingrediente_id"];
            isOneToOne: false;
            referencedRelation: "fornecedor_ingredientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fornecedor_ingredientes_historico_precos_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fornecedor_ingredientes_historico_precos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      fornecedores: {
        Row: {
          ativo: boolean;
          categorias: string[];
          chave_pix: string | null;
          condicoes_pagamento: string | null;
          contato_nome: string | null;
          created_at: string;
          dados_bancarios: Json | null;
          documento: string | null;
          email: string | null;
          empresa_id: string;
          endereco: string | null;
          id: string;
          inscricao_estadual: string | null;
          nome: string;
          nome_fantasia: string | null;
          observacoes: string | null;
          pedido_minimo: number | null;
          prazo_medio_entrega_dias: number | null;
          telefone: string | null;
          updated_at: string;
          whatsapp: string | null;
        };
        Insert: {
          ativo?: boolean;
          categorias?: string[];
          chave_pix?: string | null;
          condicoes_pagamento?: string | null;
          contato_nome?: string | null;
          created_at?: string;
          dados_bancarios?: Json | null;
          documento?: string | null;
          email?: string | null;
          empresa_id: string;
          endereco?: string | null;
          id?: string;
          inscricao_estadual?: string | null;
          nome: string;
          nome_fantasia?: string | null;
          observacoes?: string | null;
          pedido_minimo?: number | null;
          prazo_medio_entrega_dias?: number | null;
          telefone?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Update: {
          ativo?: boolean;
          categorias?: string[];
          chave_pix?: string | null;
          condicoes_pagamento?: string | null;
          contato_nome?: string | null;
          created_at?: string;
          dados_bancarios?: Json | null;
          documento?: string | null;
          email?: string | null;
          empresa_id?: string;
          endereco?: string | null;
          id?: string;
          inscricao_estadual?: string | null;
          nome?: string;
          nome_fantasia?: string | null;
          observacoes?: string | null;
          pedido_minimo?: number | null;
          prazo_medio_entrega_dias?: number | null;
          telefone?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
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
      funcionarios: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          beneficios_valor: number;
          carga_horaria_semanal: number;
          cargo: string | null;
          criado_em: string;
          data_admissao: string | null;
          data_desligamento: string | null;
          empresa_id: string;
          encargos_percentual: number;
          id: string;
          nome: string;
          observacoes: string | null;
          salario_base: number;
          tipo_contratacao: string;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          beneficios_valor?: number;
          carga_horaria_semanal?: number;
          cargo?: string | null;
          criado_em?: string;
          data_admissao?: string | null;
          data_desligamento?: string | null;
          empresa_id: string;
          encargos_percentual?: number;
          id?: string;
          nome: string;
          observacoes?: string | null;
          salario_base?: number;
          tipo_contratacao?: string;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          beneficios_valor?: number;
          carga_horaria_semanal?: number;
          cargo?: string | null;
          criado_em?: string;
          data_admissao?: string | null;
          data_desligamento?: string | null;
          empresa_id?: string;
          encargos_percentual?: number;
          id?: string;
          nome?: string;
          observacoes?: string | null;
          salario_base?: number;
          tipo_contratacao?: string;
        };
        Relationships: [
          {
            foreignKeyName: "funcionarios_empresa_id_fkey";
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
      integracoes_canais: {
        Row: {
          atualizado_em: string;
          canal_venda_id: string | null;
          conectado_em: string | null;
          credenciais_criptografadas: string | null;
          criado_em: string;
          empresa_id: string;
          id: string;
          identificador_externo: string | null;
          metadata: Json;
          provedor: string;
          status_conexao: string;
        };
        Insert: {
          atualizado_em?: string;
          canal_venda_id?: string | null;
          conectado_em?: string | null;
          credenciais_criptografadas?: string | null;
          criado_em?: string;
          empresa_id: string;
          id?: string;
          identificador_externo?: string | null;
          metadata?: Json;
          provedor: string;
          status_conexao?: string;
        };
        Update: {
          atualizado_em?: string;
          canal_venda_id?: string | null;
          conectado_em?: string | null;
          credenciais_criptografadas?: string | null;
          criado_em?: string;
          empresa_id?: string;
          id?: string;
          identificador_externo?: string | null;
          metadata?: Json;
          provedor?: string;
          status_conexao?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integracoes_canais_canal_venda_id_fkey";
            columns: ["canal_venda_id"];
            isOneToOne: false;
            referencedRelation: "canais_venda";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integracoes_canais_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      integracoes_logs_sincronizacao: {
        Row: {
          criado_em: string;
          empresa_id: string;
          id: string;
          integracao_id: string | null;
          mensagem: string | null;
          payload_resumo: Json | null;
          status: string;
          tipo_evento: string;
        };
        Insert: {
          criado_em?: string;
          empresa_id: string;
          id?: string;
          integracao_id?: string | null;
          mensagem?: string | null;
          payload_resumo?: Json | null;
          status: string;
          tipo_evento: string;
        };
        Update: {
          criado_em?: string;
          empresa_id?: string;
          id?: string;
          integracao_id?: string | null;
          mensagem?: string | null;
          payload_resumo?: Json | null;
          status?: string;
          tipo_evento?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integracoes_logs_sincronizacao_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integracoes_logs_sincronizacao_integracao_id_fkey";
            columns: ["integracao_id"];
            isOneToOne: false;
            referencedRelation: "integracoes_canais";
            referencedColumns: ["id"];
          },
        ];
      };
      integracoes_webhooks_recebidos: {
        Row: {
          assinatura_valida: boolean;
          criado_em: string;
          empresa_id: string | null;
          erro_mensagem: string | null;
          id: string;
          payload: Json;
          processado: boolean;
          provedor: string;
        };
        Insert: {
          assinatura_valida?: boolean;
          criado_em?: string;
          empresa_id?: string | null;
          erro_mensagem?: string | null;
          id?: string;
          payload: Json;
          processado?: boolean;
          provedor: string;
        };
        Update: {
          assinatura_valida?: boolean;
          criado_em?: string;
          empresa_id?: string | null;
          erro_mensagem?: string | null;
          id?: string;
          payload?: Json;
          processado?: boolean;
          provedor?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integracoes_webhooks_recebidos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
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
            referencedRelation: "compras_fornecedores_score";
            referencedColumns: ["fornecedor_id"];
          },
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
      mesas: {
        Row: {
          atualizado_em: string;
          capacidade: number | null;
          criado_em: string;
          empresa_id: string;
          id: string;
          identificador: string;
          status: string;
        };
        Insert: {
          atualizado_em?: string;
          capacidade?: number | null;
          criado_em?: string;
          empresa_id: string;
          id?: string;
          identificador: string;
          status?: string;
        };
        Update: {
          atualizado_em?: string;
          capacidade?: number | null;
          criado_em?: string;
          empresa_id?: string;
          id?: string;
          identificador?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mesas_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
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
      pagamentos: {
        Row: {
          caixa_id: string | null;
          criado_em: string;
          criado_por: string | null;
          empresa_id: string;
          forma_pagamento: string;
          id: string;
          observacao: string | null;
          pedido_id: string;
          troco_para: number | null;
          valor: number;
        };
        Insert: {
          caixa_id?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          empresa_id: string;
          forma_pagamento: string;
          id?: string;
          observacao?: string | null;
          pedido_id: string;
          troco_para?: number | null;
          valor: number;
        };
        Update: {
          caixa_id?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          empresa_id?: string;
          forma_pagamento?: string;
          id?: string;
          observacao?: string | null;
          pedido_id?: string;
          troco_para?: number | null;
          valor?: number;
        };
        Relationships: [
          {
            foreignKeyName: "pagamentos_caixa_id_fkey";
            columns: ["caixa_id"];
            isOneToOne: false;
            referencedRelation: "caixas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pagamentos_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pagamentos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pagamentos_pedido_id_fkey";
            columns: ["pedido_id"];
            isOneToOne: false;
            referencedRelation: "pedidos";
            referencedColumns: ["id"];
          },
        ];
      };
      pedido_item_adicionais: {
        Row: {
          criado_em: string;
          custo_unitario_snapshot: number;
          empresa_id: string;
          ficha_tecnica_id: string;
          id: string;
          pedido_item_id: string;
          preco_unitario_praticado: number;
          quantidade: number;
          valor_total: number | null;
        };
        Insert: {
          criado_em?: string;
          custo_unitario_snapshot?: number;
          empresa_id: string;
          ficha_tecnica_id: string;
          id?: string;
          pedido_item_id: string;
          preco_unitario_praticado?: number;
          quantidade: number;
          valor_total?: number | null;
        };
        Update: {
          criado_em?: string;
          custo_unitario_snapshot?: number;
          empresa_id?: string;
          ficha_tecnica_id?: string;
          id?: string;
          pedido_item_id?: string;
          preco_unitario_praticado?: number;
          quantidade?: number;
          valor_total?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "pedido_item_adicionais_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedido_item_adicionais_ficha_tecnica_id_fkey";
            columns: ["ficha_tecnica_id"];
            isOneToOne: false;
            referencedRelation: "fichas_tecnicas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedido_item_adicionais_pedido_item_id_fkey";
            columns: ["pedido_item_id"];
            isOneToOne: false;
            referencedRelation: "pedido_itens";
            referencedColumns: ["id"];
          },
        ];
      };
      pedido_itens: {
        Row: {
          criado_em: string;
          custo_unitario_snapshot: number;
          desconto_valor: number;
          empresa_id: string;
          ficha_tecnica_id: string;
          id: string;
          observacao: string | null;
          ordem: number;
          pedido_id: string;
          preco_unitario_praticado: number;
          quantidade: number;
          valor_total: number | null;
        };
        Insert: {
          criado_em?: string;
          custo_unitario_snapshot?: number;
          desconto_valor?: number;
          empresa_id: string;
          ficha_tecnica_id: string;
          id?: string;
          observacao?: string | null;
          ordem?: number;
          pedido_id: string;
          preco_unitario_praticado?: number;
          quantidade: number;
          valor_total?: number | null;
        };
        Update: {
          criado_em?: string;
          custo_unitario_snapshot?: number;
          desconto_valor?: number;
          empresa_id?: string;
          ficha_tecnica_id?: string;
          id?: string;
          observacao?: string | null;
          ordem?: number;
          pedido_id?: string;
          preco_unitario_praticado?: number;
          quantidade?: number;
          valor_total?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "pedido_itens_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedido_itens_ficha_tecnica_id_fkey";
            columns: ["ficha_tecnica_id"];
            isOneToOne: false;
            referencedRelation: "fichas_tecnicas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey";
            columns: ["pedido_id"];
            isOneToOne: false;
            referencedRelation: "pedidos";
            referencedColumns: ["id"];
          },
        ];
      };
      pedido_status_historico: {
        Row: {
          criado_em: string;
          criado_por: string | null;
          empresa_id: string;
          id: string;
          motivo: string | null;
          pedido_id: string;
          status_anterior: string | null;
          status_novo: string;
        };
        Insert: {
          criado_em?: string;
          criado_por?: string | null;
          empresa_id: string;
          id?: string;
          motivo?: string | null;
          pedido_id: string;
          status_anterior?: string | null;
          status_novo: string;
        };
        Update: {
          criado_em?: string;
          criado_por?: string | null;
          empresa_id?: string;
          id?: string;
          motivo?: string | null;
          pedido_id?: string;
          status_anterior?: string | null;
          status_novo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pedido_status_historico_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedido_status_historico_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedido_status_historico_pedido_id_fkey";
            columns: ["pedido_id"];
            isOneToOne: false;
            referencedRelation: "pedidos";
            referencedColumns: ["id"];
          },
        ];
      };
      pedidos: {
        Row: {
          acrescimo_valor: number;
          atualizado_em: string;
          canal_venda_id: string | null;
          cancelado_em: string | null;
          cliente_id: string | null;
          comanda_id: string | null;
          confirmado_em: string | null;
          criado_em: string;
          criado_por: string | null;
          desconto_percentual: number;
          desconto_valor_fixo: number;
          empresa_id: string;
          entregue_em: string | null;
          id: string;
          id_externo: string | null;
          motivo_cancelamento: string | null;
          numero: number;
          observacoes: string | null;
          provedor_origem: string | null;
          responsavel_id: string | null;
          status: string;
          subtotal: number;
          taxa_entrega: number;
          tipo: string;
          total: number;
        };
        Insert: {
          acrescimo_valor?: number;
          atualizado_em?: string;
          canal_venda_id?: string | null;
          cancelado_em?: string | null;
          cliente_id?: string | null;
          comanda_id?: string | null;
          confirmado_em?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          desconto_percentual?: number;
          desconto_valor_fixo?: number;
          empresa_id: string;
          entregue_em?: string | null;
          id?: string;
          id_externo?: string | null;
          motivo_cancelamento?: string | null;
          numero?: number;
          observacoes?: string | null;
          provedor_origem?: string | null;
          responsavel_id?: string | null;
          status?: string;
          subtotal?: number;
          taxa_entrega?: number;
          tipo: string;
          total?: number;
        };
        Update: {
          acrescimo_valor?: number;
          atualizado_em?: string;
          canal_venda_id?: string | null;
          cancelado_em?: string | null;
          cliente_id?: string | null;
          comanda_id?: string | null;
          confirmado_em?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          desconto_percentual?: number;
          desconto_valor_fixo?: number;
          empresa_id?: string;
          entregue_em?: string | null;
          id?: string;
          id_externo?: string | null;
          motivo_cancelamento?: string | null;
          numero?: number;
          observacoes?: string | null;
          provedor_origem?: string | null;
          responsavel_id?: string | null;
          status?: string;
          subtotal?: number;
          taxa_entrega?: number;
          tipo?: string;
          total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "pedidos_canal_venda_id_fkey";
            columns: ["canal_venda_id"];
            isOneToOne: false;
            referencedRelation: "canais_venda";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedidos_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedidos_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "crm_clientes_metricas";
            referencedColumns: ["cliente_id"];
          },
          {
            foreignKeyName: "pedidos_comanda_id_fkey";
            columns: ["comanda_id"];
            isOneToOne: false;
            referencedRelation: "comandas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedidos_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedidos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedidos_responsavel_id_fkey";
            columns: ["responsavel_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pedidos_compra: {
        Row: {
          aprovado_em: string | null;
          aprovado_por: string | null;
          atualizado_em: string;
          centro_custo_id: string | null;
          condicao_pagamento: string | null;
          cotacao_origem_id: string | null;
          criado_em: string;
          criado_por: string | null;
          data_pedido: string;
          data_prevista_entrega: string | null;
          desconto_percentual: number;
          desconto_valor_fixo: number;
          empresa_id: string;
          fornecedor_id: string;
          id: string;
          numero: number | null;
          numero_parcelas: number;
          observacao: string | null;
          plano_conta_id: string | null;
          solicitacao_origem_id: string | null;
          status: string;
          subtotal: number;
          total: number;
          valor_frete: number;
          valor_impostos: number;
        };
        Insert: {
          aprovado_em?: string | null;
          aprovado_por?: string | null;
          atualizado_em?: string;
          centro_custo_id?: string | null;
          condicao_pagamento?: string | null;
          cotacao_origem_id?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          data_pedido?: string;
          data_prevista_entrega?: string | null;
          desconto_percentual?: number;
          desconto_valor_fixo?: number;
          empresa_id: string;
          fornecedor_id: string;
          id?: string;
          numero?: number | null;
          numero_parcelas?: number;
          observacao?: string | null;
          plano_conta_id?: string | null;
          solicitacao_origem_id?: string | null;
          status?: string;
          subtotal?: number;
          total?: number;
          valor_frete?: number;
          valor_impostos?: number;
        };
        Update: {
          aprovado_em?: string | null;
          aprovado_por?: string | null;
          atualizado_em?: string;
          centro_custo_id?: string | null;
          condicao_pagamento?: string | null;
          cotacao_origem_id?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          data_pedido?: string;
          data_prevista_entrega?: string | null;
          desconto_percentual?: number;
          desconto_valor_fixo?: number;
          empresa_id?: string;
          fornecedor_id?: string;
          id?: string;
          numero?: number | null;
          numero_parcelas?: number;
          observacao?: string | null;
          plano_conta_id?: string | null;
          solicitacao_origem_id?: string | null;
          status?: string;
          subtotal?: number;
          total?: number;
          valor_frete?: number;
          valor_impostos?: number;
        };
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_aprovado_por_fkey";
            columns: ["aprovado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedidos_compra_centro_custo_id_fkey";
            columns: ["centro_custo_id"];
            isOneToOne: false;
            referencedRelation: "centros_custo";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedidos_compra_cotacao_origem_id_fkey";
            columns: ["cotacao_origem_id"];
            isOneToOne: false;
            referencedRelation: "compras_cotacoes";
            referencedColumns: ["id"];
          },
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
            referencedRelation: "compras_fornecedores_score";
            referencedColumns: ["fornecedor_id"];
          },
          {
            foreignKeyName: "pedidos_compra_fornecedor_id_fkey";
            columns: ["fornecedor_id"];
            isOneToOne: false;
            referencedRelation: "fornecedores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedidos_compra_plano_conta_id_fkey";
            columns: ["plano_conta_id"];
            isOneToOne: false;
            referencedRelation: "plano_contas";
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
      pedidos_compra_historico: {
        Row: {
          criado_em: string;
          criado_por: string | null;
          empresa_id: string;
          id: string;
          motivo: string | null;
          pedido_id: string;
          status_anterior: string | null;
          status_novo: string;
        };
        Insert: {
          criado_em?: string;
          criado_por?: string | null;
          empresa_id: string;
          id?: string;
          motivo?: string | null;
          pedido_id: string;
          status_anterior?: string | null;
          status_novo: string;
        };
        Update: {
          criado_em?: string;
          criado_por?: string | null;
          empresa_id?: string;
          id?: string;
          motivo?: string | null;
          pedido_id?: string;
          status_anterior?: string | null;
          status_novo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_historico_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedidos_compra_historico_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedidos_compra_historico_pedido_id_fkey";
            columns: ["pedido_id"];
            isOneToOne: false;
            referencedRelation: "pedidos_compra";
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
          quantidade_recusada: number;
          valor_total: number | null;
        };
        Insert: {
          id?: string;
          ingrediente_id: string;
          pedido_id: string;
          preco_unitario: number;
          quantidade_pedida: number;
          quantidade_recebida?: number;
          quantidade_recusada?: number;
          valor_total?: number | null;
        };
        Update: {
          id?: string;
          ingrediente_id?: string;
          pedido_id?: string;
          preco_unitario?: number;
          quantidade_pedida?: number;
          quantidade_recebida?: number;
          quantidade_recusada?: number;
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
      plano_contas: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          codigo: string;
          conta_pai_id: string | null;
          criado_em: string;
          empresa_id: string;
          id: string;
          nome: string;
          tipo: string;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          codigo: string;
          conta_pai_id?: string | null;
          criado_em?: string;
          empresa_id: string;
          id?: string;
          nome: string;
          tipo: string;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          codigo?: string;
          conta_pai_id?: string | null;
          criado_em?: string;
          empresa_id?: string;
          id?: string;
          nome?: string;
          tipo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plano_contas_conta_pai_id_fkey";
            columns: ["conta_pai_id"];
            isOneToOne: false;
            referencedRelation: "plano_contas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plano_contas_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      pracas_producao: {
        Row: {
          ativo: boolean;
          criado_em: string;
          empresa_id: string | null;
          id: string;
          nome: string;
          ordem_exibicao: number;
        };
        Insert: {
          ativo?: boolean;
          criado_em?: string;
          empresa_id?: string | null;
          id?: string;
          nome: string;
          ordem_exibicao?: number;
        };
        Update: {
          ativo?: boolean;
          criado_em?: string;
          empresa_id?: string | null;
          id?: string;
          nome?: string;
          ordem_exibicao?: number;
        };
        Relationships: [
          {
            foreignKeyName: "pracas_producao_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
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
          centro_custo_id: string | null;
          criado_em: string;
          criado_por: string | null;
          data_necessaria: string | null;
          empresa_id: string;
          id: string;
          justificativa: string | null;
          numero: number | null;
          observacao: string | null;
          prioridade: string;
          setor: string | null;
          status: string;
        };
        Insert: {
          atualizado_em?: string;
          centro_custo_id?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          data_necessaria?: string | null;
          empresa_id: string;
          id?: string;
          justificativa?: string | null;
          numero?: number | null;
          observacao?: string | null;
          prioridade?: string;
          setor?: string | null;
          status?: string;
        };
        Update: {
          atualizado_em?: string;
          centro_custo_id?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          data_necessaria?: string | null;
          empresa_id?: string;
          id?: string;
          justificativa?: string | null;
          numero?: number | null;
          observacao?: string | null;
          prioridade?: string;
          setor?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "solicitacoes_compra_centro_custo_id_fkey";
            columns: ["centro_custo_id"];
            isOneToOne: false;
            referencedRelation: "centros_custo";
            referencedColumns: ["id"];
          },
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
      solicitacoes_compra_aprovacoes: {
        Row: {
          acao: string;
          aprovador_id: string | null;
          comentario: string | null;
          criado_em: string;
          empresa_id: string;
          id: string;
          nivel_id: string | null;
          solicitacao_id: string;
        };
        Insert: {
          acao: string;
          aprovador_id?: string | null;
          comentario?: string | null;
          criado_em?: string;
          empresa_id: string;
          id?: string;
          nivel_id?: string | null;
          solicitacao_id: string;
        };
        Update: {
          acao?: string;
          aprovador_id?: string | null;
          comentario?: string | null;
          criado_em?: string;
          empresa_id?: string;
          id?: string;
          nivel_id?: string | null;
          solicitacao_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "solicitacoes_compra_aprovacoes_aprovador_id_fkey";
            columns: ["aprovador_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "solicitacoes_compra_aprovacoes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "solicitacoes_compra_aprovacoes_nivel_id_fkey";
            columns: ["nivel_id"];
            isOneToOne: false;
            referencedRelation: "compras_niveis_aprovacao";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "solicitacoes_compra_aprovacoes_solicitacao_id_fkey";
            columns: ["solicitacao_id"];
            isOneToOne: false;
            referencedRelation: "solicitacoes_compra";
            referencedColumns: ["id"];
          },
        ];
      };
      solicitacoes_compra_historico: {
        Row: {
          criado_em: string;
          criado_por: string | null;
          empresa_id: string;
          id: string;
          motivo: string | null;
          solicitacao_id: string;
          status_anterior: string | null;
          status_novo: string;
        };
        Insert: {
          criado_em?: string;
          criado_por?: string | null;
          empresa_id: string;
          id?: string;
          motivo?: string | null;
          solicitacao_id: string;
          status_anterior?: string | null;
          status_novo: string;
        };
        Update: {
          criado_em?: string;
          criado_por?: string | null;
          empresa_id?: string;
          id?: string;
          motivo?: string | null;
          solicitacao_id?: string;
          status_anterior?: string | null;
          status_novo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "solicitacoes_compra_historico_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "solicitacoes_compra_historico_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "solicitacoes_compra_historico_solicitacao_id_fkey";
            columns: ["solicitacao_id"];
            isOneToOne: false;
            referencedRelation: "solicitacoes_compra";
            referencedColumns: ["id"];
          },
        ];
      };
      solicitacoes_compra_itens: {
        Row: {
          id: string;
          ingrediente_id: string;
          observacao: string | null;
          preco_estimado: number;
          quantidade: number;
          solicitacao_id: string;
        };
        Insert: {
          id?: string;
          ingrediente_id: string;
          observacao?: string | null;
          preco_estimado?: number;
          quantidade: number;
          solicitacao_id: string;
        };
        Update: {
          id?: string;
          ingrediente_id?: string;
          observacao?: string | null;
          preco_estimado?: number;
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
      usuarios_empresa: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          convidado_por: string | null;
          criado_em: string;
          empresa_id: string;
          id: string;
          papel: string;
          usuario_id: string;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          convidado_por?: string | null;
          criado_em?: string;
          empresa_id: string;
          id?: string;
          papel?: string;
          usuario_id: string;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          convidado_por?: string | null;
          criado_em?: string;
          empresa_id?: string;
          id?: string;
          papel?: string;
          usuario_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_convidado_por_fkey";
            columns: ["convidado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "usuarios_empresa_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "usuarios_empresa_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      vendas: {
        Row: {
          atualizado_em: string;
          canal_venda_id: string | null;
          cliente_id: string | null;
          criado_em: string;
          criado_por: string | null;
          custo_unitario_snapshot: number;
          data_venda: string;
          empresa_id: string;
          ficha_tecnica_id: string;
          id: string;
          margem_total: number | null;
          observacao: string | null;
          preco_unitario_praticado: number;
          quantidade: number;
          valor_total: number | null;
        };
        Insert: {
          atualizado_em?: string;
          canal_venda_id?: string | null;
          cliente_id?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          custo_unitario_snapshot?: number;
          data_venda?: string;
          empresa_id: string;
          ficha_tecnica_id: string;
          id?: string;
          margem_total?: number | null;
          observacao?: string | null;
          preco_unitario_praticado: number;
          quantidade: number;
          valor_total?: number | null;
        };
        Update: {
          atualizado_em?: string;
          canal_venda_id?: string | null;
          cliente_id?: string | null;
          criado_em?: string;
          criado_por?: string | null;
          custo_unitario_snapshot?: number;
          data_venda?: string;
          empresa_id?: string;
          ficha_tecnica_id?: string;
          id?: string;
          margem_total?: number | null;
          observacao?: string | null;
          preco_unitario_praticado?: number;
          quantidade?: number;
          valor_total?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "vendas_canal_venda_id_fkey";
            columns: ["canal_venda_id"];
            isOneToOne: false;
            referencedRelation: "canais_venda";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vendas_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vendas_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "crm_clientes_metricas";
            referencedColumns: ["cliente_id"];
          },
          {
            foreignKeyName: "vendas_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vendas_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vendas_ficha_tecnica_id_fkey";
            columns: ["ficha_tecnica_id"];
            isOneToOne: false;
            referencedRelation: "fichas_tecnicas";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      compras_fornecedores_score: {
        Row: {
          atendimento_media: number | null;
          empresa_id: string | null;
          fornecedor_id: string | null;
          nome: string | null;
          pontualidade_media: number | null;
          preco_media: number | null;
          qualidade_media: number | null;
          score_geral: number | null;
          taxa_entrega_completa: number | null;
          total_avaliacoes: number | null;
          total_pedidos_recebidos: number | null;
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
      crm_cashback_saldos: {
        Row: {
          cliente_id: string | null;
          empresa_id: string | null;
          saldo: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_cashback_movimentacoes_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_cashback_movimentacoes_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "crm_clientes_metricas";
            referencedColumns: ["cliente_id"];
          },
          {
            foreignKeyName: "crm_cashback_movimentacoes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_clientes_metricas: {
        Row: {
          cliente_id: string | null;
          dias_desde_ultima_compra: number | null;
          empresa_id: string | null;
          primeira_compra: string | null;
          quantidade_compras: number | null;
          ticket_medio: number | null;
          total_gasto: number | null;
          ultima_compra: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_fidelidade_saldos: {
        Row: {
          cliente_id: string | null;
          empresa_id: string | null;
          saldo: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_fidelidade_movimentacoes_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_fidelidade_movimentacoes_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "crm_clientes_metricas";
            referencedColumns: ["cliente_id"];
          },
          {
            foreignKeyName: "crm_fidelidade_movimentacoes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      fn_abrir_caixa: {
        Args: {
          p_empresa_id: string;
          p_observacoes?: string;
          p_saldo_inicial: number;
        };
        Returns: string;
      };
      fn_abrir_comanda: {
        Args: { p_mesa_id: string; p_quantidade_pessoas?: number };
        Returns: string;
      };
      fn_aprovar_pedido_compra: {
        Args: { p_pedido_id: string };
        Returns: undefined;
      };
      fn_aprovar_solicitacao_compra: {
        Args: { p_comentario?: string; p_solicitacao_id: string };
        Returns: undefined;
      };
      fn_buscar_usuario_por_email: {
        Args: { p_email: string };
        Returns: {
          email: string;
          id: string;
          nome_completo: string;
        }[];
      };
      fn_cancelar_conta_pagar: {
        Args: { p_conta_pagar_id: string; p_motivo: string };
        Returns: undefined;
      };
      fn_cancelar_conta_receber: {
        Args: { p_conta_receber_id: string; p_motivo: string };
        Returns: undefined;
      };
      fn_cancelar_pedido: {
        Args: { p_motivo: string; p_pedido_id: string };
        Returns: undefined;
      };
      fn_conceder_pontos_fidelidade: {
        Args: {
          p_cliente_id: string;
          p_referencia_id: string;
          p_referencia_tipo: string;
          p_valor_compra: number;
        };
        Returns: undefined;
      };
      fn_conceder_pontos_manual: {
        Args: { p_cliente_id: string; p_observacao?: string; p_pontos: number };
        Returns: undefined;
      };
      fn_concluir_inventario: {
        Args: { p_inventario_id: string };
        Returns: undefined;
      };
      fn_concluir_pedido: { Args: { p_pedido_id: string }; Returns: undefined };
      fn_concluir_producao: {
        Args: { p_producao_id: string };
        Returns: undefined;
      };
      fn_confirmar_pedido: {
        Args: { p_pedido_id: string };
        Returns: undefined;
      };
      fn_converter_lead_em_cliente: {
        Args: { p_lead_id: string };
        Returns: string;
      };
      fn_converter_lista_em_pedidos: {
        Args: { p_lista_id: string };
        Returns: string[];
      };
      fn_creditar_cashback: {
        Args: {
          p_cliente_id: string;
          p_referencia_id: string;
          p_referencia_tipo: string;
          p_valor_compra: number;
        };
        Returns: undefined;
      };
      fn_criar_conta_receber: {
        Args: {
          p_centro_custo_id?: string;
          p_cliente_id?: string;
          p_descricao: string;
          p_empresa_id: string;
          p_numero_parcelas: number;
          p_observacao?: string;
          p_plano_conta_id?: string;
          p_primeira_data_vencimento: string;
          p_referencia_id?: string;
          p_referencia_tipo?: string;
          p_valor_total: number;
        };
        Returns: string;
      };
      fn_duplicar_ficha_tecnica: {
        Args: { p_ficha_id: string };
        Returns: string;
      };
      fn_emitir_etiqueta: {
        Args: {
          p_empresa_id: string;
          p_lote_id: string;
          p_payload: Json;
          p_quantidade_etiquetas: number;
          p_tamanho: string;
        };
        Returns: string;
      };
      fn_escolher_melhor_proposta_cotacao: {
        Args: { p_cotacao_id: string };
        Returns: string;
      };
      fn_estornar_movimentacao_cashback: {
        Args: { p_movimentacao_id: string; p_observacao?: string };
        Returns: undefined;
      };
      fn_estornar_movimentacao_fidelidade: {
        Args: { p_movimentacao_id: string; p_observacao?: string };
        Returns: undefined;
      };
      fn_estornar_uso_cupom: { Args: { p_uso_id: string }; Returns: undefined };
      fn_expirar_cashback: { Args: { p_empresa_id: string }; Returns: number };
      fn_expirar_pontos_fidelidade: {
        Args: { p_empresa_id: string };
        Returns: number;
      };
      fn_fechar_caixa: {
        Args: {
          p_caixa_id: string;
          p_observacoes?: string;
          p_saldo_informado: number;
        };
        Returns: undefined;
      };
      fn_fechar_comanda: { Args: { p_comanda_id: string }; Returns: undefined };
      fn_finalizar_cotacao: {
        Args: {
          p_cotacao_id: string;
          p_escolha_automatica?: boolean;
          p_fornecedor_vencedor_id: string;
          p_justificativa?: string;
        };
        Returns: string;
      };
      fn_gerar_contas_pagar_do_mes: {
        Args: { p_empresa_id: string; p_mes_referencia: string };
        Returns: number;
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
      fn_iniciar_preparo_pedido: {
        Args: { p_pedido_id: string };
        Returns: undefined;
      };
      fn_nivel_aprovacao_aplicavel: {
        Args: {
          p_centro_custo_id: string;
          p_empresa_id: string;
          p_valor: number;
        };
        Returns: {
          ativo: boolean;
          atualizado_em: string;
          centro_custo_id: string | null;
          criado_em: string;
          empresa_id: string;
          id: string;
          nome: string;
          ordem: number;
          papel_aprovador: string | null;
          usuario_aprovador_id: string | null;
          valor_maximo: number | null;
          valor_minimo: number;
        };
        SetofOptions: {
          from: "*";
          to: "compras_niveis_aprovacao";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      fn_notificar_divergencia_recebimento: {
        Args: { p_empresa_id: string; p_mensagem: string; p_pedido_id: string };
        Returns: undefined;
      };
      fn_perfis_visiveis_compras: {
        Args: { p_empresa_id: string };
        Returns: {
          email: string;
          id: string;
          nome_completo: string;
        }[];
      };
      fn_perfis_visiveis_financeiro: {
        Args: { p_empresa_id: string };
        Returns: {
          email: string;
          id: string;
          nome_completo: string;
        }[];
      };
      fn_pode_aprovar_solicitacao: {
        Args: { p_solicitacao_id: string };
        Returns: boolean;
      };
      fn_proximo_numero_compras: {
        Args: { p_empresa_id: string; p_tipo: string };
        Returns: number;
      };
      fn_proximo_numero_pedido: {
        Args: { p_empresa_id: string };
        Returns: number;
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
      fn_registrar_movimentacao_caixa: {
        Args: {
          p_caixa_id: string;
          p_forma_pagamento?: string;
          p_observacao?: string;
          p_referencia_id?: string;
          p_referencia_tipo?: string;
          p_tipo: string;
          p_valor: number;
        };
        Returns: string;
      };
      fn_registrar_pagamento_conta_pagar: {
        Args: {
          p_conta_pagar_id: string;
          p_data_pagamento?: string;
          p_forma_pagamento: string;
          p_valor_pago: number;
        };
        Returns: undefined;
      };
      fn_registrar_pagamento_pedido: {
        Args: {
          p_caixa_id?: string;
          p_forma_pagamento: string;
          p_observacao?: string;
          p_pedido_id: string;
          p_troco_para?: number;
          p_valor: number;
        };
        Returns: string;
      };
      fn_registrar_recebimento_item: {
        Args: {
          p_data_fabricacao?: string;
          p_data_validade?: string;
          p_motivo_divergencia?: string;
          p_numero_lote?: string;
          p_pedido_item_id: string;
          p_preco_conferido?: number;
          p_quantidade_recebida?: number;
          p_quantidade_recusada?: number;
          p_recebimento_id?: string;
        };
        Returns: string;
      };
      fn_registrar_recebimento_parcela: {
        Args: {
          p_data_recebimento?: string;
          p_forma_pagamento: string;
          p_parcela_id: string;
          p_valor_recebido: number;
        };
        Returns: undefined;
      };
      fn_registrar_recusa_item_pedido_compra: {
        Args: {
          p_motivo: string;
          p_pedido_item_id: string;
          p_quantidade: number;
        };
        Returns: undefined;
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
      fn_rejeitar_solicitacao_compra: {
        Args: { p_motivo: string; p_solicitacao_id: string };
        Returns: undefined;
      };
      fn_resgatar_cashback: {
        Args: { p_cliente_id: string; p_observacao?: string; p_valor: number };
        Returns: undefined;
      };
      fn_resgatar_pontos_fidelidade: {
        Args: { p_cliente_id: string; p_observacao?: string; p_pontos: number };
        Returns: undefined;
      };
      fn_resolver_empresa_webhook_integracao: {
        Args: { p_identificador_externo: string; p_provedor: string };
        Returns: string;
      };
      fn_solicitar_ajuste_solicitacao_compra: {
        Args: { p_comentario: string; p_solicitacao_id: string };
        Returns: undefined;
      };
      fn_tem_acesso_compras: {
        Args: { p_empresa_id: string; p_exigir_escrita?: boolean };
        Returns: boolean;
      };
      fn_tem_acesso_financeiro: {
        Args: { p_empresa_id: string; p_exigir_escrita?: boolean };
        Returns: boolean;
      };
      fn_transferir_comanda_mesa: {
        Args: { p_comanda_id: string; p_nova_mesa_id: string };
        Returns: undefined;
      };
      fn_unir_comandas: {
        Args: { p_comanda_destino_id: string; p_comanda_origem_id: string };
        Returns: undefined;
      };
      fn_validar_e_aplicar_cupom: {
        Args: {
          p_canal_venda_id?: string;
          p_cliente_id: string;
          p_codigo: string;
          p_referencia_id?: string;
          p_referencia_tipo?: string;
          p_valor_compra: number;
        };
        Returns: {
          ficha_tecnica_gratis_id: string;
          tipo: string;
          valor_desconto: number;
        }[];
      };
      recalcular_ficha_tecnica: {
        Args: { p_ficha_id: string };
        Returns: undefined;
      };
      recalcular_status_conta_receber: {
        Args: { p_conta_receber_id: string };
        Returns: undefined;
      };
      recalcular_subtotal_pedido: {
        Args: { p_pedido_id: string };
        Returns: undefined;
      };
      recalcular_subtotal_pedido_compra: {
        Args: { p_pedido_id: string };
        Returns: undefined;
      };
      salvar_ficha_tecnica: {
        Args: {
          p_empresa_id: string;
          p_ficha_id: string;
          p_itens: Json;
          p_margem_contribuicao_percentual_alvo: number;
          p_modo_preparo: string;
          p_motivo_versao?: string;
          p_nome: string;
          p_preco_venda_praticado: number;
          p_rendimento_quantidade: number;
          p_rendimento_unidade_id: string;
          p_tempo_preparo_minutos: number;
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

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
