/* ===== CATEGORIAS E CORES ===== */
// Cada categoria tem uma cor (usada nos gráficos e legendas)
const CATS = {
  despesa: {
    "Contas e serviços": "#fbb017",
    Alimentação: "#f9515a",
    Transporte: "#18a8f1",
    Compras: "#9b5cf0",
    Entretenimento: "#ff67c0",
    Saúde: "#1fd0cf",
    "Outras despesas": "#94a3b8",
  },
  receita: {
    Salário: "#0b8f5a",
    Freelance: "#2fbf86",
    "Outras receitas": "#7ccfa9",
  },
};
// Junta as cores de despesas e receitas em um só objeto
const COR = { ...CATS.despesa, ...CATS.receita };

/* ===== FUNÇÕES AUXILIARES ===== */
// Atalho para document.querySelector
const $ = (s) => document.querySelector(s);
// Formata número como moeda brasileira (ex.: R$ 1.234,56)
const brl = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
// Formata data ISO (2026-11-11) como "11 de nov. de 2026"
const fdata = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
// Data de hoje no formato AAAA-MM-DD, ajustada ao fuso horário local
const hoje = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
// Mês atual no formato AAAA-MM
const mesAtual = () => hoje().slice(0, 7);
// Soma o campo "valor" de uma lista de transações
const soma = (a) => a.reduce((s, t) => s + t.valor, 0);

/* ===== DADOS (salvos no navegador) ===== */
// tx = transações, orc = orçamentos por categoria, tema = claro/escuro
let db = { tx: [], orc: {}, tema: "light" };
// Carrega o que foi salvo antes (se der erro, segue com o padrão)
try {
  db = { ...db, ...JSON.parse(localStorage.getItem("cf-dados") || "{}") };
} catch (e) {}
// Grava os dados no localStorage
const salvar = () => {
  try {
    localStorage.setItem("cf-dados", JSON.stringify(db));
  } catch (e) {}
};

// Aplica o tema no <html> e troca o ícone do botão
function tema() {
  document.documentElement.dataset.theme = db.tema;
  $("#btnTema").textContent = db.tema === "dark" ? "☀" : "☾";
}

/* ===== NAVEGAÇÃO ===== */
// Nome de cada tela (a chave é o que vem depois do # na URL)
const TITULOS = {
  painel: "Painel",
  transacoes: "Transações",
  orcamentos: "Orçamentos",
  relatorios: "Relatórios",
  configuracoes: "Configurações",
};
// Mostra a tela correta conforme o # da URL
function rota() {
  // Se o # não existir na lista, abre o painel
  const v = TITULOS[location.hash.slice(1)] ? location.hash.slice(1) : "painel";
  // Mostra só a seção escolhida
  document
    .querySelectorAll(".view")
    .forEach((s) => s.classList.toggle("on", s.id === v));
  // Marca o link ativo no menu
  document
    .querySelectorAll("nav a")
    .forEach((a) => a.classList.toggle("on", a.dataset.view === v));
  $("#titulo").textContent = TITULOS[v];
  render();
  window.scrollTo(0, 0); // volta ao topo ao trocar de tela (útil no celular)
}

/* ===== COMPONENTES ===== */
// Monta o HTML de uma linha de transação (apagar = true mostra o botão ✕)
function linhaTx(t, apagar) {
  const r = t.tipo === "receita";
  return `<div class="tx"><div class="ic ${r ? "r" : ""}">${t.cat[0]}</div>
    <div class="m"><b>${esc(t.desc)}</b><small>${t.cat}</small></div>
    <div class="v ${r ? "p" : "n"}">${r ? "+" : "-"} ${brl(t.valor)}<small>${fdata(t.data)}</small></div>
    ${apagar ? `<button class="del" data-id="${t.id}" aria-label="Excluir">✕</button>` : ""}</div>`;
}
// Escapa caracteres especiais para evitar HTML injetado pela descrição
const esc = (s) =>
  s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

