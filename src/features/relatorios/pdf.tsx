import { Document, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  titulo: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  subtitulo: { fontSize: 10, color: "#666666", marginBottom: 16 },
  linhaCabecalho: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#333333", paddingBottom: 4, marginBottom: 4 },
  linha: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#dddddd", paddingVertical: 4 },
  celulaCabecalho: { fontWeight: 700 },
  celula: { flexGrow: 1, flexBasis: 0 },
  celulaDireita: { flexGrow: 1, flexBasis: 0, textAlign: "right" },
});

export interface RelatorioPdfProps {
  titulo: string;
  subtitulo?: string;
  colunas: string[];
  linhas: (string | number)[][];
  /** índices de coluna (0-based) alinhados à direita — normalmente as colunas numéricas/monetárias. */
  colunasAlinhadasDireita?: number[];
}

function RelatorioPdfDocument({ titulo, subtitulo, colunas, linhas, colunasAlinhadasDireita = [] }: RelatorioPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.titulo}>{titulo}</Text>
        {subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}

        <View style={styles.linhaCabecalho}>
          {colunas.map((coluna, indice) => (
            <Text
              key={coluna}
              style={[colunasAlinhadasDireita.includes(indice) ? styles.celulaDireita : styles.celula, styles.celulaCabecalho]}
            >
              {coluna}
            </Text>
          ))}
        </View>

        {linhas.map((linha, indiceLinha) => (
          <View key={indiceLinha} style={styles.linha}>
            {linha.map((valor, indiceColuna) => (
              <Text
                key={indiceColuna}
                style={colunasAlinhadasDireita.includes(indiceColuna) ? styles.celulaDireita : styles.celula}
              >
                {String(valor)}
              </Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}

/** Gera o PDF tabular genérico usado por todo relatório exportável do Financeiro — um único layout, sem reimplementar por tela. */
export async function gerarRelatorioPdf(props: RelatorioPdfProps): Promise<Buffer> {
  return renderToBuffer(<RelatorioPdfDocument {...props} />);
}
