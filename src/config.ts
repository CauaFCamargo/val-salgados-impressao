// Node moderno lê o .env sozinho (sem biblioteca). Se o arquivo não existir,
// seguimos com as variáveis já presentes no ambiente do sistema.
try {
  process.loadEnvFile();
} catch {
  // sem .env — tudo bem, usamos process.env como veio
}

export const config = {
  apiUrl: process.env.API_URL ?? "http://localhost:3000",
  adminUser: process.env.ADMIN_USER ?? "val",
  adminPassword: process.env.ADMIN_PASSWORD ?? "val123",
  // Segundos → milissegundos (setInterval trabalha em ms).
  pollIntervalMs: Number(process.env.POLL_INTERVAL ?? "10") * 1000,
  // Qualquer coisa diferente de "false" mantém o modo seguro (não imprime).
  dryRun: (process.env.DRY_RUN ?? "true") !== "false",
  impressoraInterface: process.env.IMPRESSORA_INTERFACE ?? "",
};
