<template>
  <div class="app">
    <aside class="sidebar">
      <div class="brand">
        <div class="logo">G</div>
        <div><strong>GHOST KD</strong><span>Security Center</span></div>
      </div>
      <nav>
        <a v-for="t in tabs" :key="t" :class="{active: tab===t}" @click="tab=t">{{ t }}</a>
      </nav>
      <div class="sidebar-bottom">
        <label>Rol (RBAC)</label>
        <select v-model="role" @change="load">
          <option>VIEWER</option><option>ANALYST</option><option>ADMIN</option>
        </select>
        <small>Security. Visibility. Control.</small>
      </div>
    </aside>
    <main>
      <header>
        <div><div class="eyebrow">SECURITY CENTER · {{ role }}</div><h1>{{ tab }}</h1><p>{{ subtitle }}</p></div>
        <button v-if="tab==='Scans'" @click="runScan">+ Nuevo análisis</button>
        <button v-if="tab==='Assets'" @click="showAssetForm=!showAssetForm">+ Nuevo activo</button>
        <button v-if="tab==='Reports'" @click="createReport">+ Generar reporte</button>
      </header>

      <div v-if="error" class="alert">{{ error }}</div>

      <section v-if="tab==='Dashboard'" class="cards">
        <div class="card score"><span>Security Score</span><strong>{{ dashboard.score ?? '—' }}</strong><small>Fuente: {{ dashboard.source }}</small></div>
        <div class="card"><span>Activos</span><strong>{{ dashboard.assets ?? '—' }}</strong><small>Monitorizados</small></div>
        <div class="card"><span>Findings abiertos</span><strong>{{ dashboard.openFindings ?? '—' }}</strong><small>Requieren atención</small></div>
        <div class="card"><span>Críticos / Altos</span><strong class="danger">{{ dashboard.critical ?? 0 }} / {{ dashboard.high ?? 0 }}</strong><small>Medios: {{ dashboard.medium ?? 0 }} · Bajos: {{ dashboard.low ?? 0 }}</small></div>
      </section>

      <section v-if="tab==='Dashboard'" class="grid">
        <div class="panel"><div class="panel-head"><h2>Vulnerabilidades recientes</h2><span>{{ findings.length }} hallazgos</span></div>
          <div v-for="f in findings.slice(0,8)" :key="f.id" class="finding">
            <div><b>{{ f.title }}</b><small>{{ f.id }} · {{ f.asset || f.asset_id }} · score {{ f.riskScore ?? '—' }}</small></div>
            <div class="finding-right"><span :class="['badge', String(f.severity).toLowerCase()]">{{ f.severity }}</span><span class="status">{{ f.status }}</span></div>
          </div>
        </div>
        <div class="panel"><div class="panel-head"><h2>GHOST KD Intelligence</h2><span>AI analysis</span></div>
          <div class="ai"><div class="ai-icon">✦</div><h3>Análisis inteligente</h3>
            <p>Correlaciona evidencia para priorizar. Requiere AI_ENABLED=true y API key.</p>
            <div class="ai-row"><span>OpenAI</span><b>Preparado</b></div>
            <div class="ai-row"><span>Claude</span><b>Preparado</b></div>
            <div class="ai-row"><span>Risk Engine</span><b>Activo</b></div>
            <button class="secondary" @click="analyzeFirst">Analizar primer finding</button>
            <small v-if="aiMsg">{{ aiMsg }}</small>
          </div>
        </div>
      </section>

      <section v-if="tab==='Assets'" class="panel">
        <div v-if="showAssetForm" class="form">
          <input v-model="newAsset.name" placeholder="Nombre (ej: Mi App)" />
          <select v-model="newAsset.type"><option>WEB</option><option>API</option><option>MOBILE</option><option>INFRA</option></select>
          <input v-model="newAsset.environment" placeholder="Entorno (STAGING/PROD)" />
          <button @click="createAsset">Guardar</button>
        </div>
        <div v-for="a in assets" :key="a.id" class="finding"><div><b>{{ a.name }}</b><small>{{ a.id }} · {{ a.type }} · {{ a.environment }}</small></div></div>
      </section>

      <section v-if="tab==='Findings'" class="panel">
        <div class="form">
          <select v-model="statusFilter"><option value="">Todos los estados</option><option v-for="s in statuses" :key="s" :value="s">{{ s }}</option></select>
        </div>
        <div v-for="f in filteredFindings" :key="f.id" class="finding">
          <div><b>{{ f.title }}</b><small>{{ f.id }} · {{ f.asset || f.asset_id }} · score {{ f.riskScore }}</small></div>
          <div class="finding-right">
            <span :class="['badge', String(f.severity).toLowerCase()]">{{ f.severity }}</span>
            <select v-model="f.status" @change="changeStatus(f)"><option v-for="s in statuses" :key="s" :value="s">{{ s }}</option></select>
          </div>
        </div>
      </section>

      <section v-if="tab==='Scans'" class="panel">
        <div class="form">
          <select v-model="scanAsset"><option v-for="a in assets" :key="a.id" :value="a.id">{{ a.name }} ({{ a.id }})</option></select>
          <select v-model="scanType"><option>WEB</option><option>API</option><option>SAST</option><option>DAST</option></select>
          <button @click="runScan">Lanzar scan</button>
        </div>
        <div v-for="s in scans" :key="s.id" class="finding"><div><b>{{ s.id }}</b><small>{{ s.asset_id || s.assetId }} · {{ s.scan_type || s.type }} · {{ s.status }}</small></div></div>
      </section>

      <section v-if="tab==='Reports'" class="panel">
        <div v-for="r in reports" :key="r.id" class="finding"><div><b>{{ r.name }}</b><small>{{ r.id }} · {{ r.format }} · {{ r.status }}</small></div></div>
        <small v-if="!reports.length">Sin reportes. Pulsa “Generar reporte”.</small>
      </section>

      <section v-if="tab==='Audit'" class="panel">
        <div v-for="(l,i) in auditLogs" :key="i" class="finding"><div><b>{{ l.action }}</b><small>{{ l.resource_type || '' }} {{ l.resource_id || l.resource || '' }} · {{ l.created_at || l.at }}</small></div></div>
        <small v-if="!auditLogs.length">Sin actividad registrada.</small>
      </section>

      <section v-if="tab==='Intelligence'" class="panel">
        <p>Envía un finding al motor IA (requiere backend con AI_ENABLED=true).</p>
        <div class="form">
          <select v-model="aiFinding"><option v-for="f in findings" :key="f.id" :value="f.id">{{ f.id }} — {{ f.title }}</option></select>
          <select v-model="aiProvider"><option value="openai">OpenAI</option><option value="claude">Claude</option></select>
          <button @click="analyzeFirst">Analizar</button>
        </div>
        <small v-if="aiMsg">{{ aiMsg }}</small>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const api = () => config.public.apiBase as string
