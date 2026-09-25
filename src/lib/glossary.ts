export type GlossaryCategory = "infrastructure" | "programming" | "ai" | "data" | "tools" | "concepts";

export interface GlossaryEntry {
  en: string;
  es: string;
  pt: string;
  it: string;
  fr: string;
  category: GlossaryCategory;
}

export const GLOSSARY: GlossaryEntry[] = [
  // Infrastructure
  { en: "Kubernetes", es: "Kubernetes", pt: "Kubernetes", it: "Kubernetes", fr: "Kubernetes", category: "infrastructure" },
  { en: "Docker", es: "Docker", pt: "Docker", it: "Docker", fr: "Docker", category: "infrastructure" },
  { en: "microservices", es: "microservicios", pt: "microserviços", it: "microservizi", fr: "microservices", category: "infrastructure" },
  { en: "container", es: "contenedor", pt: "contêiner", it: "container", fr: "conteneur", category: "infrastructure" },
  { en: "serverless", es: "serverless", pt: "serverless", it: "serverless", fr: "sans serveur", category: "infrastructure" },
  { en: "load balancer", es: "balanceador de carga", pt: "balanceador de carga", it: "bilanciatore di carico", fr: "équilibreur de charge", category: "infrastructure" },
  { en: "CDN", es: "CDN", pt: "CDN", it: "CDN", fr: "CDN", category: "infrastructure" },
  { en: "edge computing", es: "computación en el borde", pt: "computação de borda", it: "calcolo al bordo", fr: "informatique en périphérie", category: "infrastructure" },
  { en: "IaC", es: "IaC", pt: "IaC", it: "IaC", fr: "IaC", category: "infrastructure" },
  { en: "blue-green deployment", es: "despliegue azul-verde", pt: "implantação azul-verde", it: "distribuzione blu-verde", fr: "déploiement bleu-vert", category: "infrastructure" },
  { en: "Terraform", es: "Terraform", pt: "Terraform", it: "Terraform", fr: "Terraform", category: "infrastructure" },
  { en: "Ansible", es: "Ansible", pt: "Ansible", it: "Ansible", fr: "Ansible", category: "infrastructure" },

  // Programming
  { en: "API", es: "API", pt: "API", it: "API", fr: "API", category: "programming" },
  { en: "REST", es: "REST", pt: "REST", it: "REST", fr: "REST", category: "programming" },
  { en: "GraphQL", es: "GraphQL", pt: "GraphQL", it: "GraphQL", fr: "GraphQL", category: "programming" },
  { en: "TypeScript", es: "TypeScript", pt: "TypeScript", it: "TypeScript", fr: "TypeScript", category: "programming" },
  { en: "JavaScript", es: "JavaScript", pt: "JavaScript", it: "JavaScript", fr: "JavaScript", category: "programming" },
  { en: "Python", es: "Python", pt: "Python", it: "Python", fr: "Python", category: "programming" },
  { en: "React", es: "React", pt: "React", it: "React", fr: "React", category: "programming" },
  { en: "Next.js", es: "Next.js", pt: "Next.js", it: "Next.js", fr: "Next.js", category: "programming" },
  { en: "Node.js", es: "Node.js", pt: "Node.js", it: "Node.js", fr: "Node.js", category: "programming" },
  { en: "Rust", es: "Rust", pt: "Rust", it: "Rust", fr: "Rust", category: "programming" },
  { en: "Go", es: "Go", pt: "Go", it: "Go", fr: "Go", category: "programming" },
  { en: "Java", es: "Java", pt: "Java", it: "Java", fr: "Java", category: "programming" },
  { en: "C#", es: "C#", pt: "C#", it: "C#", fr: "C#", category: "programming" },
  { en: "webhook", es: "webhook", pt: "webhook", it: "webhook", fr: "webhook", category: "programming" },
  { en: "WebSocket", es: "WebSocket", pt: "WebSocket", it: "WebSocket", fr: "WebSocket", category: "programming" },
  { en: "HTTP", es: "HTTP", pt: "HTTP", it: "HTTP", fr: "HTTP", category: "programming" },
  { en: "TCP/IP", es: "TCP/IP", pt: "TCP/IP", it: "TCP/IP", fr: "TCP/IP", category: "programming" },

  // AI
  { en: "machine learning", es: "aprendizaje automático", pt: "aprendizado de máquina", it: "apprendimento automatico", fr: "apprentissage automatique", category: "ai" },
  { en: "deep learning", es: "aprendizaje profundo", pt: "aprendizado profundo", it: "apprendimento profondo", fr: "apprentissage profond", category: "ai" },
  { en: "neural network", es: "red neuronal", pt: "rede neural", it: "rete neurale", fr: "réseau de neurones", category: "ai" },
  { en: "LLM", es: "LLM", pt: "LLM", it: "LLM", fr: "LLM", category: "ai" },
  { en: "GPT", es: "GPT", pt: "GPT", it: "GPT", fr: "GPT", category: "ai" },
  { en: "BERT", es: "BERT", pt: "BERT", it: "BERT", fr: "BERT", category: "ai" },
  { en: "transformer", es: "transformer", pt: "transformer", it: "transformer", fr: "transformer", category: "ai" },
  { en: "RAG", es: "RAG", pt: "RAG", it: "RAG", fr: "RAG", category: "ai" },
  { en: "fine-tuning", es: "fine-tuning", pt: "fine-tuning", it: "fine-tuning", fr: "fine-tuning", category: "ai" },
  { en: "prompt engineering", es: "ingeniería de prompts", pt: "engenharia de prompts", it: "ingegneria dei prompt", fr: "ingénierie de prompts", category: "ai" },
  { en: "hallucination", es: "alucinación", pt: "alucinação", it: "allucinazione", fr: "hallucination", category: "ai" },
  { en: "tokenizer", es: "tokenizador", pt: "tokenizador", it: "tokenizzatore", fr: "tokeniseur", category: "ai" },
  { en: "inference", es: "inferencia", pt: "inferência", it: "inferenza", fr: "inférence", category: "ai" },

  // Data
  { en: "PostgreSQL", es: "PostgreSQL", pt: "PostgreSQL", it: "PostgreSQL", fr: "PostgreSQL", category: "data" },
  { en: "MongoDB", es: "MongoDB", pt: "MongoDB", it: "MongoDB", fr: "MongoDB", category: "data" },
  { en: "Redis", es: "Redis", pt: "Redis", it: "Redis", fr: "Redis", category: "data" },
  { en: "Kafka", es: "Kafka", pt: "Kafka", it: "Kafka", fr: "Kafka", category: "data" },
  { en: "RabbitMQ", es: "RabbitMQ", pt: "RabbitMQ", it: "RabbitMQ", fr: "RabbitMQ", category: "data" },
  { en: "Elasticsearch", es: "Elasticsearch", pt: "Elasticsearch", it: "Elasticsearch", fr: "Elasticsearch", category: "data" },
  { en: "data lake", es: "lago de datos", pt: "lago de dados", it: "lago di dati", fr: "lac de données", category: "data" },
  { en: "data pipeline", es: "tubería de datos", pt: "pipeline de dados", it: "pipeline di dati", fr: "pipeline de données", category: "data" },
  { en: "ETL", es: "ETL", pt: "ETL", it: "ETL", fr: "ETL", category: "data" },

  // Tools
  { en: "AWS", es: "AWS", pt: "AWS", it: "AWS", fr: "AWS", category: "tools" },
  { en: "Azure", es: "Azure", pt: "Azure", it: "Azure", fr: "Azure", category: "tools" },
  { en: "GCP", es: "GCP", pt: "GCP", it: "GCP", fr: "GCP", category: "tools" },
  { en: "nginx", es: "nginx", pt: "nginx", it: "nginx", fr: "nginx", category: "tools" },
  { en: "Apache", es: "Apache", pt: "Apache", it: "Apache", fr: "Apache", category: "tools" },
  { en: "Prometheus", es: "Prometheus", pt: "Prometheus", it: "Prometheus", fr: "Prometheus", category: "tools" },
  { en: "Grafana", es: "Grafana", pt: "Grafana", it: "Grafana", fr: "Grafana", category: "tools" },
  { en: "Git", es: "Git", pt: "Git", it: "Git", fr: "Git", category: "tools" },
  { en: "GitHub Actions", es: "GitHub Actions", pt: "GitHub Actions", it: "GitHub Actions", fr: "GitHub Actions", category: "tools" },
  { en: "Jenkins", es: "Jenkins", pt: "Jenkins", it: "Jenkins", fr: "Jenkins", category: "tools" },
  { en: "Vite", es: "Vite", pt: "Vite", it: "Vite", fr: "Vite", category: "tools" },
  { en: "Webpack", es: "Webpack", pt: "Webpack", it: "Webpack", fr: "Webpack", category: "tools" },

  // Concepts
  { en: "CI/CD", es: "CI/CD", pt: "CI/CD", it: "CI/CD", fr: "CI/CD", category: "concepts" },
  { en: "DevOps", es: "DevOps", pt: "DevOps", it: "DevOps", fr: "DevOps", category: "concepts" },
  { en: "blockchain", es: "blockchain", pt: "blockchain", it: "blockchain", fr: "blockchain", category: "concepts" },
  { en: "cryptocurrency", es: "criptomoneda", pt: "criptomoeda", it: "criptovaluta", fr: "cryptomonnaie", category: "concepts" },
  { en: "NFT", es: "NFT", pt: "NFT", it: "NFT", fr: "NFT", category: "concepts" },
  { en: "Web3", es: "Web3", pt: "Web3", it: "Web3", fr: "Web3", category: "concepts" },
  { en: "Redux", es: "Redux", pt: "Redux", it: "Redux", fr: "Redux", category: "concepts" },
  { en: "Vue.js", es: "Vue.js", pt: "Vue.js", it: "Vue.js", fr: "Vue.js", category: "concepts" },
  { en: "Angular", es: "Angular", pt: "Angular", it: "Angular", fr: "Angular", category: "concepts" },
  { en: "Svelte", es: "Svelte", pt: "Svelte", it: "Svelte", fr: "Svelte", category: "concepts" },
  { en: "Tailwind", es: "Tailwind", pt: "Tailwind", it: "Tailwind", fr: "Tailwind", category: "concepts" },
  { en: "SOLID", es: "SOLID", pt: "SOLID", it: "SOLID", fr: "SOLID", category: "concepts" },
  { en: "OAuth", es: "OAuth", pt: "OAuth", it: "OAuth", fr: "OAuth", category: "concepts" },
  { en: "JWT", es: "JWT", pt: "JWT", it: "JWT", fr: "JWT", category: "concepts" },
];

