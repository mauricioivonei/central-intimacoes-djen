type RawRecord = Record<string, unknown>;

const DEFAULT_BASE_URL = "https://comunicaapi.pje.jus.br";

const CANDIDATE_ENDPOINTS = ["/api/v1/comunicacao"];

const passthroughParams = [
  "numeroProcesso",
  "numeroComunicacao",
  "numeroOab",
  "ufOab",
  "nomeParte",
  "nomeAdvogado",
  "texto",
  "siglaTribunal",
  "dataDisponibilizacaoInicio",
  "dataDisponibilizacaoFim",
  "orgaoId",
  "meio",
  "pagina",
  "itensPorPagina",
];

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const params = new URLSearchParams();

  for (const key of passthroughParams) {
    const value = incoming.searchParams.get(key);
    if (value) params.set(key, value);
  }

  params.set("pagina", params.get("pagina") ?? "1");
  params.set("itensPorPagina", params.get("itensPorPagina") ?? "100");

  const baseUrl =
    process.env.DJEN_COMUNICA_API_BASE?.replace(/\/$/, "") ?? DEFAULT_BASE_URL;
  const configuredEndpoint = process.env.DJEN_COMUNICA_API_ENDPOINT;
  const endpoints = configuredEndpoint
    ? [configuredEndpoint]
    : CANDIDATE_ENDPOINTS;

  const attempts: Array<{ url: string; status: number; message: string }> = [];

  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const target = `${url}?${params.toString()}`;

    try {
      const response = await fetch(target, {
        headers: {
          accept: "application/json",
          "user-agent": "central-intimacoes-djen/0.1",
        },
      });

      if (!response.ok) {
        attempts.push({
          url: target,
          status: response.status,
          message: response.statusText,
        });
        continue;
      }

      const payload = await response.json();
      return Response.json({
        ok: true,
        source: target,
        items: extractItems(payload).map(normalizeCommunication),
        rawTotal: readTotal(payload),
      });
    } catch (error) {
      attempts.push({
        url: target,
        status: 0,
        message: error instanceof Error ? error.message : "Falha desconhecida",
      });
    }
  }

  return Response.json(
    {
      ok: false,
      message:
        "Nao foi possivel consultar a API do DJEN. Confira endpoint, rede e parametros.",
      attempts,
    },
    { status: 502 },
  );
}

function extractItems(payload: unknown): RawRecord[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];

  const candidateKeys = [
    "items",
    "itens",
    "content",
    "conteudo",
    "data",
    "dados",
    "resultado",
    "resultados",
    "comunicacoes",
  ];

  for (const key of candidateKeys) {
    const value = payload[key];
    if (Array.isArray(value)) return value.filter(isRecord);
  }

  return [];
}

function normalizeCommunication(record: RawRecord) {
  const caseNumber =
    firstText(record, [
      "numeroProcesso",
      "numero_processo",
      "processo",
      "numero",
      "numeroprocessocommascara",
    ]) ?? "Processo nao identificado";
  const disclosureDate =
    firstDate(record, [
      "dataDisponibilizacao",
      "data_disponibilizacao",
      "dataDivulgacao",
      "data_divulgacao",
      "datadisponibilizacao",
    ]) ?? "";
  const publicationDate =
    firstDate(record, [
      "dataPublicacao",
      "data_publicacao",
    ]) ?? nextBusinessDay(disclosureDate);

  const destinatarios = readDestinatarios(record);
  const activeParty =
    firstText(record, [
      "nomeParte",
      "destinatario",
      "parte",
      "requerente",
      "poloAtivo",
      "polo_ativo",
    ]) ?? destinatarios.active ?? "Parte nao identificada";
  const passiveParty =
    firstText(record, ["requerido", "poloPassivo", "polo_passivo", "parteContraria"]) ??
    destinatarios.passive ??
    "Parte contraria nao identificada";
  const text =
    firstText(record, [
      "texto",
      "teor",
      "conteudo",
      "inteiroTeor",
      "transcricao",
      "mensagem",
    ]) ?? "Texto da comunicacao nao localizado no retorno.";
  const command =
    firstText(record, ["tipoComunicacao", "tipo", "classe", "assunto"]) ??
    inferCommand(text);

  return {
    id:
      firstText(record, ["id", "idComunicacao", "codigo"]) ??
      `djen-${caseNumber}-${publicationDate}`,
    source: "DJEN - API Comunica PJe",
    caseNumber,
    court:
      firstText(record, ["siglaTribunal", "tribunal", "nomeOrgao", "orgao", "orgaoJulgador"]) ??
      "Tribunal nao identificado",
    className:
      firstText(record, ["nomeClasse", "classe", "classeProcessual"]) ??
      "Classe nao informada",
    parties: {
      active: activeParty,
      passive: passiveParty,
      lawyers: readLawyers(record),
    },
    disclosureDate,
    publicationDate,
    command,
    orderText: text,
    legalBasis: "Prazo sugerido automaticamente; confirme antes de cumprir.",
    deadlineDays: 15,
    area: inferArea(`${command} ${text}`),
  };
}

function readTotal(payload: unknown) {
  if (!isRecord(payload)) return null;
  return firstNumber(payload, ["total", "totalElements", "totalItens", "quantidade"]);
}

function readDestinatarios(record: RawRecord) {
  const rows = Array.isArray(record.destinatarios)
    ? record.destinatarios.filter(isRecord)
    : [];
  const active =
    rows.find((row) => firstText(row, ["polo"])?.toUpperCase().startsWith("A")) ??
    rows[0];
  const passive =
    rows.find((row) => firstText(row, ["polo"])?.toUpperCase().startsWith("P")) ??
    rows[1];

  return {
    active: active ? firstText(active, ["nome"]) : null,
    passive: passive ? firstText(passive, ["nome"]) : null,
  };
}

function readLawyers(record: RawRecord) {
  const nested = Array.isArray(record.destinatarioadvogados)
    ? record.destinatarioadvogados
        .filter(isRecord)
        .map((row) =>
          isRecord(row.advogado) ? firstText(row.advogado, ["nome"]) : null,
        )
        .filter((value): value is string => Boolean(value))
    : [];

  if (nested.length) return nested;

  return splitNames(firstText(record, ["advogados", "advogado", "representantes"]) ?? "");
}

function firstText(record: RawRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
}

function firstNumber(record: RawRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number") return value;
    if (typeof value === "string" && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function firstDate(record: RawRecord, keys: string[]) {
  const value = firstText(record, keys);
  if (!value) return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;

  const br = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;

  return null;
}

function nextBusinessDay(date: string | null) {
  if (!date) return "";
  const current = new Date(`${date}T12:00:00Z`);
  do {
    current.setUTCDate(current.getUTCDate() + 1);
  } while (current.getUTCDay() === 0 || current.getUTCDay() === 6);

  return current.toISOString().slice(0, 10);
}

function splitNames(value: string) {
  return value
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function inferCommand(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("intime-se")) return "Intimacao para cumprimento de ordem judicial.";
  if (lower.includes("cite-se")) return "Citacao identificada.";
  if (lower.includes("manifeste-se")) return "Manifestacao processual determinada.";
  return "Comunicacao processual identificada.";
}

function inferArea(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("liminar") || lower.includes("tutela")) return "Liminar";
  if (lower.includes("calculo") || lower.includes("contadoria")) return "Calculos";
  if (lower.includes("prova") || lower.includes("documento")) return "Provas";
  if (lower.includes("recurso")) return "Recurso";
  return "Providencia";
}

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null;
}
