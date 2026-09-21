'use client'

import { useState, useEffect, useMemo } from 'react'

type FieldNote = {
  clinical_observations?: string
  doctor_therapy?: string
  interventions_performed?: string
  vital_signs_bp?: string
  vital_signs_hr?: string
  vital_signs_spo2?: string
  vital_signs_temp?: string
  needs_lab_tests?: boolean
  requested_lab_tests?: string
  lab_results?: string
  lab_document_url?: string
  is_lab_rejected?: boolean
  lab_rejection_reason?: string
}

type Visit = {
  scheduled_start: string
  status: string
  teams?: { name?: string } | null
  users?: { full_name?: string } | null
  [key: string]: unknown
}

export default function VisitDetailModal({
  visit,
  fieldNote,
  labNote,
  onClose
}: {
  visit: Visit
  fieldNote: FieldNote | FieldNote[] | null | undefined
  labNote?: FieldNote | FieldNote[] | null
  onClose: () => void
}) {
  const [activeReport, setActiveReport] = useState<'doctor' | 'nurse' | 'lab'>('doctor');

  // Bashkimi i të dhënave për lehtësi përdorimi
  const mergedFieldNote: FieldNote = useMemo(() => (
    Array.isArray(fieldNote)
      ? fieldNote.reduce((acc, curr) => ({ ...acc, ...curr }), {} as FieldNote)
      : (fieldNote || {})
  ), [fieldNote]);

  const mergedLabNote: FieldNote = useMemo(() => (
    Array.isArray(labNote)
      ? labNote.reduce((acc, curr) => ({ ...acc, ...curr }), {} as FieldNote)
      : (labNote || {})
  ), [labNote]);

  // Kontrollojmë sipas fushave të reja (të pastruara nga termat mjekësorë të ndaluar)
  const hasDoctorData = !!(mergedFieldNote.clinical_observations || mergedFieldNote.doctor_therapy || mergedFieldNote.needs_lab_tests);
  const hasNurseData = !!(mergedFieldNote.vital_signs_bp || mergedFieldNote.vital_signs_hr || mergedFieldNote.vital_signs_spo2 || mergedFieldNote.vital_signs_temp || mergedFieldNote.interventions_performed);
  const hasLabData = !!(mergedFieldNote.needs_lab_tests || mergedLabNote.lab_results || mergedLabNote.lab_document_url || mergedFieldNote.lab_results || mergedFieldNote.lab_document_url);

  useEffect(() => {
    // Zgjedh skedën fillestare/inteligjente sipas të dhënave të disponueshme; përdoruesi mund
    // ta ndryshojë më pas manualisht (shih onClick te skedat më poshtë), prandaj mbetet efekt
    // dhe jo vetëm gjendje fillestare e vonuar (lazy initial state).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hasDoctorData) setActiveReport('doctor');
    else if (hasNurseData) setActiveReport('nurse');
    else if (hasLabData) setActiveReport('lab');
    else setActiveReport('doctor');
  }, [hasDoctorData, hasNurseData, hasLabData]);

  // === ALGORITMI I PARSIMIT TË HISTORIKUT LABORATOTIK ===
  const parsedLabData = useMemo(() => {
    const rawLabText = mergedLabNote.lab_results || mergedFieldNote.lab_results || '';
    const rawDocUrls = mergedLabNote.lab_document_url || mergedFieldNote.lab_document_url || '';

    // Mbledhim të gjitha URL-të unike (Nga kolona e databazës dhe nga brenda tekstit)
    const allUrls = new Set<string>();
    if (rawDocUrls) {
      rawDocUrls.split(',').forEach((u: string) => allUrls.add(u.trim()));
    }

    const historyItems: { title: string, content: string }[] = [];

    if (rawLabText) {
      if (!rawLabText.includes('--- REZULTATI')) {
        // Formati i thjeshtë pa përsëritje
        historyItems.push({ title: 'Rezultati i Regjistruar', content: rawLabText });
      } else {
        // Copëtojmë tekstin aty ku gjejmë ndarësin e gjeneruar nga mobile app
        const sections = rawLabText.split(/(?=--- REZULTATI)/g).filter((s: string) => s.trim() !== '');
        
        sections.forEach((sec: string, idx: number) => {
          // Ekstraktojmë titullin (psh. "REZULTATI I PARË" ose "REZULTATI I PËRSËRITUR (Data)")
          const titleMatch = sec.match(/--- (.*?) ---/);
          const title = titleMatch ? titleMatch[1] : `Rezultati ${idx + 1}`;
          
          // Ekstraktojmë përmbajtjen duke hequr titullin
          let content = sec.replace(/--- .*? ---/, '').trim();
          
          // Gjejmë dhe nxjerrim jashtë linqet brenda tekstit
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          let match;
          while ((match = urlRegex.exec(content)) !== null) {
            allUrls.add(match[1]);
          }
          
          // Pastrojmë tekstin nga linqet dhe tekstet boshe të sistemit
          content = content.replace(/🔗 Dokumenti i Vjetër: https?:\/\/[^\s]+/g, '').trim();
          if (content === '(Ngarkuar vetëm dokumenti)' || content === 'Pa tekst nga laboranti' || content === '(Pa tekst shtesë)') {
            content = '';
          }

          historyItems.push({ title, content });
        });
      }
    }

    return {
      history: historyItems,
      documents: Array.from(allUrls)
    };
  }, [mergedLabNote, mergedFieldNote]);

  if (!visit) return null;

  const handlePrint = () => { window.print(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 print:bg-white print:p-0">
      
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:max-w-none print:max-h-none print:overflow-visible">
        
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50 print:bg-white print:border-b-2 print:border-slate-800 sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 print:text-2xl">
              ViziTrack - Regjistri Logjistik i Vizitës
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-1 print:text-slate-800">
              Data e Vizitës: {new Date(visit.scheduled_start).toLocaleString('sq-AL', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all print:hidden">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          <div className="flex gap-4 print:hidden">
            <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
              visit.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
            }`}>
              Statusi: {visit.status === 'completed' ? 'Përfunduar' : 'Planifikuar'}
            </span>
            
            <span className="px-3 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
              Stafi: {visit.users?.full_name || (visit.teams?.name ? 'Stafi i Ekipit' : 'I pacaktuar')} 
              {visit.teams?.name && <span className="text-slate-400 ml-1">• {visit.teams.name}</span>}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-4 print:hidden">
            <button 
              onClick={() => setActiveReport('doctor')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                activeReport === 'doctor' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              🩺 Raporti i Mjekut
              {!hasDoctorData && <span className="text-[10px] font-normal opacity-60 ml-1">(Bosh)</span>}
            </button>
            <button 
              onClick={() => setActiveReport('nurse')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                activeReport === 'nurse'
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              💉 Raporti i Infermierit
              {!hasNurseData && <span className="text-[10px] font-normal opacity-60 ml-1">(Bosh)</span>}
            </button>
            <button 
              onClick={() => setActiveReport('lab')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                activeReport === 'lab'
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              🔬 Raporti i Laborantit
              {!hasLabData && <span className="text-[10px] font-normal opacity-60 ml-1">(Bosh)</span>}
            </button>
            <button onClick={handlePrint} className="sm:ml-auto px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-700 transition-all shadow-md">
              📄 Shkarko PDF
            </button>
          </div>

          {/* === RAPORTI I MJEKUT (I PASTRUAR NGA TERMAT JO-KOMPLIANT) === */}
          {activeReport === 'doctor' && (
            <div className="space-y-6 print:block">
              <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 hidden print:block">Raporti Logjistik i Mjekut</h4>
              
              {mergedFieldNote.needs_lab_tests && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 print:border-slate-800 print:bg-white">
                  <span className="text-xs font-bold text-purple-700 uppercase flex items-center gap-2 print:text-slate-800">
                    🔬 Kërkesë për Asistencë Laboratorike
                  </span>
                  <p className="text-sm font-bold text-purple-900 mt-1 whitespace-pre-wrap print:text-slate-800">
                    {mergedFieldNote.requested_lab_tests || 'Janë kërkuar analiza standarde nga terreni.'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 print:border-slate-800 print:bg-white">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Vëzhgime Objektive</span>
                  <p className="text-sm font-bold text-slate-800 mt-2 whitespace-pre-wrap leading-relaxed">
                    {mergedFieldNote.clinical_observations || 'Nuk ka të dhëna'}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 print:border-slate-800 print:bg-white">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detyrat / Shërbimet e Kryera</span>
                  <p className="text-sm font-bold text-slate-800 mt-2 whitespace-pre-wrap leading-relaxed">
                    {mergedFieldNote.doctor_therapy || 'Nuk ka të dhëna'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* === RAPORTI I INFERMIERIT (I PASTRUAR) === */}
          {activeReport === 'nurse' && (
            <div className="space-y-6 print:block">
              <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 hidden print:block">Regjistri i Infermierisë</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center print:border-slate-800 print:bg-white">
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block mb-1">Tensioni</span>
                  <span className="text-xl font-black text-slate-800">{mergedFieldNote.vital_signs_bp || '-'}</span>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center print:border-slate-800 print:bg-white">
                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-1">Pulsi</span>
                  <span className="text-xl font-black text-slate-800">{mergedFieldNote.vital_signs_hr || '-'}</span>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center print:border-slate-800 print:bg-white">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-1">Oksigjeni</span>
                  <span className="text-xl font-black text-slate-800">{mergedFieldNote.vital_signs_spo2 || '-'}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center print:border-slate-800 print:bg-white">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block mb-1">Temperatura</span>
                  <span className="text-xl font-black text-slate-800">{mergedFieldNote.vital_signs_temp || '-'}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 print:border-slate-800 print:bg-white">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ndërhyrjet Logjistike (Injeksione, Fashime etj.)</span>
                <p className="text-sm font-medium text-slate-800 mt-2 whitespace-pre-wrap leading-relaxed">
                  {mergedFieldNote.interventions_performed || 'Nuk ka të dhëna'}
                </p>
              </div>
            </div>
          )}

          {/* === RAPORTI I LABORANTIT (TIMELINE INTELIGJENT) === */}
          {activeReport === 'lab' && (
            <div className="space-y-6 print:block">
              <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 hidden print:block">Regjistri Laboratorik</h4>
              
              {mergedLabNote.is_lab_rejected && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 print:border-slate-800 print:bg-white">
                  <span className="text-xs font-bold text-red-600 uppercase flex items-center gap-2 print:text-slate-800">
                    ⚠️ Analiza e Kthyer për Përsëritje nga Ekipi
                  </span>
                  <p className="text-sm font-bold text-red-900 mt-1 whitespace-pre-wrap print:text-slate-800">
                    Arsyeja: {mergedLabNote.lab_rejection_reason}
                  </p>
                </div>
              )}

              {mergedFieldNote.needs_lab_tests && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 print:border-slate-800 print:bg-white">
                  <span className="text-xs font-bold text-purple-700 uppercase flex items-center gap-2 print:text-slate-800">
                    Detyrat e Kërkuara
                  </span>
                  <p className="text-sm font-bold text-purple-900 mt-1 whitespace-pre-wrap print:text-slate-800">
                    {mergedFieldNote.requested_lab_tests || 'Vepruar sipas protokollit.'}
                  </p>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-xl p-5 print:border-slate-800 print:bg-white">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 block">Historiku i Rezultateve</span>
                
                {parsedLabData.history.length === 0 ? (
                   <p className="text-sm text-slate-400 italic">Nuk ka rezultate tekstuale të regjistruara.</p>
                ) : (
                  <div className="border-l-2 border-purple-200 pl-4 space-y-6 ml-2 mt-2">
                    {parsedLabData.history.map((item, index) => (
                      <div key={index} className="relative">
                        <div className="absolute w-3 h-3 bg-purple-500 rounded-full -left-[23px] top-1.5 ring-4 ring-white print:ring-0 print:border print:border-slate-800"></div>
                        <span className="text-xs font-bold text-purple-600 uppercase tracking-wider print:text-slate-800">{item.title}</span>
                        {item.content ? (
                          <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed print:border-none print:p-0 print:bg-white">
                            {item.content}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic mt-1">Vetëm dokument logjistik i ngarkuar</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SEKSOINI I DOKUMENTEVE TË SHKËPUTURA (PDF/FOTO) */}
              {parsedLabData.documents.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 print:hidden">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-4">
                    Dokumentet e Ngarkuara ({parsedLabData.documents.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parsedLabData.documents.map((url, idx) => (
                      <a 
                        key={idx} 
                        href={url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-100 hover:border-emerald-300 hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="bg-emerald-100 p-2 rounded-md group-hover:bg-emerald-200 transition-colors">
                            <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-bold text-slate-700 truncate">Dokumenti {parsedLabData.documents.length > 1 ? idx + 1 : ''}</p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{url.split('/').pop()}</p>
                          </div>
                        </div>
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold ml-2 shrink-0">Hap</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="hidden print:block mt-12 pt-8 border-t-2 border-slate-800">
            <div className="flex justify-between px-10">
              <div className="text-center">
                <p className="text-xs uppercase font-bold text-slate-500 mb-8">Nënshkrimi i Stafit / Raportuesit</p>
                <div className="w-48 border-b border-slate-800"></div>
                <p className="text-sm font-bold mt-2">{visit.users?.full_name}</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase font-bold text-slate-500 mb-8">Nënshkrimi i Mbikëqyrësit / Admin</p>
                <div className="w-48 border-b border-slate-800"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:hidden { display: none !important; }
          .fixed { position: absolute; top: 0; left: 0; width: 100%; }
        }
      `}} />
    </div>
  )
}