// Gráfico de linha: despesas e receitas dia a dia no mês
function graficoLinha(mes) {
  const [ano, m] = mes.split("-").map(Number);
  // Último dia exibido: hoje (se for o mês atual) ou o último dia do mês
  const ult =
    mes === mesAtual() ? new Date().getDate() : new Date(ano, m, 0).getDate();
  // Um valor por dia, começando em zero
  const des = Array(ult).fill(0),
    rec = Array(ult).fill(0);
  // Soma as transações do mês no dia correspondente
  db.tx
    .filter((t) => t.data.startsWith(mes))
    .forEach((t) => {
      const d = +t.data.slice(8) - 1;
      if (d < ult) (t.tipo === "receita" ? rec : des)[d] += t.valor;
    });
  // W/H = tamanho do desenho; L,R,T,B = margens; max = maior valor
  const W = 640,
    H = 270,
    L = 62,
    R = 14,
    T = 12,
    B = 34,
    max = Math.max(...des, ...rec);
  if (!max)
    return `<div class="empty">Sem movimentações neste mês. Adicione uma transação para ver a tendência.</div>`;
  // topo = valor máximo "redondo" do eixo; x() e y() convertem valores em posição
  const topo = niceMax(max),
    x = (i) =>
      L + (ult === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (ult - 1)),
    y = (v) => T + (H - T - B) * (1 - v / topo);
  let g = "";
  // Linhas de grade horizontais e valores do eixo Y
  for (let k = 0; k <= 4; k++) {
    const v = (topo * k) / 4;
    g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-dasharray="3 4"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${abrev(v)}</text>`;
  }
  // Rótulos dos dias no eixo X (no máximo ~12 para não amontoar)
  const passo = Math.ceil(ult / 12);
  for (let i = 0; i < ult; i += passo)
    g += `<text x="${x(i)}" y="${H - 10}" text-anchor="middle">${i + 1} ${new Date(ano, m - 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</text>`;
  // Cria o traçado curvo da linha a partir de uma lista de valores
  const path = (a) =>
    a
      .map((v, i) => {
        if (!i) return `M${x(0)} ${y(v)}`;
        const mx = (x(i - 1) + x(i)) / 2;
        return `C${mx} ${y(a[i - 1])} ${mx} ${y(v)} ${x(i)} ${y(v)}`;
      })
      .join(" ");
  // Se só há 1 dia, desenha um ponto (uma linha de 1 ponto não aparece)
  const pontos = (a, c) =>
    ult === 1 ? `<circle cx="${x(0)}" cy="${y(a[0])}" r="4" fill="${c}"/>` : "";
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Receitas e despesas por dia">${g}
    <path d="${path(des)}" fill="none" stroke="var(--neg)" stroke-width="2.5"/>
    <path d="${path(rec)}" fill="none" stroke="var(--pos)" stroke-width="2.5"/>${pontos(des, "var(--neg)")}${pontos(rec, "var(--pos)")}</svg>`;
}
// Arredonda o valor máximo para um número "bonito" no eixo (ex.: 730 → 1000)
function niceMax(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return (Math.ceil((v / p) * 2) / 2) * p || 1;
}
// Abrevia valores do eixo: 1500 → "R$1,5K"
const abrev = (v) =>
  v >= 1000
    ? "R$" +
      (v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) +
      "K"
    : "R$" + Math.round(v);

// Gráfico de rosca: dados = lista de [categoria, valor]
function rosca(dados) {
  const tot = dados.reduce((s, d) => s + d[1], 0);
  if (!tot)
    return `<div class="empty">Nenhuma despesa registrada neste mês.</div>`;
  // r = raio; c = circunferência (comprimento total do círculo)
  const r = 70,
    c = 2 * Math.PI * r;
  let off = 0; // onde começa o próximo arco
  const arcos = dados
    .map(([n, v]) => {
      const f = (v / tot) * c; // tamanho do arco proporcional ao valor
      const s = `<circle r="${r}" cx="100" cy="100" fill="none" stroke="${COR[n]}" stroke-width="30" stroke-dasharray="${f} ${c - f}" stroke-dashoffset="${-off}" transform="rotate(-90 100 100)"><title>${n}: ${brl(v)}</title></circle>`;
      off += f;
      return s;
    })
    .join("");
  return `<svg viewBox="0 0 200 200" style="max-width:240px;margin:0 auto 12px" role="img" aria-label="Gastos por categoria">${arcos}</svg>`;
}
// Agrupa transações por categoria e ordena da maior para a menor
const porCat = (lista) =>
  Object.entries(
    lista.reduce((o, t) => ((o[t.cat] = (o[t.cat] || 0) + t.valor), o), {}),
  ).sort((a, b) => b[1] - a[1]);

/* ===== TELAS (preenche tudo com os dados atuais) ===== */
function render() {
  const mes = mesAtual(),
    doMes = db.tx.filter((t) => t.data.startsWith(mes));
  // Totais do mês
  const rec = soma(doMes.filter((t) => t.tipo === "receita")),
    des = soma(doMes.filter((t) => t.tipo === "despesa"));

  // -- Painel: cartões de resumo --
  $("#sRec").textContent = brl(rec);
  $("#sDes").textContent = brl(des);
  const sal = $("#sSal");
  sal.textContent = brl(rec - des);
  sal.className = rec - des < 0 ? "neg" : "pos"; // vermelho se negativo
  $("#sQtd").textContent = doMes.length;
  $("#sTot").textContent = `${db.tx.length} no total`;

  // -- Painel: gráficos --
  $("#linha").innerHTML = graficoLinha(mes);
  const cats = porCat(doMes.filter((t) => t.tipo === "despesa"));
  $("#rosca").innerHTML = rosca(cats);
  $("#legCat").innerHTML = Object.keys(CATS.despesa)
    .map((n) => `<span><i style="--c:${COR[n]}"></i>${n}</span>`)
    .join("");

  // -- Painel: 5 transações mais recentes (ordena por data, depois por id) --
  const ord = [...db.tx].sort(
    (a, b) => b.data.localeCompare(a.data) || b.id - a.id,
  );
  $("#recentes").innerHTML = ord.length
    ? ord
        .slice(0, 5)
        .map((t) => linhaTx(t))
        .join("")
    : `<div class="empty">Nenhuma transação ainda. Clique em “Adicionar” para registrar a primeira.</div>`;

  // -- Transações: lista completa com filtros de tipo e categoria --
  const ft = $("#fTipo").value,
    fc = $("#fCat").value;
  const fil = ord.filter(
    (t) => (!ft || t.tipo === ft) && (!fc || t.cat === fc),
  );
  $("#lista").innerHTML = fil.length
    ? fil.map((t) => linhaTx(t, true)).join("")
    : `<div class="empty">Nenhuma transação encontrada.</div>`;

  // -- Orçamentos: barra de progresso por categoria de despesa --
  $("#orcLista").innerHTML = Object.keys(CATS.despesa)
    .map((n) => {
      const gasto = soma(
          doMes.filter((t) => t.tipo === "despesa" && t.cat === n),
        ),
        lim = db.orc[n] || 0, // limite definido (0 = sem limite)
        p = lim ? Math.min((gasto / lim) * 100, 100) : 0; // % da barra (máx. 100)
      return `<div class="orc"><div class="r"><b>${n}</b><input type="number" inputmode="decimal" min="0" step="0.01" data-cat="${n}" value="${lim || ""}" placeholder="Limite (R$)" aria-label="Limite de ${n}"></div>
      <div class="bar ${gasto > lim && lim ? "over" : ""}"><i style="width:${p}%"></i></div>
      <small class="muted">${brl(gasto)} ${lim ? `de ${brl(lim)}${gasto > lim ? ` — estourou em ${brl(gasto - lim)}` : ""}` : "gastos (sem limite definido)"}</small></div>`;
    })
    .join("");

  // -- Relatórios: resumo de cada mês que tem transações (mais recente primeiro) --
  const meses = [...new Set(db.tx.map((t) => t.data.slice(0, 7)))]
    .sort()
    .reverse();
  $("#relMes").innerHTML = meses.length
    ? `<table><tr><th>Mês</th><th>Receitas</th><th>Despesas</th><th>Saldo</th></tr>${meses
        .map((k) => {
          const l = db.tx.filter((t) => t.data.startsWith(k)),
            r = soma(l.filter((t) => t.tipo === "receita")),
            d = soma(l.filter((t) => t.tipo === "despesa"));
          const nome = new Date(k + "-01T00:00:00").toLocaleDateString(
            "pt-BR",
            { month: "long", year: "numeric" },
          );
          return `<tr><td>${nome}</td><td>${brl(r)}</td><td>${brl(d)}</td><td><b>${brl(r - d)}</b></td></tr>`;
        })
        .join("")}</table>`
    : `<div class="empty">Os relatórios aparecem assim que você registrar transações.</div>`;

  // -- Relatórios: despesas do mês por categoria, com porcentagem --
  const tc = cats.reduce((s, c) => s + c[1], 0);
  $("#relCat").innerHTML = cats.length
    ? `<table>${cats.map(([n, v]) => `<tr><td>${n}</td><td>${((v / tc) * 100).toFixed(1).replace(".", ",")}%</td><td>${brl(v)}</td></tr>`).join("")}</table>`
    : `<div class="empty">Sem despesas neste mês.</div>`;
}

/* ===== FORMULÁRIO DE NOVA TRANSAÇÃO ===== */
// Gera as <option> da categoria conforme o tipo (despesa ou receita)
function opcoesCat(tipo) {
  return Object.keys(CATS[tipo])
    .map((c) => `<option>${c}</option>`)
    .join("");
}
// Ao trocar entre Despesa/Receita, troca também as categorias
document
  .querySelectorAll("[name=tipo]")
  .forEach((r) =>
    r.addEventListener(
      "change",
      () => ($("#selCat").innerHTML = opcoesCat(r.value)),
    ),
  );
// Botão "+ Adicionar": limpa o formulário, preenche a data de hoje e abre a janela
$("#btnAdd").onclick = () => {
  $("#form").reset();
  $("#selCat").innerHTML = opcoesCat("despesa");
  $("[name=data]").value = hoje();
  $("#dlg").showModal();
};
$("#btnCancel").onclick = () => $("#dlg").close();
// Ao salvar: cria a transação, grava e atualiza as telas
$("#form").addEventListener("submit", (e) => {
  const f = new FormData(e.target);
  db.tx.push({
    id: Date.now(), // id único baseado na hora
    tipo: f.get("tipo"),
    desc: f.get("desc").trim(),
    valor: Math.round(parseFloat(f.get("valor")) * 100) / 100, // 2 casas decimais
    cat: f.get("cat"),
    data: f.get("data"),
  });
  salvar();
  render();
});

/* ===== EVENTOS ===== */
// Filtro de categoria: "Todas" + todas as categorias
$("#fCat").innerHTML =
  `<option value="">Todas as categorias</option>` +
  Object.keys(COR)
    .map((c) => `<option>${c}</option>`)
    .join("");
// Mudou algum filtro → redesenha a lista
$("#fTipo").onchange = $("#fCat").onchange = render;
// Clique no ✕ de uma transação → apaga (um único listener para a lista toda)
$("#lista").onclick = (e) => {
  const b = e.target.closest(".del");
  if (b) {
    db.tx = db.tx.filter((t) => t.id !== +b.dataset.id);
    salvar();
    render();
  }
};
// Editou um limite de orçamento → salva o novo valor
$("#orcLista").onchange = (e) => {
  const c = e.target.dataset.cat;
  if (c) {
    db.orc[c] = parseFloat(e.target.value) || 0;
    salvar();
    render();
  }
};
// Alternar tema claro/escuro
$("#btnTema").onclick = () => {
  db.tema = db.tema === "dark" ? "light" : "dark";
  salvar();
  tema();
};
// Exportar: baixa os dados como arquivo JSON
$("#btnExp").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(db, null, 2)], { type: "application/json" }),
  );
  a.download = "controle-financeiro.json";
  a.click();
};
// Apagar tudo (pede confirmação; mantém o tema escolhido)
$("#btnLimpar").onclick = () => {
  if (confirm("Apagar todas as transações e orçamentos?")) {
    db = { tx: [], orc: {}, tema: db.tema };
    salvar();
    render();
  }
};
// Troca de tela quando o # da URL muda
window.addEventListener("hashchange", rota);

/* ===== INÍCIO ===== */
tema(); // aplica o tema salvo
rota(); // mostra a tela inicial