const tabs = ['Dashboard','Assets','Findings','Scans','Reports','Audit','Intelligence']
const tab = ref('Dashboard')
const role = ref('VIEWER')
const error = ref('')
const dashboard = ref<any>({})
const assets = ref<any[]>([])
const findings = ref<any[]>([])
const scans = ref<any[]>([])
const reports = ref<any[]>([])
const auditLogs = ref<any[]>([])
const statuses = ['NEW','CONFIRMED','IN_PROGRESS','FIXED','RETEST','RESOLVED','FALSE_POSITIVE','ACCEPTED_RISK']
const statusFilter = ref('')
const showAssetForm = ref(false)
const newAsset = ref({ name:'', type:'WEB', environment:'STAGING' })
const scanAsset = ref('AST-001'); const scanType = ref('WEB')
const aiFinding = ref(''); const aiProvider = ref('openai'); const aiMsg = ref('')

const subtitle = computed(() => ({
  Dashboard:'Estado general de seguridad de tus activos.',
  Assets:'Inventario de activos monitorizados.',
  Findings:'Ciclo de vida: NEW → CONFIRMED → IN_PROGRESS → FIXED → RETEST → RESOLVED.',
  Scans:'Lanza análisis solo contra activos autorizados.',
  Reports:'Genera evidencia en PDF/CSV/JSON.',
  Audit:'Trazabilidad de acciones sensibles.',
  Intelligence:'IA que interpreta evidencia, no ejecuta comandos.'
}[tab.value] ?? ''))

