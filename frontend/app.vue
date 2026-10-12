<template>
  <div class="app">
    <aside class="sidebar">
      <div class="brand">
        <div class="logo">G</div>
        <div>
          <strong>GHOST KD</strong>
          <span>Security Center</span>
        </div>
      </div>
      <nav>
        <a class="active">Dashboard</a>
        <a>Assets</a>
        <a>Scans</a>
        <a>Findings</a>
        <a>Reports</a>
        <a>Audit</a>
        <a>Intelligence</a>
      </nav>
      <div class="sidebar-bottom">
        <small>Security. Visibility. Control.</small>
      </div>
    </aside>

    <main>
      <header>
        <div>
          <div class="eyebrow">SECURITY CENTER</div>
          <h1>Dashboard</h1>
          <p>Estado general de seguridad de tus activos.</p>
        </div>
        <button @click="runScan">+ Nuevo análisis</button>
      </header>

      <section class="cards">
        <div class="card score">
          <span>Security Score</span>
          <strong>{{ dashboard.score }}</strong>
          <small>Buen nivel · requiere seguimiento</small>
        </div>
        <div class="card">
          <span>Activos</span>
          <strong>{{ dashboard.assets }}</strong>
          <small>Monitorizados</small>
        </div>
        <div class="card">
          <span>Findings abiertos</span>
          <strong>{{ dashboard.openFindings }}</strong>
          <small>Requieren atención</small>
        </div>
        <div class="card">
          <span>Críticos</span>
          <strong class="danger">{{ dashboard.critical }}</strong>
          <small>Prioridad máxima</small>
        </div>
      </section>

      <section class="grid">
        <div class="panel">
          <div class="panel-head">
            <h2>Vulnerabilidades recientes</h2>
            <span>Últimos hallazgos</span>
          </div>
          <div v-for="finding in findings" :key="finding.id" class="finding">
            <div>
              <b>{{ finding.title }}</b>
              <small>{{ finding.id }} · {{ finding.asset }}</small>
            </div>
            <div class="finding-right">
              <span :class="['badge', finding.severity.toLowerCase()]">{{ finding.severity }}</span>
              <span class="status">{{ finding.status }}</span>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <h2>GHOST KD Intelligence</h2>
            <span>AI analysis</span>
          </div>
          <div class="ai">
            <div class="ai-icon">✦</div>
            <h3>Análisis inteligente</h3>
            <p>Correlaciona evidencia de scanners, riesgo y contexto para ayudar a priorizar vulnerabilidades.</p>
            <div class="ai-row"><span>OpenAI</span><b>Preparado</b></div>
            <div class="ai-row"><span>Claude</span><b>Preparado</b></div>
            <div class="ai-row"><span>Risk Engine</span><b>Activo</b></div>
          </div>
        </div>
      </section>

      <section class="panel activity">
        <div class="panel-head">
          <h2>Actividad reciente</h2>
          <span>Audit trail</span>
        </div>
        <div class="timeline">
          <div><b>Scan creado</b><span>MaxiHabana · WEB</span><time>Hace 8 min</time></div>
          <div><b>Finding confirmado</b><span>GKD-002 · Security Headers</span><time>Hace 24 min</time></div>
          <div><b>Asset actualizado</b><span>API Gateway</span><time>Hace 1 h</time></div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const dashboard = ref({ score: 0, assets: 0, openFindings: 0, critical: 0 })
const findings = ref<any[]>([])

async function load() {
  try {
    dashboard.value = await $fetch(`${config.public.apiBase}/dashboard`)
    findings.value = await $fetch(`${config.public.apiBase}/findings`)
  } catch {
    dashboard.value = { score: 78, assets: 2, openFindings: 3, critical: 0 }
  }
}

async function runScan() {
  await $fetch(`${config.public.apiBase}/scans`, {
    method: 'POST',
    body: { assetId: 'AST-001', type: 'WEB' }
  })
  alert('Scan creado y puesto en cola.')
}

