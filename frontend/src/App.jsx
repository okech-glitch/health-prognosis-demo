import React, { useEffect, useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts'

const qc = new QueryClient()
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

// Simple, human-friendly explanations for each feature
const FEATURE_TIPS = {
  age: 'Older age generally increases risk because recovery can be slower and complications more common.',
  lab_result: 'Higher lab values (e.g., high blood pressure) may indicate instability and higher risk.',
  comorbidity_score: 'More existing conditions usually increase risk due to added complexity.',
  length_of_stay: 'Longer stays can indicate severity; very short stays can also miss follow‑up needs.',
  diagnosis_code: 'Some diagnoses have higher readmission patterns than others.',
  gender: 'Used statistically; not a clinical conclusion on its own.',
  medication: 'More/stronger meds may reflect complexity. Adherence and interactions matter.',
}

function getFeatureTip(name) {
  return FEATURE_TIPS[name] || 'This input helps the model quantify overall stability and follow‑up needs.'
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const item = payload[0].payload
    const fname = item.feature
    return (
      <div className="rounded border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-3 text-xs max-w-xs">
        <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{fname}</div>
        <div className="text-slate-700 dark:text-slate-200">{getFeatureTip(fname)}</div>
      </div>
    )
  }
  return null
}

function InfoPanel() {
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">How this demo works</h2>
      <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-200 space-y-1">
        <li><b>Age</b>: Patient age in years (0-120).</li>
        <li><b>Gender</b>: Male or Female.</li>
        <li><b>ICD-10</b>: Diagnosis code (e.g., <code>I10</code> hypertension, <code>E11</code> diabetes).</li>
        <li><b>Lab</b>: A key lab value (e.g., systolic BP). Higher values may increase risk.</li>
        <li><b>Meds</b>: Comma-separated medications (e.g., Aspirin,Statins).</li>
        <li><b>LOS</b>: Length of stay in days for the recent admission.</li>
        <li><b>Comorbidity</b>: Count/score of other conditions (0-10).</li>
        <li><b>Result</b>: You get a <b>risk probability</b> and a <b>category</b> (Low / Medium / High).</li>
        <li><b>Feature bars</b>: Show which inputs tend to influence the model most for this prediction.</li>
      </ul>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">This is a synthetic-data demo for portfolio purposes only — not for medical use.</p>
    </div>
  )
}

function GuidedTour({ open, onClose }) {
  const steps = [
    {
      title: 'Single Prediction',
      body: 'Enter age, gender, ICD-10 code, lab value, meds, LOS, and comorbidity. Hover labels for tips.'
    },
    {
      title: 'Predict',
      body: 'Click Predict to get a probability and category. Use demo patient buttons to try realistic scenarios.'
    },
    {
      title: 'Results',
      body: 'Risk bar uses teal/cyan/red to show Low/Medium/High. Bars show which inputs influenced the risk most.'
    },
    {
      title: 'Batch',
      body: 'Upload a CSV for multiple patients. Use Template to download a ready-made CSV, then Predict Batch and Download.'
    },
  ]
  const [idx, setIdx] = useState(0)
  useEffect(()=>{ if(!open) setIdx(0) }, [open])
  if (!open) return null
  const s = steps[idx]
  const isLast = idx === steps.length - 1
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="card max-w-lg w-[90%]">
        <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
        <p className="text-sm text-gray-700 dark:text-gray-200">{s.body}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-2 bg-gray-100 dark:bg-slate-700 rounded" onClick={onClose}>Skip</button>
          {!isLast && <button className="px-3 py-2 bg-primary text-white rounded" onClick={()=>setIdx(idx+1)}>Next</button>}
          {isLast && <button className="px-3 py-2 bg-primary text-white rounded" onClick={onClose}>Done</button>}
        </div>
      </div>
    </div>
  )
}

const DEMO_PATIENTS = [
  { label: 'Elderly HTN', age: 78, gender: 'Male', diagnosis_code: 'I10', lab_result: 165, medication: 'ACE Inhibitor,Beta Blocker', length_of_stay: 5, comorbidity_score: 3 },
  { label: 'Middle-age T2D', age: 52, gender: 'Female', diagnosis_code: 'E11', lab_result: 135, medication: 'Metformin,Statins', length_of_stay: 2, comorbidity_score: 2 },
  { label: 'Young healthy', age: 28, gender: 'Female', diagnosis_code: 'M54', lab_result: 110, medication: 'Aspirin', length_of_stay: 1, comorbidity_score: 0 },
]

