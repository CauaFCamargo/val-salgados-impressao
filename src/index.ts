import { config } from "./config";
import { buscarPedidosNaoImpressos, marcarImpresso } from "./api";
import { imprimirPedido } from "./cupom";

// Uma "rodada": busca pedidos novos e imprime cada um, marcando como impresso.
async function checar(): Promise<void> {
  try {
    const pedidos = await buscarPedidosNaoImpressos();
    if (pedidos.length === 0) return;

    const agora = new Date().toLocaleTimeString("pt-BR");
    console.log(`[${agora}] ${pedidos.length} pedido(s) novo(s) para imprimir.`);

    // A API devolve do mais novo pro mais antigo; invertemos pra imprimir na
    // ordem em que chegaram (mais antigo primeiro).
    for (const pedido of [...pedidos].reverse()) {
      // Imprime ANTES de marcar: se a impressão falhar, o pedido continua
      // "não impresso" e será tentado de novo na próxima rodada.
      await imprimirPedido(pedido);
      await marcarImpresso(pedido.id);
      console.log(`  ✓ Pedido #${pedido.numero} impresso.`);
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
  }

  await checar(); // primeira checagem imediata
  setInterval(checar, config.pollIntervalMs); // depois, de tempos em tempos
}

main();