onMounted(load)
</script>

<style>
:root { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #172033; background: #f7f8fa; }
* { box-sizing: border-box; }
body { margin: 0; background: #f7f8fa; }
.app { min-height: 100vh; display: flex; }
.sidebar { width: 245px; background: #0f172a; color: white; padding: 24px 16px; display: flex; flex-direction: column; }
.brand { display:flex; align-items:center; gap:12px; padding: 8px; margin-bottom: 34px; }
.logo { width:38px; height:38px; border-radius:10px; display:grid; place-items:center; background:#1d4ed8; font-weight:800; }
.brand strong { display:block; letter-spacing:.5px; }
.brand span { display:block; color:#94a3b8; font-size:12px; margin-top:2px; }
nav a { display:block; color:#cbd5e1; padding:11px 12px; border-radius:8px; margin:4px 0; font-size:14px; }
nav a.active, nav a:hover { background:#1e293b; color:#fff; }
.sidebar-bottom { margin-top:auto; color:#64748b; font-size:11px; padding:8px; }
main { flex:1; padding:34px 42px; max-width:1500px; }
header { display:flex; justify-content:space-between; align-items:center; margin-bottom:28px; }
.eyebrow { font-size:11px; font-weight:700; letter-spacing:1.5px; color:#64748b; }
h1 { margin:6px 0; font-size:30px; }
header p { margin:0; color:#667085; }
button { border:0; background:#155eef; color:white; border-radius:8px; padding:11px 17px; font-weight:700; cursor:pointer; }
.cards { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:20px; }
.card, .panel { background:white; border:1px solid #e4e7ec; border-radius:12px; box-shadow:0 1px 2px rgba(16,24,40,.03); }
.card { padding:20px; min-height:130px; }
.card span, .card small { display:block; color:#667085; }
.card strong { display:block; font-size:32px; margin:10px 0 4px; }
.card .danger { color:#b91c1c; }
.grid { display:grid; grid-template-columns:1.7fr 1fr; gap:20px; }
.panel { padding:22px; }
.panel-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
.panel-head h2 { margin:0; font-size:17px; }
.panel-head span { color:#98a2b3; font-size:12px; }
.finding { display:flex; justify-content:space-between; align-items:center; padding:15px 0; border-top:1px solid #eef0f3; gap:15px; }
.finding b { display:block; font-size:14px; }
.finding small { color:#667085; display:block; margin-top:5px; }
.finding-right { display:flex; align-items:center; gap:10px; }
.badge { font-size:11px; font-weight:700; border-radius:999px; padding:5px 9px; background:#eef2ff; }
.badge.high { background:#fff0e6; color:#b54708; }
.badge.medium { background:#fffaeb; color:#b54708; }
.badge.low { background:#ecfdf3; color:#027a48; }
.badge.critical { background:#fef3f2; color:#b42318; }
.status { font-size:11px; color:#667085; }
.ai { background:#f8fafc; border:1px solid #eef2f6; border-radius:10px; padding:18px; }
.ai-icon { width:34px; height:34px; display:grid; place-items:center; background:#e0eaff; color:#155eef; border-radius:9px; font-size:20px; }
.ai h3 { margin:13px 0 6px; }
.ai p { color:#667085; line-height:1.5; font-size:13px; }
.ai-row { display:flex; justify-content:space-between; padding:10px 0; border-top:1px solid #e4e7ec; font-size:13px; }
.ai-row b { color:#027a48; }
.activity { margin-top:20px; }
.timeline > div { display:grid; grid-template-columns:1fr 1fr 120px; padding:13px 0; border-top:1px solid #eef0f3; font-size:13px; }
.timeline span, .timeline time { color:#667085; }
@media(max-width:900px) { .sidebar { display:none; } main { padding:22px; } .cards { grid-template-columns:repeat(2,1fr); } .grid { grid-template-columns:1fr; } }
</style>
