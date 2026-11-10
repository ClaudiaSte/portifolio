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
const COR = { ...CATS.despesa, ...CATS.receita };
const $ = (s) => document.querySelector(s);
const brl = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fdata = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const hoje = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
const mesAtual = () => hoje().slice(0, 7);
const soma = (a) => a.reduce((s, t) => s + t.valor, 0);

let db = { tx: [], orc: {}, tema: "light" };
try {
  db = { ...db, ...JSON.parse(localStorage.getItem("cf-dados") || "{}") };
} catch (e) {}
const salvar = () => {
  try {
    localStorage.setItem("cf-dados", JSON.stringify(db));
  } catch (e) {}
};

function tema() {
  document.documentElement.dataset.theme = db.tema;
  $("#btnTema").textContent = db.tema === "dark" ? "☀" : "☾";
}

/* navegação */
const TITULOS = {
  painel: "Painel",
  transacoes: "Transações",
  orcamentos: "Orçamentos",
  relatorios: "Relatórios",
  configuracoes: "Configurações",
};
function rota() {
  const v = TITULOS[location.hash.slice(1)] ? location.hash.slice(1) : "painel";
  document
    .querySelectorAll(".view")
    .forEach((s) => s.classList.toggle("on", s.id === v));
  document
    .querySelectorAll("nav a")
    .forEach((a) => a.classList.toggle("on", a.dataset.view === v));
  $("#titulo").textContent = TITULOS[v];
  render();
}

/* componentes */
function linhaTx(t, apagar) {
  const r = t.tipo === "receita";
  return `<div class="tx"><div class="ic ${r ? "r" : ""}">${t.cat[0]}</div>
    <div class="m"><b>${esc(t.desc)}</b><small>${t.cat}</small></div>
    <div class="v ${r ? "p" : "n"}">${r ? "+" : "-"} ${brl(t.valor)}<small>${fdata(t.data)}</small></div>
    ${apagar ? `<button class="del" data-id="${t.id}" aria-label="Excluir">✕</button>` : ""}</div>`;
}
const esc = (s) =>
  s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

