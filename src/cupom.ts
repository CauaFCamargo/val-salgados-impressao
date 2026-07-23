import {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
} from "node-thermal-printer";
import { config } from "./config";
import type { Pedido } from "./api";

// Impressora de 80mm imprime ~48 caracteres por linha na fonte padrão.
const LARGURA = 48;

type Via = "CLIENTE" | "EMPRESA";

function real(valor: number): string {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

function linha(): string {
  return "-".repeat(LARGURA);
}

// Centraliza um texto na largura do papel (pra título/cabeçalho).
function centralizar(texto: string): string {
  if (texto.length >= LARGURA) return texto;
  const espacos = Math.floor((LARGURA - texto.length) / 2);
  return " ".repeat(espacos) + texto;
}

// Coloca `esq` à esquerda e `dir` à direita, preenchendo o meio com espaços.
function esqDir(esq: string, dir: string): string {
  const espacos = LARGURA - esq.length - dir.length;
  if (espacos < 1) return `${esq} ${dir}`; // não coube: só separa por espaço
  return esq + " ".repeat(espacos) + dir;
}

// Monta o cupom (uma via) como uma lista de linhas de texto puro.
// A MESMA função serve pro preview (DRY_RUN) e pra impressão real — sem duplicar.
export function montarLinhasCupom(pedido: Pedido, via: Via): string[] {
  const data = new Date(pedido.criadoEm).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const linhas: string[] = [];
  linhas.push(centralizar("VAL SALGADOS"));
  linhas.push(centralizar(`VIA ${via}`));
  linhas.push(linha());
  linhas.push(esqDir(`Pedido #${pedido.numero}`, data));
  linhas.push(`Cliente: ${pedido.clienteNome}`);
  linhas.push(`Fone: ${pedido.telefone}`);

  if (pedido.tipoEntrega === "ENTREGA") {
    // Endereço em várias linhas: rua+número, bairro+cidade, CEP e complemento.
    // `filter(Boolean)` some com os pedaços vazios (ex.: pedido antigo sem CEP).
    const ruaNumero = [pedido.endereco, pedido.numeroEndereco]
      .filter(Boolean)
      .join(", ");
    const bairroCidade = [pedido.bairro, pedido.cidade]
      .filter(Boolean)
      .join(" - ");

    linhas.push("ENTREGA:");
    if (ruaNumero) linhas.push(ruaNumero);
    if (bairroCidade) linhas.push(bairroCidade);
    if (pedido.cep) linhas.push(`CEP: ${pedido.cep}`);
    if (pedido.complemento) linhas.push(`Compl.: ${pedido.complemento}`);
  } else {
    linhas.push("** RETIRADA NA LOJA **");
  }

  linhas.push(linha());
  for (const item of pedido.itens) {
    const subtotalItem = item.precoUnitario * item.quantidade;
    linhas.push(esqDir(`${item.quantidade}x ${item.nome}`, real(subtotalItem)));
  }

  linhas.push(linha());
  linhas.push(esqDir("Subtotal", real(pedido.subtotal)));
  if (pedido.tipoEntrega === "ENTREGA") {
    linhas.push(
      esqDir("Entrega", pedido.taxaEntrega === 0 ? "Gratis" : real(pedido.taxaEntrega))
    );
  }
  linhas.push(esqDir("TOTAL", real(pedido.total)));
  linhas.push(linha());

  if (pedido.formaPagamento === "PIX") {
    linhas.push("Pagamento: PIX");
  } else {
    linhas.push("Pagamento: DINHEIRO");
    if (pedido.trocoPara != null) {
      linhas.push(esqDir("Troco para", real(pedido.trocoPara)));
    }
  }

  return linhas;
}

// Imprime o pedido em DUAS vias (CLIENTE e EMPRESA), com corte entre elas.
export async function imprimirPedido(pedido: Pedido): Promise<void> {
  const vias: Via[] = ["CLIENTE", "EMPRESA"];

  // Modo seguro: só mostra no terminal, não usa impressora nenhuma.
  if (config.dryRun) {
    for (const via of vias) {
      console.log("\n" + montarLinhasCupom(pedido, via).join("\n"));
      console.log(">>>>>>>>>>>>> [ CORTE DO PAPEL ] <<<<<<<<<<<<<");
    }
    return;
  }

  // Modo real: manda os comandos ESC/POS pra impressora térmica.
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: config.impressoraInterface,
    characterSet: CharacterSet.PC860_PORTUGUESE, // acentos em português
    removeSpecialCharacters: false,
  });

  const conectada = await printer.isPrinterConnected();
  if (!conectada) {
    throw new Error(
      `Impressora não encontrada em "${config.impressoraInterface}"`
    );
  }

  for (const via of vias) {
    for (const texto of montarLinhasCupom(pedido, via)) {
      printer.println(texto);
    }
    printer.cut(); // corta o papel ao fim de cada via
  }

  await printer.execute();
  printer.clear();
}
