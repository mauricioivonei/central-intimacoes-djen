"use client";

import { useMemo, useState } from "react";

type Urgency = "critico" | "alerta" | "ok";

type Intimation = {
  id: string;
  source: string;
  caseNumber: string;
  court: string;
  className: string;
  parties: {
    active: string;
    passive: string;
    lawyers: string[];
  };
  disclosureDate: string;
  publicationDate: string;
  command: string;
  orderText: string;
  legalBasis: string;
  deadlineDays: number;
  suggestedDueDate: string;
  adjustedDueDate: string;
  fatalDate: string;
  alertDate: string;
  tasks: string[];
  confidence: number;
  urgency: Urgency;
  status: "pendente" | "confirmado" | "agendado";
  area: string;
};

type DjenApiItem = Omit<
  Intimation,
  | "suggestedDueDate"
  | "adjustedDueDate"
  | "fatalDate"
  | "alertDate"
  | "tasks"
  | "confidence"
  | "urgency"
  | "status"
> & {
  deadlineDays: number;
};

type DjenSearch = {
  nomeAdvogado: string;
  numeroOab: string;
  ufOab: string;
  nomeParte: string;
  siglaTribunal: string;
  dataInicio: string;
  dataFim: string;
  meio: "D" | "E";
};

const initialIntimations: Intimation[] = [
  {
    id: "djen-2026-0709-001",
    source: "DJEN - Caderno Judicial Eletronico Nacional",
    caseNumber: "1004827-31.2024.8.26.0100",
    court: "TJSP - 12a Vara Civel do Foro Central",
    className: "Procedimento Comum Civel",
    parties: {
      active: "Alfa Tecnologia Ltda.",
      passive: "Banco Boreal S.A.",
      lawyers: ["Mauricio Ivonei da Rosa", "Carla Mendonca"],
    },
    disclosureDate: "2026-07-08",
    publicationDate: "2026-07-09",
    command:
      "Intime-se a parte autora para especificar provas e juntar documentos complementares.",
    orderText:
      "Vistos. Considerando a contestacao apresentada, intime-se a parte autora para, no prazo legal, especificar as provas que pretende produzir, justificando sua pertinencia, bem como juntar documentos complementares indicados na peticao inicial. Decorrido o prazo, tornem conclusos.",
    legalBasis: "Prazo processual sugerido: 15 dias uteis, contado da publicacao.",
    deadlineDays: 15,
    suggestedDueDate: "2026-07-30",
    adjustedDueDate: "2026-07-30",
    fatalDate: "2026-07-30",
    alertDate: "2026-07-27",
    tasks: [
      "Analisar contestacao e pontos controvertidos",
      "Definir provas necessarias",
      "Conferir documentos complementares",
      "Protocolar manifestacao de especificacao de provas",
    ],
    confidence: 94,
    urgency: "alerta",
    status: "pendente",
    area: "Provas",
  },
  {
    id: "djen-2026-0709-002",
    source: "DJEN - Comunicacao automatica",
    caseNumber: "0701462-88.2023.8.07.0001",
    court: "TJDFT - 3a Vara de Fazenda Publica",
    className: "Mandado de Seguranca Civel",
    parties: {
      active: "Clinica Horizonte S/S",
      passive: "Distrito Federal",
      lawyers: ["Mauricio Ivonei da Rosa"],
    },
    disclosureDate: "2026-07-07",
    publicationDate: "2026-07-08",
    command:
      "Cumpra-se a decisao liminar e comprove-se a comunicacao ao orgao coator.",
    orderText:
      "Defiro parcialmente a tutela de urgencia para determinar que a autoridade impetrada se abstenha de aplicar penalidade ate ulterior deliberacao. Intime-se a impetrante para comprovar, em cinco dias, a ciencia formal do orgao coator, juntando o respectivo comprovante.",
    legalBasis: "Prazo sugerido: 5 dias corridos por determinacao expressa da ordem.",
    deadlineDays: 5,
    suggestedDueDate: "2026-07-13",
    adjustedDueDate: "2026-07-13",
    fatalDate: "2026-07-13",
    alertDate: "2026-07-10",
    tasks: [
      "Providenciar comunicacao formal ao orgao coator",
      "Salvar comprovante de envio e recebimento",
      "Peticionar comprovacao no processo",
    ],
    confidence: 89,
    urgency: "critico",
    status: "pendente",
    area: "Liminar",
  },
  {
    id: "djen-2026-0709-003",
    source: "DJEN - Lote de intimacoes",
    caseNumber: "5009198-10.2022.4.03.6100",
    court: "TRF3 - 7a Vara Federal Civel de Sao Paulo",
    className: "Cumprimento de Sentenca",
    parties: {
      active: "Uniao Federal",
      passive: "Metalurgica Sol Nascente Ltda.",
      lawyers: ["Mauricio Ivonei da Rosa", "Daniela Araujo"],
    },
    disclosureDate: "2026-07-06",
    publicationDate: "2026-07-07",
    command:
      "Manifeste-se sobre calculos apresentados pela contadoria judicial.",
    orderText:
      "Intimem-se as partes acerca dos calculos elaborados pela contadoria judicial, facultando-se manifestacao no prazo de dez dias. No silencio, venham conclusos para homologacao.",
    legalBasis: "Prazo processual sugerido: 10 dias uteis, contado da publicacao.",
    deadlineDays: 10,
    suggestedDueDate: "2026-07-21",
    adjustedDueDate: "2026-07-21",
    fatalDate: "2026-07-21",
    alertDate: "2026-07-18",
    tasks: [
      "Comparar calculos da contadoria com memoria interna",
      "Validar juros, correcao e honorarios",
      "Elaborar impugnacao ou concordancia fundamentada",
    ],
    confidence: 91,
    urgency: "ok",
    status: "pendente",
    area: "Calculos",
  },
];