function graficoLinha(mes) {
  const [ano, m] = mes.split("-").map(Number);
  const ult =
    mes === mesAtual() ? new Date().getDate() : new Date(ano, m, 0).getDate();
  const des = Array(ult).fill(0),
    rec = Array(ult).fill(0);
  db.tx
    .filter((t) => t.data.startsWith(mes))
    .forEach((t) => {
      const d = +t.data.slice(8) - 1;
      if (d < ult) (t.tipo === "receita" ? rec : des)[d] += t.valor;
    });
  const W = 640,
    H = 270,
    L = 62,
    R = 14,
    T = 12,
    B = 34,
    max = Math.max(...des, ...rec);
  if (!max)
    return `<div class="empty">Sem movimentações neste mês. Adicione uma transação para ver a tendência.</div>`;
  const topo = niceMax(max),
    x = (i) =>
      L + (ult === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (ult - 1)),
    y = (v) => T + (H - T - B) * (1 - v / topo);
  let g = "";
  for (let k = 0; k <= 4; k++) {
    const v = (topo * k) / 4;
    g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-dasharray="3 4"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${abrev(v)}</text>`;
  }
  const passo = Math.ceil(ult / 12);
  for (let i = 0; i < ult; i += passo)
    g += `<text x="${x(i)}" y="${H - 10}" text-anchor="middle">${i + 1} ${new Date(ano, m - 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</text>`;
  const path = (a) =>
    a
      .map((v, i) => {
        if (!i) return `M${x(0)} ${y(v)}`;
        const mx = (x(i - 1) + x(i)) / 2;
        return `C${mx} ${y(a[i - 1])} ${mx} ${y(v)} ${x(i)} ${y(v)}`;
      })
      .join(" ");
  const pontos = (a, c) =>
    ult === 1 ? `<circle cx="${x(0)}" cy="${y(a[0])}" r="4" fill="${c}"/>` : "";
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Receitas e despesas por dia">${g}
    <path d="${path(des)}" fill="none" stroke="var(--neg)" stroke-width="2.5"/>
    <path d="${path(rec)}" fill="none" stroke="var(--pos)" stroke-width="2.5"/>${pontos(des, "var(--neg)")}${pontos(rec, "var(--pos)")}</svg>`;
}
function niceMax(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return (Math.ceil((v / p) * 2) / 2) * p || 1;
}
const abrev = (v) =>
  v >= 1000
    ? "R$" +
      (v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) +
      "K"
    : "R$" + Math.round(v);

function rosca(dados) {
  const tot = dados.reduce((s, d) => s + d[1], 0);
  if (!tot)
    return `<div class="empty">Nenhuma despesa registrada neste mês.</div>`;
  const r = 70,
    c = 2 * Math.PI * r;
  let off = 0;
  const arcos = dados
    .map(([n, v]) => {
      const f = (v / tot) * c;
      const s = `<circle r="${r}" cx="100" cy="100" fill="none" stroke="${COR[n]}" stroke-width="30" stroke-dasharray="${f} ${c - f}" stroke-dashoffset="${-off}" transform="rotate(-90 100 100)"><title>${n}: ${brl(v)}</title></circle>`;
      off += f;
      return s;
    })
    .join("");
  return `<svg viewBox="0 0 200 200" style="max-width:240px;margin:0 auto 12px" role="img" aria-label="Gastos por categoria">${arcos}</svg>`;
}
const porCat = (lista) =>
  Object.entries(
    lista.reduce((o, t) => ((o[t.cat] = (o[t.cat] || 0) + t.valor), o), {}),
  ).sort((a, b) => b[1] - a[1]);

/* telas */
function render() {
  const mes = mesAtual(),
    doMes = db.tx.filter((t) => t.data.startsWith(mes));
  const rec = soma(doMes.filter((t) => t.tipo === "receita")),
    des = soma(doMes.filter((t) => t.tipo === "despesa"));
  $("#sRec").textContent = brl(rec);
  $("#sDes").textContent = brl(des);
  const sal = $("#sSal");
  sal.textContent = brl(rec - des);
  sal.className = rec - des < 0 ? "neg" : "pos";
  $("#sQtd").textContent = doMes.length;
  $("#sTot").textContent = `${db.tx.length} no total`;
  $("#linha").innerHTML = graficoLinha(mes);
  const cats = porCat(doMes.filter((t) => t.tipo === "despesa"));
  $("#rosca").innerHTML = rosca(cats);
  $("#legCat").innerHTML = Object.keys(CATS.despesa)
    .map((n) => `<span><i style="--c:${COR[n]}"></i>${n}</span>`)
    .join("");
  const ord = [...db.tx].sort(
    (a, b) => b.data.localeCompare(a.data) || b.id - a.id,
  );
  $("#recentes").innerHTML = ord.length
    ? ord
        .slice(0, 5)
        .map((t) => linhaTx(t))
        .join("")
    : `<div class="empty">Nenhuma transação ainda. Clique em “Adicionar” para registrar a primeira.</div>`;

  const ft = $("#fTipo").value,
    fc = $("#fCat").value;
  const fil = ord.filter(
    (t) => (!ft || t.tipo === ft) && (!fc || t.cat === fc),
  );
  $("#lista").innerHTML = fil.length
    ? fil.map((t) => linhaTx(t, true)).join("")
    : `<div class="empty">Nenhuma transação encontrada.</div>`;

  $("#orcLista").innerHTML = Object.keys(CATS.despesa)
    .map((n) => {
      const gasto = soma(
          doMes.filter((t) => t.tipo === "despesa" && t.cat === n),
        ),
        lim = db.orc[n] || 0,
        p = lim ? Math.min((gasto / lim) * 100, 100) : 0;
      return `<div class="orc"><div class="r"><b>${n}</b><input type="number" min="0" step="0.01" data-cat="${n}" value="${lim || ""}" placeholder="Limite (R$)" aria-label="Limite de ${n}"></div>
      <div class="bar ${gasto > lim && lim ? "over" : ""}"><i style="width:${p}%"></i></div>
      <small class="muted">${brl(gasto)} ${lim ? `de ${brl(lim)}${gasto > lim ? ` — estourou em ${brl(gasto - lim)}` : ""}` : "gastos (sem limite definido)"}</small></div>`;
    })
    .join("");

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
  const tc = cats.reduce((s, c) => s + c[1], 0);
  $("#relCat").innerHTML = cats.length
    ? `<table>${cats.map(([n, v]) => `<tr><td>${n}</td><td>${((v / tc) * 100).toFixed(1).replace(".", ",")}%</td><td>${brl(v)}</td></tr>`).join("")}</table>`
    : `<div class="empty">Sem despesas neste mês.</div>`;
}

/* formulário */
function opcoesCat(tipo) {
  return Object.keys(CATS[tipo])
    .map((c) => `<option>${c}</option>`)
    .join("");
}
document
  .querySelectorAll("[name=tipo]")
  .forEach((r) =>
    r.addEventListener(
      "change",
      () => ($("#selCat").innerHTML = opcoesCat(r.value)),
    ),
  );
$("#btnAdd").onclick = () => {
  $("#form").reset();
  $("#selCat").innerHTML = opcoesCat("despesa");
  $("[name=data]").value = hoje();
  $("#dlg").showModal();
};
$("#btnCancel").onclick = () => $("#dlg").close();
$("#form").addEventListener("submit", (e) => {
  const f = new FormData(e.target);
  db.tx.push({
    id: Date.now(),
    tipo: f.get("tipo"),
    desc: f.get("desc").trim(),
    valor: Math.round(parseFloat(f.get("valor")) * 100) / 100,
    cat: f.get("cat"),
    data: f.get("data"),
  });
  salvar();
  render();
});

/* eventos */
$("#fCat").innerHTML =
  `<option value="">Todas as categorias</option>` +
  Object.keys(COR)
    .map((c) => `<option>${c}</option>`)
    .join("");
$("#fTipo").onchange = $("#fCat").onchange = render;
$("#lista").onclick = (e) => {
  const b = e.target.closest(".del");
  if (b) {
    db.tx = db.tx.filter((t) => t.id !== +b.dataset.id);
    salvar();
    render();
  }
};
$("#orcLista").onchange = (e) => {
  const c = e.target.dataset.cat;
  if (c) {
    db.orc[c] = parseFloat(e.target.value) || 0;
    salvar();
    render();
  }
};
$("#btnTema").onclick = () => {
  db.tema = db.tema === "dark" ? "light" : "dark";
  salvar();
  tema();
};
$("#btnExp").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(db, null, 2)], { type: "application/json" }),
  );
  a.download = "controle-financeiro.json";
  a.click();
};
$("#btnLimpar").onclick = () => {
  if (confirm("Apagar todas as transações e orçamentos?")) {
    db = { tx: [], orc: {}, tema: db.tema };
    salvar();
    render();
  }
};
window.addEventListener("hashchange", rota);
tema();
rota();
