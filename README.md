# Val Salgados — Agente de Impressão

Programa que roda **na máquina da loja** (não na nuvem). De tempos em tempos ele
consulta a API por pedidos novos e imprime o cupom na impressora térmica em
**duas vias** (VIA CLIENTE e VIA EMPRESA), com corte entre elas.

Por que separado da API? Um servidor na nuvem não enxerga a impressora USB da
loja. Então quem imprime é uma máquina local, que se conecta à API pela internet.

## Como funciona

1. Loga na API com as credenciais do painel (mesmo usuário/senha da Val).
2. A cada `POLL_INTERVAL` segundos, busca os pedidos com `impresso = false`.
3. Imprime cada um (2 vias) e chama `PATCH /pedidos/:id/impresso` pra marcar.
   - Se a impressão falhar, o pedido continua "não impresso" e é tentado de novo.

## Configuração

```bash
npm install
cp .env.example .env   # depois edite o .env
```

No `.env`:

- `API_URL` — endereço da API.
- `ADMIN_USER` / `ADMIN_PASSWORD` — as mesmas credenciais do painel.
- `POLL_INTERVAL` — de quantos em quantos segundos checar.
- `DRY_RUN` — `true` mostra o cupom no **terminal** (sem impressora); `false` imprime de verdade.
- `IMPRESSORA_INTERFACE` — como falar com a impressora (só quando `DRY_RUN=false`):
  - Windows (impressora compartilhada): `\\localhost\NomeDaImpressora`
  - Rede (impressora com IP): `tcp://192.168.0.99`

## Rodar

```bash
npm run start   # roda uma vez e fica checando no intervalo
npm run dev     # igual, mas reinicia sozinho ao salvar (desenvolvimento)
```

Comece com `DRY_RUN=true` pra ver os cupons no terminal. Quando a impressora
estiver instalada, ajuste `IMPRESSORA_INTERFACE`, ponha `DRY_RUN=false` e teste.

> Acentos: está configurado pra português (`PC860_PORTUGUESE`). Se sua impressora
> mostrar acentos errados, troque o `characterSet` em `src/cupom.ts`.