const filteredFindings = computed(() => statusFilter.value ? findings.value.filter(f=>f.status===statusFilter.value) : findings.value)
const headers = () => ({ 'x-role': role.value })

async function load() {
  error.value = ''
  try {
    const [d,a,f,s,r,au] = await Promise.all([
      $fetch(`${api()}/dashboard`, { headers: headers() }),
      $fetch(`${api()}/assets`, { headers: headers() }),
      $fetch(`${api()}/findings`, { headers: headers() }),
      $fetch(`${api()}/scans`, { headers: headers() }),
      $fetch(`${api()}/reports`, { headers: headers() }),
      $fetch(`${api()}/audit`, { headers: headers() }),
    ])
    dashboard.value = d; assets.value = a as any[]; findings.value = f as any[]
    scans.value = s as any[]; reports.value = r as any[]; auditLogs.value = au as any[]
    if (findings.value[0]) aiFinding.value = findings.value[0].id
    if (assets.value[0]) scanAsset.value = assets.value[0].id
  } catch (e:any) { error.value = 'No se pudo conectar al backend en ' + api() + '. ¿docker compose up --build?' }
}
async function runScan() {
  try { await $fetch(`${api()}/scans`, { method:'POST', headers: headers(), body:{ assetId: scanAsset.value, type: scanType.value } }); await load() }
  catch(e:any){ error.value = e?.data?.message || 'Error al crear scan (¿rol ANALYST? Cambia el rol arriba).' }
}
async function createAsset() {
  try { await $fetch(`${api()}/assets`, { method:'POST', headers: headers(), body: newAsset.value }); showAssetForm.value=false; newAsset.value={name:'',type:'WEB',environment:'STAGING'}; await load() }
  catch(e:any){ error.value = e?.data?.message || 'Error al crear activo (requiere ANALYST).' }
}
async function changeStatus(f:any) {
  try { await $fetch(`${api()}/findings/${f.id}/status`, { method:'PATCH', headers: headers(), body:{ status: f.status } }); await load() }
  catch(e:any){ error.value = e?.data?.message || 'No se pudo cambiar estado.'; await load() }
}
async function createReport() {
  try { await $fetch(`${api()}/reports`, { method:'POST', headers: headers(), body:{ name:`Reporte ${new Date().toLocaleString()}`, format:'PDF' } }); await load() }
  catch(e:any){ error.value = e?.data?.message || 'Error al crear reporte (requiere ANALYST).' }
}
async function analyzeFirst() {
  aiMsg.value = 'Enviando...'
  try {
    const r:any = await $fetch(`${api()}/intelligence/analyze`, { method:'POST', headers: headers(), body:{ findingId: aiFinding.value || findings.value[0]?.id, provider: aiProvider.value } })
    aiMsg.value = JSON.stringify(r)
  } catch(e:any){ aiMsg.value = e?.data?.message || 'IA deshabilitada o sin key (ver .env AI_ENABLED).' }
}
onMounted(load)
watch(tab, load)
</script>