function PredictForm({ onResult, onSaveRecent }) {
  const [form, setForm] = useState({
    age: 70,
    gender: 'Female',
    diagnosis_code: 'I10',
    lab_result: 145,
    medication: 'Aspirin,Statins',
    length_of_stay: 3,
    comorbidity_score: 2,
  })

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`${API_BASE}/predict/single`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Prediction failed')
      return res.json()
    },
    onSuccess: (data) => {
      onResult(data)
      try {
        const item = { ...form, ts: Date.now() }
        const key = 'recent_inputs'
        const prev = JSON.parse(localStorage.getItem(key) || '[]')
        const next = [item, ...prev].slice(0,5)
        localStorage.setItem(key, JSON.stringify(next))
        onSaveRecent(next)
      } catch {}
    },
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: name === 'age' || name === 'lab_result' || name === 'length_of_stay' || name === 'comorbidity_score' ? Number(value) : value }))
  }
  const downloadTemplate = () => {
    const headers = ['patient_id','age','gender','diagnosis_code','lab_result','medication','length_of_stay','comorbidity_score']
    const sample = [
      ['1','70','Female','I10','145','Aspirin,Statins','3','2'],
      ['2','45','Male','E11','118','Metformin','1','1'],
    ]
    const csv = [headers.join(','), ...sample.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ehr_batch_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const loadSample = (age, lab) => {
    setForm((f) => {
      const next = { ...f, age, lab_result: lab }
      // auto-predict after loading a sample
      mutation.mutate(next)
      return next
    })
  }

  useEffect(() => {
    const handler = (ev) => {
      const r = ev.detail
      if (r) setForm((f) => ({
        ...f,
        age: r.age ?? f.age,
        gender: r.gender ?? f.gender,
        diagnosis_code: r.diagnosis_code ?? f.diagnosis_code,
        lab_result: r.lab_result ?? f.lab_result,
        medication: r.medication ?? f.medication,
        length_of_stay: r.length_of_stay ?? f.length_of_stay,
        comorbidity_score: r.comorbidity_score ?? f.comorbidity_score,
      }))
    }
    window.addEventListener('load-sample', handler)
    return () => window.removeEventListener('load-sample', handler)
  }, [])

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-3">Patient Input</h2>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col" title="Patient age in years (0-120)">Age<input name="age" type="number" min={0} max={120} value={form.age} onChange={handleChange} className="border border-gray-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-gray-300"/></label>
        <label className="flex flex-col" title="Male or Female">Gender<select name="gender" value={form.gender} onChange={handleChange} className="border border-gray-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"><option>Male</option><option>Female</option></select></label>
        <label className="flex flex-col" title="ICD-10 code (e.g., I10 = hypertension)">ICD-10<input name="diagnosis_code" value={form.diagnosis_code} onChange={handleChange} className="border border-gray-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"/></label>
        <label className="flex flex-col" title="Key lab value; higher may increase risk">Lab (e.g., SBP)<input name="lab_result" type="number" value={form.lab_result} onChange={handleChange} className="border border-gray-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"/></label>
        <label className="flex flex-col" title="Comma-separated list (e.g., Aspirin,Statins)">Meds<input name="medication" value={form.medication} onChange={handleChange} className="border border-gray-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"/></label>
        <label className="flex flex-col" title="Length of stay in days">LOS<input name="length_of_stay" type="number" value={form.length_of_stay} onChange={handleChange} className="border border-gray-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"/></label>
        <label className="flex flex-col" title="Other conditions score (0-10)">Comorbidity<input name="comorbidity_score" type="number" value={form.comorbidity_score} onChange={handleChange} className="border border-gray-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"/></label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        <button onClick={() => mutation.mutate(form)} className="px-4 py-2 bg-primary text-white rounded">Predict</button>
        <button onClick={() => loadSample(45, 118)} className="px-3 py-2 bg-secondary text-white rounded">Sample A</button>
        <button onClick={() => loadSample(80, 165)} className="px-3 py-2 bg-accent text-white rounded">Sample B</button>
        <span className="text-xs text-gray-500 dark:text-gray-300 ml-2">Demo patients:</span>
        {DEMO_PATIENTS.map((p, i) => (
          <button
            key={i}
            className="text-xs px-3 py-2 rounded border border-primary text-primary hover:bg-primary hover:text-white transition"
            onClick={() => {
              const next = {
                age: p.age,
                gender: p.gender,
                diagnosis_code: p.diagnosis_code,
                lab_result: p.lab_result,
                medication: p.medication,
                length_of_stay: p.length_of_stay,
                comorbidity_score: p.comorbidity_score,
              }
              setForm(next)
              // auto-predict after selecting demo patient
              mutation.mutate(next)
            }}
          >{p.label}</button>
        ))}
      </div>
      {mutation.isPending && <p className="mt-2 text-sm text-gray-500">Predicting...</p>}
      {mutation.isError && <p className="mt-2 text-sm text-red-600">{mutation.error.message}</p>}
    </div>
  )
}

