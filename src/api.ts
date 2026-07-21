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
  bairro: string | null;
  complemento: string | null;
  formaPagamento: string;
  trocoPara: number | null;
  subtotal: number;
  taxaEntrega: number;
  desconto: number;
  total: number;
  status: string;
  impresso: boolean;
  itens: ItemPedido[];
}

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

// Busca os pedidos que ainda não foram impressos.
export async function buscarPedidosNaoImpressos(): Promise<Pedido[]> {
  const resposta = await comToken((t) =>
    fetch(`${config.apiUrl}/pedidos`, {
      headers: { Authorization: `Bearer ${t}` },
    })
  );
  if (!resposta.ok) {
    throw new Error(`Erro ao listar pedidos (${resposta.status})`);
  }
  const pedidos = (await resposta.json()) as Pedido[];
  return pedidos.filter((pedido) => !pedido.impresso);
}

// Marca o pedido como impresso (pra não imprimir de novo).
export async function marcarImpresso(id: number): Promise<void> {
  const resposta = await comToken((t) =>
    fetch(`${config.apiUrl}/pedidos/${id}/impresso`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${t}` },
    })
  );
  if (!resposta.ok) {
    throw new Error(`Erro ao marcar impresso (${resposta.status})`);
  }
}
