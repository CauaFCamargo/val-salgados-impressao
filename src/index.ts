import { config } from "./config";
import { buscarPedidosNaFila, marcarViaImpressa } from "./api";
import { imprimirVia } from "./cupom";

// Uma "rodada": busca pedidos com via na fila e imprime cada via pedida.
async function checar(): Promise<void> {
  try {
    const pedidos = await buscarPedidosNaFila();
    if (pedidos.length === 0) return;

    const agora = new Date().toLocaleTimeString("pt-BR");
    console.log(`[${agora}] ${pedidos.length} pedido(s) com via na fila.`);

    // A API devolve do mais novo pro mais antigo; invertemos pra imprimir na
    // ordem em que chegaram (mais antigo primeiro).
    for (const pedido of [...pedidos].reverse()) {
      // Imprime cada via pedida ANTES de dar baixa: se a impressão falhar, a
      // via continua na fila e é tentada de novo na próxima rodada.
      if (pedido.filaCliente) {
        await imprimirVia(pedido, "CLIENTE");
        await marcarViaImpressa(pedido.id, "CLIENTE");
        console.log(`  ✓ Pedido #${pedido.numero} — via CLIENTE impressa.`);
      }
      if (pedido.filaLoja) {
        await imprimirVia(pedido, "EMPRESA");
        await marcarViaImpressa(pedido.id, "EMPRESA");
        console.log(`  ✓ Pedido #${pedido.numero} — via LOJA impressa.`);
      }
    }
  } catch (erro) {
    // Um erro numa rodada (ex.: API fora do ar) não derruba o agente:
    // ele loga e tenta de novo no próximo intervalo.
    console.error(
      "  ! Erro nesta rodada:",
      erro instanceof Error ? erro.message : erro
    );
  }
}

async function main(): Promise<void> {
  console.log("=== Agente de impressão Val Salgados ===");
  console.log(
    `API: ${config.apiUrl} | DRY_RUN: ${config.dryRun} | intervalo: ${
      config.pollIntervalMs / 1000
    }s`
  );
  if (config.dryRun) {
    console.log("(modo seguro: mostra o cupom no terminal, não imprime)\n");
  } else {
    // Mostra o caminho da impressora exatamente como o Node leu do .env —
    // útil pra conferir se as barras invertidas do Windows vieram certas.
    console.log(`Impressora: ${JSON.stringify(config.impressoraInterface)}\n`);
  }

  await checar(); // primeira checagem imediata
  setInterval(checar, config.pollIntervalMs); // depois, de tempos em tempos
}

main();