const LANG_MAP: Record<string, keyof Pick<GlossaryEntry, "en" | "es" | "pt" | "it" | "fr">> = {
  en: "en",
  es: "es",
  pt: "pt",
  it: "it",
  fr: "fr",
  auto: "en",
};

export function getGlossaryContext(sourceLang: string, targetLang: string): string {
  const targetKey = LANG_MAP[targetLang] || "en";
  const sourceKey = LANG_MAP[sourceLang] || "en";

  const lines: string[] = [];

  for (const entry of GLOSSARY) {
    const sourceTerm = entry[sourceKey] || entry.en;
    const targetTerm = entry[targetKey] || entry.en;
    if (sourceTerm !== targetTerm) {
      lines.push(`- "${sourceTerm}" → "${targetTerm}" (${entry.category})`);
    }
  }

  if (lines.length === 0) return "";

  return "Use the following glossary of technical terms to improve accuracy:\n" + lines.join("\n");
}

export function lookupTerm(term: string): GlossaryEntry | undefined {
  const lower = term.toLowerCase();
  return GLOSSARY.find(
    (entry) =>
      entry.en.toLowerCase() === lower ||
      entry.es.toLowerCase() === lower ||
      entry.pt.toLowerCase() === lower ||
      entry.it.toLowerCase() === lower ||
      entry.fr.toLowerCase() === lower
  );
}