<style>
:root {
  --bg: #F5F7FB; --surface: #FFFFFF; --ink: #0A2540; --muted: #5B6B82;
  --line: #E3E9F2; --primary: #155EEF; --primary-dark: #0B4DFF; --navy: #0A2540;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--ink); background: var(--bg);
}
* { box-sizing: border-box; } body { margin: 0; background: var(--bg); }
.app { min-height: 100vh; display: flex; }
.sidebar { width: 250px; background: var(--navy); color: white; padding: 24px 16px; display: flex; flex-direction: column; border-right: 1px solid #12325e; }
.brand { display:flex; align-items:center; gap:12px; padding: 8px; margin-bottom: 24px; }
.logo { width:40px; height:40px; border-radius:12px; display:grid; place-items:center; background: linear-gradient(135deg, #2E90FA, #155EEF); font-weight:800; font-size:20px; color:#fff; box-shadow: 0 4px 12px rgba(21,94,239,.35); }
.brand strong { display:block; letter-spacing:.4px; font-size:16px; } .brand span { display:block; color:#9DB4D0; font-size:12px; margin-top:2px; }
nav a { display:block; color:#C2D3E8; padding:11px 12px; border-radius:10px; margin:4px 0; font-size:14px; cursor:pointer; border:1px solid transparent; }
nav a.active, nav a:hover { background:#FFFFFF; color:var(--navy); border-color: var(--line); }
.sidebar-bottom { margin-top:auto; display:grid; gap:8px; color:#9DB4D0; font-size:12px; padding:8px; }
.sidebar-bottom select { background:#fff; color:var(--navy); border:1px solid var(--line); border-radius:10px; padding:9px; font-weight:600; }
main { flex:1; padding:34px 42px; max-width:1500px; }
header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; gap:16px; }
.eyebrow { font-size:11px; font-weight:800; letter-spacing:1.6px; color:var(--primary); }
h1 { margin:6px 0; font-size:30px; color:var(--navy); } header p { margin:0; color:var(--muted); }
button { border:0; background:var(--primary); color:white; border-radius:10px; padding:11px 17px; font-weight:700; cursor:pointer; box-shadow: 0 2px 8px rgba(21,94,239,.25); }
button:hover { background: var(--primary-dark); }
button.secondary { background:#EAF0FE; color:var(--primary); margin-top:12px; box-shadow:none; }
.alert { background:#fff; color:#B42318; border:1px solid #FECDCA; border-left:4px solid #B42318; padding:12px 16px; border-radius:10px; margin-bottom:16px; }
.cards { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:20px; }
.card, .panel { background:var(--surface); border:1px solid var(--line); border-radius:14px; box-shadow: 0 1px 2px rgba(10,37,64,.05); }
.card { padding:20px; border-top:3px solid var(--primary); } .card span,.card small{display:block;color:var(--muted);} .card strong{display:block;font-size:32px;margin:10px 0 4px;color:var(--navy);} .card .danger{color:#B42318;}
.grid { display:grid; grid-template-columns:1.7fr 1fr; gap:20px; } .panel { padding:22px; margin-bottom:20px; }
.panel-head { display:flex; justify-content:space-between; margin-bottom:12px; } .panel-head h2{margin:0;font-size:17px;} .panel-head span{color:#98a2b3;font-size:12px;}
.finding { display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-top:1px solid #eef0f3; gap:12px; }
.finding b{display:block;font-size:14px;} .finding small{color:#667085;display:block;margin-top:4px;}
.finding-right{display:flex;align-items:center;gap:10px;} .finding-right select{background:#f2f4f7;border:1px solid #e4e7ec;border-radius:8px;padding:6px;}
.badge{font-size:11px;font-weight:700;border-radius:999px;padding:5px 9px;background:#eef2ff;} .badge.high{background:#fff0e6;color:#b54708;} .badge.medium{background:#fffaeb;color:#b54708;} .badge.low{background:#ecfdf3;color:#027a48;} .badge.critical{background:#fef3f2;color:#b42318;}
.status{font-size:11px;color:#667085;} .form{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;} .form input,.form select{border:1px solid #e4e7ec;border-radius:8px;padding:10px;} 
.ai{background:#f8fafc;border:1px solid #eef2f6;border-radius:10px;padding:18px;} .ai-icon{width:34px;height:34px;display:grid;place-items:center;background:#e0eaff;color:#155eef;border-radius:9px;} .ai h3{margin:12px 0 6px;} .ai p{color:#667085;font-size:13px;} .ai-row{display:flex;justify-content:space-between;padding:10px 0;border-top:1px solid #e4e7ec;font-size:13px;} .ai-row b{color:#027a48;}
@media(max-width:900px){.sidebar{display:none;}main{padding:22px;}.cards{grid-template-columns:repeat(2,1fr);}.grid{grid-template-columns:1fr;}}
</style>
