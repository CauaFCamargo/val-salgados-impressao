import { config } from "./config";

// O pedido como a API protegida devolve (GET /pedidos). Aqui o agente PODE ver
// os dados completos (é a máquina de confiança da loja), diferente da rota pública.
export interface ItemPedido {
  id: number;
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface Pedido {
  id: number;
  numero: number;
  criadoEm: string;
  clienteNome: string;
  telefone: string;
  tipoEntrega: string;
  endereco: string | null;
  numeroEndereco: string | null;
  bairro: string | null;
  cidade: string | null;
  cep: string | null;
  complemento: string | null;
  formaPagamento: string;
  trocoPara: number | null;
  subtotal: number;
  taxaEntrega: number;
  desconto: number;
  total: number;
  status: string;
  // Filas de impressão por via: true = a Val pediu essa via no painel.
  filaCliente: boolean;
  filaLoja: boolean;
  itens: ItemPedido[];
}

// As duas vias do cupom e o campo de fila correspondente na API.
export type Via = "CLIENTE" | "EMPRESA";

// Guardamos o token em memória e só logamos de novo quando ele vence.
let token: string | null = null;

async function login(): Promise<string> {
  const resposta = await fetch(`${config.apiUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usuario: config.adminUser,
      senha: config.adminPassword,
    }),
  });
  if (!resposta.ok) {
    throw new Error(`Falha no login na API (${resposta.status})`);
  }
  const dados = (await resposta.json()) as { token: string };
  return dados.token;
}

// Faz uma chamada autenticada. Se o token venceu (401), loga de novo e repete.
async function comToken(
  fazerRequisicao: (token: string) => Promise<Response>
): Promise<Response> {
  if (!token) token = await login();
  let resposta = await fazerRequisicao(token);
  if (resposta.status === 401) {
    token = await login();
    resposta = await fazerRequisicao(token);
  }
  return resposta;
}

// Busca os pedidos com ALGUMA via na fila (cliente e/ou loja).
export async function buscarPedidosNaFila(): Promise<Pedido[]> {
  const resposta = await comToken((t) =>
    fetch(`${config.apiUrl}/pedidos`, {
      headers: { Authorization: `Bearer ${t}` },
    })
  );
  if (!resposta.ok) {
    throw new Error(`Erro ao listar pedidos (${resposta.status})`);
  }
  const pedidos = (await resposta.json()) as Pedido[];
  return pedidos.filter((p) => p.filaCliente || p.filaLoja);
}

// Dá baixa numa via depois de imprimir (tira ela da fila).
export async function marcarViaImpressa(id: number, via: Via): Promise<void> {
  // Só a via impressa vai no corpo; a outra fica como está.
  const corpo = via === "CLIENTE" ? { cliente: false } : { loja: false };
  const resposta = await comToken((t) =>
    fetch(`${config.apiUrl}/pedidos/${id}/impressao`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify(corpo),
    })
  );
  if (!resposta.ok) {
    throw new Error(`Erro ao dar baixa na via (${resposta.status})`);
  }
}