const djenSample = `INTIMACAO DJEN
Processo: 1004827-31.2024.8.26.0100
Partes: Alfa Tecnologia Ltda. x Banco Boreal S.A.
Divulgacao: 08/07/2026
Publicacao: 09/07/2026
Decisao: Intime-se a parte autora para especificar provas e juntar documentos complementares.
Ordem judicial: Vistos. Considerando a contestacao apresentada, intime-se a parte autora para, no prazo legal, especificar as provas que pretende produzir, justificando sua pertinencia.`;

const urgencyLabel: Record<Urgency, string> = {
  critico: "Vence em ate 3 dias",
  alerta: "Alerta preventivo",
  ok: "Em acompanhamento",
};

function formatDate(value: string) {
  if (!value) return "Nao informada";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

function daysBetween(target: string) {
  const today = new Date("2026-07-09T12:00:00Z");
  const due = new Date(`${target}T12:00:00Z`);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function updateAlertDate(date: string) {
  const due = new Date(`${date}T12:00:00Z`);
  due.setUTCDate(due.getUTCDate() - 3);
  return due.toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const base = new Date(`${date || "2026-07-09"}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function toGoogleDate(value: string) {
  return value.replaceAll("-", "");
}

function googleCalendarUrl(item: Intimation, kind: "fatal" | "alert") {
  const date = kind === "fatal" ? item.fatalDate : item.alertDate;
  const next = addDays(date, 1);
  const title =
    kind === "fatal"
      ? `Prazo fatal - ${item.caseNumber}`
      : `Alerta de prazo - ${item.caseNumber}`;
  const details = [
    `Processo: ${item.caseNumber}`,
    `Tribunal: ${item.court}`,
    `Partes: ${item.parties.active} x ${item.parties.passive}`,
    `Divulgacao: ${formatDate(item.disclosureDate)}`,
    `Publicacao: ${formatDate(item.publicationDate)}`,
    `Prazo fatal: ${formatDate(item.fatalDate)}`,
    `Alerta preventivo: ${formatDate(item.alertDate)}`,
    "",
    `Comando: ${item.command}`,
    "",
    `Ordem judicial: ${item.orderText}`,
    "",
    `Providencias: ${item.tasks.join("; ")}`,
  ].join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toGoogleDate(date)}/${toGoogleDate(next)}`,
    details,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function tasksForArea(area: string) {
  const normalized = area.toLowerCase();
  if (normalized.includes("liminar")) {
    return [
      "Conferir alcance da ordem judicial",
      "Comunicar cliente e parte interessada",
      "Juntar comprovante de cumprimento",
    ];
  }
  if (normalized.includes("calculo")) {
    return [
      "Baixar memoria de calculo",
      "Comparar criterios de juros e correcao",
      "Preparar manifestacao sobre divergencias",
    ];
  }
  if (normalized.includes("prova")) {
    return [
      "Mapear pontos controvertidos",
      "Separar documentos e testemunhas",
      "Protocolar especificacao de provas",
    ];
  }
  return [
    "Ler a ordem judicial integral",
    "Definir responsavel interno",
    "Confirmar prazo antes do agendamento",
  ];
}

function itemFromDjenApi(item: DjenApiItem): Intimation {
  const publicationDate = item.publicationDate || item.disclosureDate || "2026-07-09";
  const dueDate = addDays(publicationDate, item.deadlineDays || 15);
  const daysToDue = daysBetween(dueDate);

  return {
    ...item,
    publicationDate,
    disclosureDate: item.disclosureDate || publicationDate,
    suggestedDueDate: dueDate,
    adjustedDueDate: dueDate,
    fatalDate: dueDate,
    alertDate: updateAlertDate(dueDate),
    tasks: tasksForArea(item.area),
    confidence: 78,
    urgency: daysToDue <= 3 ? "critico" : daysToDue <= 7 ? "alerta" : "ok",
    status: "pendente",
  };
}

export default function Home() {
  const [intimations, setIntimations] = useState(initialIntimations);
  const [selectedId, setSelectedId] = useState(initialIntimations[0].id);
  const [query, setQuery] = useState("");
  const [rawText, setRawText] = useState(djenSample);
  const [calendarMode, setCalendarMode] = useState<"rascunho" | "pronto">(
    "rascunho",
  );
  const [apiStatus, setApiStatus] = useState(
    "Regra principal: pesquisar publicacoes pelo nome do advogado.",
  );
  const [isLoadingDjen, setIsLoadingDjen] = useState(false);
  const [djenSearch, setDjenSearch] = useState<DjenSearch>({
    nomeAdvogado: "Mauricio Ivonei da Rosa",
    numeroOab: "",
    ufOab: "",
    nomeParte: "",
    siglaTribunal: "",
    dataInicio: "2026-07-02",
    dataFim: "2026-07-09",
    meio: "D",
  });

  const selected = intimations.find((item) => item.id === selectedId) ?? intimations[0];

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return intimations;

    return intimations.filter((item) =>
      [
        item.caseNumber,
        item.parties.active,
        item.parties.passive,
        item.command,
        item.area,
        item.court,
      ]
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [intimations, query]);

  const stats = useMemo(() => {
    return {
      total: intimations.length,
      critical: intimations.filter((item) => item.urgency === "critico").length,
      alerts: intimations.filter((item) => item.urgency !== "ok").length,
      confirmed: intimations.filter((item) => item.status !== "pendente").length,
    };
  }, [intimations]);

  function setAdjustedDate(value: string) {
    setIntimations((items) =>
      items.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              adjustedDueDate: value,
              fatalDate: value,
              alertDate: updateAlertDate(value),
              urgency: daysBetween(value) <= 3 ? "critico" : item.urgency,
            }
          : item,
      ),
    );
  }

  function markStatus(status: Intimation["status"]) {
    setIntimations((items) =>
      items.map((item) => (item.id === selected.id ? { ...item, status } : item)),
    );
    if (status === "agendado") setCalendarMode("pronto");
  }

  function updateDjenSearch(field: keyof DjenSearch, value: string) {
    setDjenSearch((current) => ({ ...current, [field]: value }));
  }

  function openGoogleCalendar(kind: "fatal" | "alert") {
    markStatus(kind === "fatal" ? "agendado" : "confirmado");
    window.open(googleCalendarUrl(selected, kind), "_blank", "noopener,noreferrer");
  }

  function simulateExtraction() {
    const processMatch = rawText.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/);
    const hasPublication = /publica[cç][aã]o/i.test(rawText);

    setIntimations((items) =>
      items.map((item, index) =>
        index === 0
          ? {
              ...item,
              caseNumber: processMatch?.[0] ?? item.caseNumber,
              confidence: hasPublication ? 96 : 82,
              status: "pendente",
            }
          : item,
      ),
    );
    setSelectedId(initialIntimations[0].id);
  }

  async function consultOfficialDjen() {
    setIsLoadingDjen(true);
    setApiStatus("Consultando o DJEN pelo nome do advogado...");

    const params = new URLSearchParams({
      dataDisponibilizacaoInicio: djenSearch.dataInicio,
      dataDisponibilizacaoFim: djenSearch.dataFim,
      itensPorPagina: "100",
      meio: djenSearch.meio,
    });

    const optionalParams: Record<string, string> = {
      nomeAdvogado: djenSearch.nomeAdvogado,
      nomeParte: djenSearch.nomeParte,
      siglaTribunal: djenSearch.siglaTribunal,
    };

    if (!djenSearch.nomeAdvogado.trim()) {
      optionalParams.numeroOab = djenSearch.numeroOab;
      optionalParams.ufOab = djenSearch.ufOab;
    }

    for (const [key, value] of Object.entries(optionalParams)) {
      if (value.trim()) params.set(key, value.trim());
    }

    if (![...params.keys()].some((key) => key !== "pagina" && key !== "itensPorPagina" && key !== "meio")) {
      params.set("numeroProcesso", selected.caseNumber);
    }

    try {
      const response = await fetch(`/api/djen?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        setApiStatus(
          payload.message ??
            "Nao foi possivel consultar o DJEN agora. Os dados de demonstracao foram mantidos.",
        );
        return;
      }

      const fetchedItems = Array.isArray(payload.items)
        ? payload.items.map((item: DjenApiItem) => itemFromDjenApi(item))
        : [];

      if (fetchedItems.length === 0) {
        setApiStatus("Consulta concluida, mas nenhuma comunicacao foi localizada.");
        return;
      }

      setIntimations((current) => {
        const existing = new Set(current.map((item) => item.id));
        const incoming = fetchedItems.filter((item) => !existing.has(item.id));
        return incoming.length ? [...incoming, ...current] : current;
      });
      setSelectedId(fetchedItems[0].id);
      setApiStatus(`${fetchedItems.length} comunicacao(oes) importada(s) do DJEN.`);
    } catch {
      setApiStatus(
        "A consulta nao respondeu nesta sessao. Verifique rede, endpoint e parametros da API.",
      );
    } finally {
      setIsLoadingDjen(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="app-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Gestao de prazos processuais</p>
            <h1>Central de intimações DJEN</h1>
          </div>
          <div className="top-actions" aria-label="Acoes principais">
            <button className="icon-button" type="button" aria-label="Sincronizar DJEN">
              ↻
            </button>
            <button className="primary-button" type="button">
              Nova consulta DJEN
            </button>
          </div>
        </header>

        <section className="summary-grid" aria-label="Resumo de prazos">
          <article className="metric-card danger">
            <span>Prazos fatais</span>
            <strong>{stats.critical}</strong>
            <small>com alerta de 3 dias ativo</small>
          </article>
          <article className="metric-card warning">
            <span>Alertas dinamicos</span>
            <strong>{stats.alerts}</strong>
            <small>exigem revisao hoje</small>
          </article>
          <article className="metric-card">
            <span>Intimacoes capturadas</span>
            <strong>{stats.total}</strong>
            <small>lote DJEN em triagem</small>
          </article>
          <article className="metric-card success">
            <span>Providencias validadas</span>
            <strong>{stats.confirmed}</strong>
            <small>prontas para agenda</small>
          </article>
        </section>

        <section className="workspace-grid">
          <aside className="queue-panel" aria-label="Lista de intimacoes">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Triagem automatica</p>
                <h2>Fila DJEN</h2>
              </div>
              <span className="sync-pill">autoexecutavel</span>
            </div>

            <label className="search-box">
              <span>Buscar processo, parte ou providencia</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ex.: liminar, calculos, 1004827"
              />
            </label>

            <div className="intimation-list">
              {filtered.map((item) => (
                <button
                  className={`intimation-row ${selected.id === item.id ? "active" : ""}`}
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  type="button"
                >
                  <span className={`status-dot ${item.urgency}`} />
                  <span>
                    <strong>{item.caseNumber}</strong>
                    <small>{item.area} · {item.parties.active}</small>
                  </span>
                  <em>{daysBetween(item.fatalDate)}d</em>
                </button>
              ))}
            </div>

            <div className="connector-card">
              <div>
                <p className="eyebrow">Conectores seguros</p>
                <h3>DJEN + Google Agenda</h3>
              </div>
              <ul>
                <li>Consulta DJEN por certificado/token no servidor</li>
                <li>Agenda Google via OAuth, sem gravar senha</li>
                <li>Registro de auditoria para cada prazo alterado</li>
              </ul>
            </div>
          </aside>

          <section className="detail-panel" aria-label="Detalhes da intimacao">
            <div className="case-header">
              <div>
                <p className="eyebrow">{selected.source}</p>
                <h2>{selected.caseNumber}</h2>
                <p>{selected.court} · {selected.className}</p>
              </div>
              <span className={`urgency-badge ${selected.urgency}`}>
                {urgencyLabel[selected.urgency]}
              </span>
            </div>

            <div className="info-grid">
              <div>
                <span>Divulgacao</span>
                <strong>{formatDate(selected.disclosureDate)}</strong>
              </div>
              <div>
                <span>Publicacao</span>
                <strong>{formatDate(selected.publicationDate)}</strong>
              </div>
              <div>
                <span>Prazo sugerido</span>
                <strong>{selected.deadlineDays} dias</strong>
              </div>
              <div>
                <span>Confianca da leitura</span>
                <strong>{selected.confidence}%</strong>
              </div>
            </div>

            <div className="two-column">
              <article className="section-block">
                <h3>Partes identificadas</h3>
                <dl className="party-list">
                  <div>
                    <dt>Parte ativa</dt>
                    <dd>{selected.parties.active}</dd>
                  </div>
                  <div>
                    <dt>Parte passiva</dt>
                    <dd>{selected.parties.passive}</dd>
                  </div>
                  <div>
                    <dt>Responsaveis</dt>
                    <dd>{selected.parties.lawyers.join(", ")}</dd>
                  </div>
                </dl>
              </article>

              <article className="section-block command-block">
                <h3>Comando da decisao</h3>
                <p>{selected.command}</p>
                <span>{selected.legalBasis}</span>
              </article>
            </div>

            <article className="section-block">
              <div className="section-title-row">
                <h3>Transcricao da ordem judicial</h3>
                <button className="ghost-button" type="button">
                  Conferir no DJEN
                </button>
              </div>
              <p className="order-text">{selected.orderText}</p>
            </article>

            <section className="deadline-panel" aria-label="Controle de prazo">
              <div>
                <p className="eyebrow">Contagem a partir da publicacao</p>
                <h3>Prazo fatal: {formatDate(selected.fatalDate)}</h3>
                <p>
                  Alerta automatico em {formatDate(selected.alertDate)}. A data pode
                  ser confirmada ou ajustada antes de entrar na agenda.
                </p>
              </div>
              <div className="date-control">
                <label>
                  Ajustar data sugerida
                  <input
                    type="date"
                    value={selected.adjustedDueDate}
                    onChange={(event) => setAdjustedDate(event.target.value)}
                  />
                </label>
                <div className="button-row">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => markStatus("confirmado")}
                  >
                    Confirmar prazo
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => openGoogleCalendar("fatal")}
                  >
                    Abrir no Google Agenda
                  </button>
                </div>
              </div>
            </section>

            <section className="tasks-grid">
              <article className="section-block">
                <h3>Providencias sugeridas</h3>
                <ol className="task-list">
                  {selected.tasks.map((task) => (
                    <li key={task}>{task}</li>
                  ))}
                </ol>
              </article>

              <article className="calendar-card">
                <div>
                  <p className="eyebrow">Google Agenda</p>
                  <h3>{calendarMode === "pronto" ? "Evento preparado" : "Rascunho de evento"}</h3>
                </div>
                <p>
                  {selected.caseNumber} - {selected.area}: prazo fatal em{" "}
                  {formatDate(selected.fatalDate)}, com lembrete tres dias antes.
                </p>
                <div className="calendar-preview">
                  <span>{formatDate(selected.alertDate)}</span>
                  <strong>Alerta preventivo</strong>
                  <span>{formatDate(selected.fatalDate)}</span>
                  <strong>Prazo fatal</strong>
                </div>
                <div className="button-row calendar-actions">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => openGoogleCalendar("alert")}
                  >
                    Criar alerta
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => openGoogleCalendar("fatal")}
                  >
                    Criar prazo fatal
                  </button>
                </div>
              </article>
            </section>
          </section>

          <aside className="automation-panel" aria-label="Automacoes e extracao">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Leitura assistida</p>
                <h2>Extrator DJEN</h2>
              </div>
              <span className="sync-pill secure">seguro</span>
            </div>

            <label className="raw-input">
              <span>Colar intimacao ou retorno da API</span>
              <textarea
                value={rawText}
                onChange={(event) => setRawText(event.target.value)}
              />
            </label>
            <button className="secondary-button full" type="button" onClick={simulateExtraction}>
              Extrair campos principais
            </button>

            <div className="api-card">
              <div>
                <p className="eyebrow">API oficial</p>
                <h3>Comunica PJe / DJEN</h3>
              </div>
              <div className="rule-note">
                Pesquisa principal sempre pelo nome. OAB/UF ficam apenas como
                refinamento manual quando o nome nao for usado.
              </div>
              <div className="field-grid">
                <label className="compact-field span-2">
                  <span>Nome do advogado - regra principal</span>
                  <input
                    value={djenSearch.nomeAdvogado}
                    onChange={(event) =>
                      updateDjenSearch("nomeAdvogado", event.target.value)
                    }
                    placeholder="Nome completo para pesquisar todas as inscricoes"
                  />
                </label>
                <label className="compact-field">
                  <span>OAB opcional</span>
                  <input
                    value={djenSearch.numeroOab}
                    onChange={(event) =>
                      updateDjenSearch("numeroOab", event.target.value)
                    }
                    placeholder="Nao usado se houver nome"
                  />
                </label>
                <label className="compact-field">
                  <span>UF opcional</span>
                  <input
                    value={djenSearch.ufOab}
                    onChange={(event) => updateDjenSearch("ufOab", event.target.value)}
                    placeholder="Nao usada se houver nome"
                    maxLength={2}
                  />
                </label>
                <label className="compact-field">
                  <span>Data inicial</span>
                  <input
                    type="date"
                    value={djenSearch.dataInicio}
                    onChange={(event) =>
                      updateDjenSearch("dataInicio", event.target.value)
                    }
                  />
                </label>
                <label className="compact-field">
                  <span>Data final</span>
                  <input
                    type="date"
                    value={djenSearch.dataFim}
                    onChange={(event) =>
                      updateDjenSearch("dataFim", event.target.value)
                    }
                  />
                </label>
                <label className="compact-field">
                  <span>Tribunal</span>
                  <input
                    value={djenSearch.siglaTribunal}
                    onChange={(event) =>
                      updateDjenSearch("siglaTribunal", event.target.value)
                    }
                    placeholder="TJSP"
                  />
                </label>
                <label className="compact-field">
                  <span>Meio</span>
                  <select
                    value={djenSearch.meio}
                    onChange={(event) => updateDjenSearch("meio", event.target.value)}
                  >
                    <option value="D">Diario</option>
                    <option value="E">Edital</option>
                  </select>
                </label>
              </div>
              <p>{apiStatus}</p>
              <button
                className="primary-button full"
                type="button"
                onClick={consultOfficialDjen}
                disabled={isLoadingDjen}
              >
                {isLoadingDjen ? "Consultando..." : "Consultar DJEN oficial"}
              </button>
            </div>

            <div className="timeline">
              <h3>Fluxo automatico proposto</h3>
              <div>
                <span>1</span>
                <p>Capturar publicacoes DJEN pelo nome do advogado, evitando perder inscricoes em outras UFs.</p>
              </div>
              <div>
                <span>2</span>
                <p>Identificar comando, prazo, termo inicial, providencias e risco.</p>
              </div>
              <div>
                <span>3</span>
                <p>Exigir confirmacao humana quando houver baixa confianca ou prazo fatal.</p>
              </div>
              <div>
                <span>4</span>
                <p>Gerar tarefas na agenda com lembrete dinamico tres dias antes.</p>
              </div>
            </div>

            <div className="risk-box">
              <h3>Regras de seguranca</h3>
              <p>
                Tokens de DJEN e Google devem ficar no servidor. O navegador recebe
                apenas dados processados, com historico de alteracoes e permissao por usuario.
              </p>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
