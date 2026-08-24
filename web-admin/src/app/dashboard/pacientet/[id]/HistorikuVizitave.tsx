"use client";

import { useState, useMemo } from "react";
import VisitDetailModal from "./VisitDetailModal";

export default function HistorikuVizitave({
  visits,
  fieldNotesMap,
}: {
  visits: any[];
  fieldNotesMap: Record<string, any>;
}) {
  const [selectedVisit, setSelectedVisit] = useState<any>(null);

  // === LOGJIKA ENTERPRISE: BASHKIMI I VIZITAVE DHE PËRDITËSIMI I ORËS ===
  const groupedVisits = useMemo(() => {
    const result: any[] = [];
    const processedLabIds = new Set();

    // 1. Nxjerrim të gjitha vizitat kryesore (që nuk janë vetëm për laborator)
    const mainVisits = visits.filter((v) => v.care_category !== 'Laborator');
    const labVisits = visits.filter((v) => v.care_category === 'Laborator');

    mainVisits.forEach((mainVisit) => {
      const mainDate = new Date(mainVisit.scheduled_start).toDateString();
      
      // Gjejmë vizitën e laboratorit që ka ndodhur brenda TË NJËJTËS DITË për këtë pacient
      const relatedLabVisit = labVisits.find((v) => 
        new Date(v.scheduled_start).toDateString() === mainDate &&
        !processedLabIds.has(v.id)
      );

      let displayDate = mainVisit.scheduled_start;
      let attachedLabNote = null;

      if (relatedLabVisit) {
        processedLabIds.add(relatedLabVisit.id);
        
        // Gjejmë raportin e laborantit nga fieldNotesMap bazuar në ID-në e vizitës së tij
        attachedLabNote = fieldNotesMap[relatedLabVisit.id];
        
        // BËJMË UPDATE ORËN: Nëse laboranti ka vepruar më vonë, tabela merr orën e tij!
        if (new Date(relatedLabVisit.scheduled_start).getTime() > new Date(mainVisit.scheduled_start).getTime()) {
          displayDate = relatedLabVisit.scheduled_start;
        }
      }

      result.push({
        ...mainVisit,
        display_date: displayDate, // Kjo është ora e re e përditësuar
        labNote: attachedLabNote || Object.values(fieldNotesMap).find(n => n.lab_results || n.lab_document_url) || null
      });
    });

    // 2. Shtojmë vizitat e laboratorit "Jetimë" (Nëse laboranti ka shkuar vetë në një ditë pa mjekun)
    labVisits.forEach((soloLabVisit) => {
      if (!processedLabIds.has(soloLabVisit.id)) {
        result.push({
          ...soloLabVisit,
          display_date: soloLabVisit.scheduled_start,
          labNote: fieldNotesMap[soloLabVisit.id] || null
        });
      }
    });

    // 3. I renditim nga e fundit (më e reja) tek e vjetra
    return result.sort((a, b) => new Date(b.display_date).getTime() - new Date(a.display_date).getTime());
  }, [visits, fieldNotesMap]);


  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800">Historiku i Vizitave</h3>
            <p className="text-xs text-slate-500 mt-1">
              Kliko vizitën për të hapur raportin klinik të terrenit
            </p>
          </div>
          <span className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            {groupedVisits.length} Vizita
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-white text-slate-400 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Data dhe Ora</th>
                <th className="px-6 py-4">Stafi i Terrenit</th>
                <th className="px-6 py-4">Statusi</th>
                <th className="px-6 py-4 text-right">Aksioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {groupedVisits.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-medium">
                    Nuk ka vizita të regjistruara për këtë pacient.
                  </td>
                </tr>
              ) : (
                groupedVisits.map((visit) => {
                  const hasNote = !!fieldNotesMap[visit.id] || !!visit.labNote;
                  
                  return (
                    <tr
                      key={visit.id}
                      onClick={() => setSelectedVisit(visit)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      {/* Përdorim display_date që përditësohet dinamikisht */}
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {new Date(visit.display_date).toLocaleString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                          hour: "numeric", minute: "2-digit", hour12: true,
                        })}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-700">
                          {visit.users?.full_name ? visit.users.full_name : (visit.teams?.name ? 'Stafi i Ekipit' : 'I pacaktuar')}
                        </div>
                        {visit.teams?.name && (
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            {visit.teams.name}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${
                            visit.status === "completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {visit.status === "completed" ? "Përfunduar" : "Planifikuar"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 font-semibold text-xs rounded-lg transition-all shadow-sm">
                          {hasNote ? "Shiko Raportin" : "Detajet"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedVisit && (
        <VisitDetailModal
          visit={selectedVisit}
          fieldNote={fieldNotesMap[selectedVisit.id]}
          labNote={selectedVisit.labNote} // Tani kalojmë saktësisht labNote që u gjet nga grupimi!
          onClose={() => setSelectedVisit(null)}
        />
      )}
    </>
  );
}