function Results({ data }) {
  if (!data) return null
  const { risk_probability, risk_category, explanations } = data
  const pct = Math.round(risk_probability * 100)
  const importances = explanations?.feature_importances || []
  const top3 = [...importances].sort((a,b)=>b.importance-a.importance).slice(0,3)
  const reasonText = top3.map(x=>x.feature.replaceAll('_',' ')).join(', ')
  const guidance = pct >= 70 ?
    'High risk: consider close follow-up, medication review, and monitoring key labs.' :
    (pct >= 40 ? 'Moderate risk: keep an eye on the highlighted factors and consider lifestyle/medication adjustments.' :
    'Low risk: continue current care plan; maintain healthy habits and regular check-ups.')
  const [whyOpen, setWhyOpen] = useState(false)
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-3">Results</h2>
      <p className="text-lg">Risk: <span className="font-bold">{pct}%</span> <span className="ml-2 text-sm px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 dark:text-slate-100">{risk_category}</span></p>
      <div className="w-full h-3 bg-gray-200 rounded mt-2">
        <div className={`h-3 rounded ${pct>=70?'bg-danger':pct>=40?'bg-accent':'bg-primary'}`} style={{width: `${pct}%`}} />
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Lower is better. 0-39% = Low, 40-69% = Medium, 70%+ = High.</p>
      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={importances}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="feature" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="importance" fill="#0d9488" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 p-3 rounded bg-gray-50 dark:bg-slate-700/60">
        <h3 className="font-semibold mb-1 text-slate-900 dark:text-slate-100">What this means</h3>
        <p className="text-sm text-slate-700 dark:text-slate-200">
          This patient has an estimated <b>{pct}%</b> chance of readmission, which falls into the <b>{risk_category}</b> range.
          The model’s top signals for this estimate are: <b>{reasonText || 'age, labs, and comorbidity score'}</b>.
        </p>
        <ul className="mt-2 text-sm list-disc pl-5 text-slate-700 dark:text-slate-200 space-y-1">
          <li>{guidance}</li>
          <li>Feature bars above show which inputs influenced the risk most for this prediction.</li>
          <li>Demo only — synthetic data; not for medical use.</li>
        </ul>
        <div className="mt-3">
          <button onClick={()=>setWhyOpen(v=>!v)} className="text-sm px-3 py-2 rounded border border-primary text-primary hover:bg-primary hover:text-white transition">
            {whyOpen ? 'Hide' : 'Why these features?'}
          </button>
          {whyOpen && (
            <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
              {importances.map((f, i) => (
                <div key={i} className="rounded border border-gray-200 dark:border-slate-600 p-3">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{f.feature.replaceAll('_',' ')}</div>
                  <div className="text-slate-700 dark:text-slate-200 mt-1">{getFeatureTip(f.feature)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
 
function BatchUpload() {
  const [file, setFile] = useState(null)
  const [rows, setRows] = useState([])
  const [error, setError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const onFileChange = (e) => {
    setFile(e.target.files?.[0] || null)
    setRows([])
    setError("")
  }
  const downloadTemplate = () => {
    const headers = ['patient_id','age','gender','diagnosis_code','lab_result','medication','length_of_stay','comorbidity_score']
    const sample = [
      ['1','70','Female','I10','145','Aspirin,Statins','3','2'],
      ['2','45','Male','E11','118','Metformin','1','1'],
    ]
    const csv = [headers.join(','), ...sample.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ehr_batch_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }
  const downloadCsv = () => {
    if (!rows.length) return
    const headers = Object.keys(rows[0])
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => String(r[h]).replaceAll('"', '""')).map(v=>/[,\n]/.test(v)?`"${v}"`:v).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'batch_predictions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }
  const previewCols = useMemo(()=> rows[0] ? Object.keys(rows[0]) : [], [rows])
  const requiredCols = useMemo(()=>['age','gender','diagnosis_code','lab_result','medication'], [])

  const validateHeaders = () => {
    if (!previewCols.length) return true
    const missing = requiredCols.filter(c => !previewCols.includes(c))
    if (missing.length) {
      setError(`Missing columns: ${missing.join(', ')}`)
      return false
    }
    return true
  }

  const postFormData = async (fd) => {
    const res = await fetch(`${API_BASE}/predict/batch`, { method: 'POST', body: fd })
    if (!res.ok) {
      let msg = `Upload failed (${res.status})`
      try { const data = await res.json(); msg = data.detail || JSON.stringify(data) } catch {}
      throw new Error(msg)
    }
    return res.json()
  }
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-3">Batch Upload</h2>
      <div className="flex items-center gap-3 flex-wrap">
        <input type="file" accept=".csv" onChange={onFileChange} className="border border-gray-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
        <button onClick={async()=>{
          setError("");
          if (!file) { setError('Please choose a CSV file'); return }
          if (!validateHeaders()) return
          try {
            setIsUploading(true)
            const fd = new FormData()
            fd.append('file', file)
            const data = await postFormData(fd)
            setRows(data.results || [])
          } catch (e) {
            setError(e.message)
          } finally {
            setIsUploading(false)
          }
        }} className="px-4 py-2 bg-primary text-white rounded disabled:opacity-60" disabled={!file || isUploading}>{isUploading? 'Uploading...' : 'Predict Batch'}</button>
        <button onClick={downloadCsv} className="px-3 py-2 bg-secondary text-white rounded" disabled={!rows.length}>Download CSV</button>
        <button onClick={downloadTemplate} className="px-3 py-2 bg-accent text-white rounded">Template</button>
        <button onClick={async()=>{
          setError("")
          try {
            setIsUploading(true)
            const headers = requiredCols
            const sample = [
              ['70','Female','I10','145','Aspirin,Statins'],
              ['45','Male','E11','118','Metformin']
            ]
            const csv = [headers.join(','), ...sample.map(r=>r.join(','))].join('\n')
            const blob = new Blob([csv], {type:'text/csv'})
            const fd = new FormData()
            fd.append('file', new File([blob], 'sample.csv', { type:'text/csv' }))
            const data = await postFormData(fd)
            setRows(data.results || [])
          } catch(e) {
            setError(e.message)
          } finally { setIsUploading(false) }
        }} className="px-3 py-2 rounded border border-primary text-primary hover:bg-primary hover:text-white transition disabled:opacity-60" disabled={isUploading}>Test with sample</button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {!!rows.length && (
        <div className="mt-4 overflow-auto border border-gray-200 dark:border-slate-600 rounded">
          <table className="min-w-full text-sm text-slate-900 dark:text-slate-100">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                {previewCols.map(c => (<th key={c} className="text-left px-3 py-2 border-b border-gray-200 dark:border-slate-600">{c}</th>))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((r, i) => (
                <tr key={i} className={i%2? 'bg-white dark:bg-slate-800':'bg-gray-50 dark:bg-slate-700'}>
                  {previewCols.map(c => (
                    <td key={c} className="px-3 py-2 border-b border-gray-200 dark:border-slate-600">
                      <span className="text-slate-900 dark:text-slate-100">{String(r[c])}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 50 && <div className="p-2 text-xs text-gray-500 dark:text-gray-400">Showing first 50 rows…</div>}
        </div>
      )}
      {!!rows.length && (
        <div className="mt-4 p-3 rounded bg-gray-50 dark:bg-slate-700/60 text-sm text-slate-700 dark:text-slate-200">
          <h3 className="font-semibold mb-1">How to read these</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Risk distribution</b>: Shows how many patients fall into Low, Medium, and High risk. Fewer High bars is better.</li>
            <li><b>Feature vs risk</b>: Each row is a patient input (Age, Lab, etc.). Each colored block is a range (bin). 
              Green blocks mean lower average risk for that range; red means higher. Hover a block to see the exact range and average risk.</li>
            <li>Use this to spot patterns. For example, if the red blocks cluster at high lab values, those patients tend to have higher risk.</li>
          </ul>
        </div>
      )}
      {/* Analytics visuals */}
      {!!rows.length && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {/* Risk distribution */}
          <div className="card">
            <h3 className="font-semibold mb-2">Risk distribution</h3>
            {(() => {
              const probs = rows.map(r => Number(r.risk_probability ?? r.prob ?? r.probability ?? 0)).filter(v=>!isNaN(v))
              const cats = rows.map(r => String(r.risk_category || ''))
              const counts = { Low:0, Medium:0, High:0 }
              cats.forEach(c=>{ if(counts[c]!==undefined) counts[c]++ })
              const data = [
                { name:'Low', value: counts.Low },
                { name:'Medium', value: counts.Medium },
                { name:'High', value: counts.High },
              ]
              return (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )
            })()}
          </div>

          {/* Feature vs risk heatmap */}
          <div className="card">
            <h3 className="font-semibold mb-2">Feature vs risk (mean by bin)</h3>
            {(() => {
              const probs = rows.map(r => Number(r.risk_probability ?? 0))
              const feats = ['age','lab_result','comorbidity_score','length_of_stay']
              const bins = {
                age: [0,30,45,60,75,200],
                lab_result: [0,110,130,150,999],
                comorbidity_score: [-1,1,3,10],
                length_of_stay: [-1,2,5,30]
              }
              const binLabels = (edges)=> edges.slice(0,-1).map((e,i)=>`${edges[i]}–${edges[i+1]}`)
              const rowsHM = feats.map(f=>{
                const edges = bins[f]
                const sums = new Array(edges.length-1).fill(0)
                const counts = new Array(edges.length-1).fill(0)
                rows.forEach((r,idx)=>{
                  const v = Number(r[f] ?? 0)
                  for(let b=0;b<edges.length-1;b++){
                    if(v>edges[b] && v<=edges[b+1]){ sums[b]+=probs[idx]||0; counts[b]++; break }
                  }
                })
                const means = sums.map((s,i)=> counts[i]? s/counts[i] : 0)
                return { feature:f, edges, means }
              })
              const color = (p)=>{ // p in [0,1]
                const pct = Math.max(0, Math.min(1, p))
                const hue = 160 - 160*pct // green to red
                const light = 35 + 20*(1-pct)
                return `hsl(${hue} 80% ${light}%)`
              }
              return (
                <div className="space-y-3">
                  {rowsHM.map(row=> (
                    <div key={row.feature}>
                      <div className="text-xs mb-1 text-slate-600 dark:text-slate-300">{row.feature.replaceAll('_',' ')}</div>
                      <div className="grid" style={{gridTemplateColumns:`repeat(${row.means.length},minmax(0,1fr))`, gap: '6px'}}>
                        {row.means.map((m,i)=> (
                          <div key={i} className="h-8 rounded" style={{background: color(m)}} title={`${binLabels(row.edges)[i]}: ${(m*100).toFixed(0)}%`} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>
      )}
      <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
        Required CSV columns: age, gender, diagnosis_code, lab_result, medication. Optional: length_of_stay, comorbidity_score, patient_id
      </div>
    </div>
  )
}

function App() {
  const [result, setResult] = useState(null)
  const [tab, setTab] = useState('single')
  const [recent, setRecent] = useState([])
  const [tourOpen, setTourOpen] = useState(false)
  const [dark, setDark] = useState(false)
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem('recent_inputs') || '[]')
      setRecent(r)
    } catch {}
    // theme
    const pref = localStorage.getItem('theme')
    const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = pref ? pref === 'dark' : sysDark
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])
  const toggleDark = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }
  return (
    <QueryClientProvider client={qc}>
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Health Prognosis Demo</h1>
          <div className="flex items-center gap-2">
            <button onClick={()=>setTourOpen(true)} className="px-3 py-2 rounded bg-gray-100 dark:bg-slate-700">Take Tour</button>
            <button onClick={toggleDark} className="px-3 py-2 rounded border border-primary text-primary hover:bg-primary hover:text-white transition" aria-label="Toggle dark mode">
              {dark ? 'Light' : 'Dark'} Mode
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">For demo purposes only; not for medical use.</p>
        <div className="flex gap-2">
          <button onClick={()=>setTab('single')} className={`px-3 py-2 rounded ${tab==='single'?'bg-primary text-white':'bg-gray-100 dark:bg-slate-700 dark:text-slate-100'}`}>Single</button>
          <button onClick={()=>setTab('batch')} className={`px-3 py-2 rounded ${tab==='batch'?'bg-primary text-white':'bg-gray-100 dark:bg-slate-700 dark:text-slate-100'}`}>Batch</button>
        </div>
        {tab==='single' ? (
          <>
            <PredictForm onResult={setResult} onSaveRecent={setRecent} />
            <Results data={result} />
            <InfoPanel />
            {!!recent.length && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-2">Recent Inputs</h2>
                <div className="flex flex-wrap gap-2">
                  {recent.map((r, i) => (
                    <button key={i} className="text-xs px-3 py-2 rounded bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 border border-transparent dark:border-slate-600" onClick={() => setResult(null) || window.dispatchEvent(new CustomEvent('load-sample', { detail: r }))}>
                      {r.age}/{r.gender} • {r.diagnosis_code} • Lab {r.lab_result}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Uses your browser storage only.</p>
              </div>
            )}
          </>
        ) : (
          <BatchUpload />
        )}
        <GuidedTour open={tourOpen} onClose={()=>setTourOpen(false)} />
      </div>
    </QueryClientProvider>
  )
}

export default App
