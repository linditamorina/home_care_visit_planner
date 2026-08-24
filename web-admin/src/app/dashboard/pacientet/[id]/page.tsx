import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import NdryshoPacientModal from "./NdryshoPacientModal";
import HistorikuVizitave from "./HistorikuVizitave";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// export default async function DetajetEPacientit({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const resolvedParams = await params;
//   const patientId = resolvedParams.id;

//   if (!patientId || patientId === "undefined") notFound();

//   const supabase = await createClient();

//   // 1. Marrim Profilin dhe bëjmë lidhjen me tabelën zones
//   const { data: patient } = await supabase
//     .from("patients")
//     .select("*, zones(name)") // <-- NDRYSHIMI KËTU
//     .eq("id", patientId)
//     .maybeSingle();

//   if (!patient) notFound();

//   // 2. Marrim Vizitat
//   // const { data: visits } = await supabase
//   //   .from("visits")
//   //   .select(`*, users!assigned_staff_id (full_name)`)
//   //   .eq("patient_id", patient.id)
//   //   .order("scheduled_start", { ascending: false });

//   const { data: visits } = await supabase
//   .from('visits')
//   .select(`
//     *,
//     users ( full_name ),
//     teams ( name ), 
//     field_notes (*)
//   `)
//   .eq('patient_id', params.id)
//   .order('scheduled_start', { ascending: false });

//   const visitsList = visits || [];

export default async function DetajetEPacientit({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // 1. Bëjmë await params sepse është Promise në Next.js
  const resolvedParams = await params;
  const patientId = resolvedParams.id;

  const supabase = await createClient();

  // 2. Tërheqim pacientin
  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .single();

  if (!patient) notFound();

  // 3. Tërheqim vizitat duke përdorur patientId e zgjidhur
  const { data: visits } = await supabase
    .from("visits")
    .select(`
      *,
      users ( full_name ),
      teams ( name ),
      field_notes (*)
    `)
    .eq("patient_id", patientId)
    .order("scheduled_start", { ascending: false });

  const visitsList = visits || [];
  // 3. Marrim Raportet Klinike vetëm për këto vizita
  const fieldNotesMap: Record<string, any> = {};
  if (visitsList.length > 0) {
    const visitIds = visitsList.map((v: any) => v.id);
    const { data: notesData } = await supabase
      .from("field_notes")
      .select("*")
      .in("visit_id", visitIds);

    notesData?.forEach((note) => {
      fieldNotesMap[note.visit_id] = note;
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header-i */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/pacientet"
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 transition-all shadow-sm"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Link>
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              {patient.reference_code}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Profili Mjekësor i Pacientit
            </p>
          </div>
        </div>
        <NdryshoPacientModal patient={patient} />
      </div>

      {/* Kartat e Lokacionit dhe Shëndetit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">
            📍 Lokacioni
          </h3>
          {/* NDRYSHIMI KËTU: Tregojmë emrin e zonës */}
          <p className="text-slate-900 font-medium">
            {patient.zones?.name || "Zonë e panjohur"}
          </p>
          <p className="text-slate-500 text-sm mt-1">{patient.address}</p>
        </div>
        {/* <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">⚕️ Kushtet Mjekësore & Alergjitë</h3>
          <p className="text-slate-900 font-medium">{patient.medical_conditions || 'Nuk ka të dhëna'}</p>
        </div> */}
        {/* Karta e Alergjive */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-5 h-5 text-rose-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Alergjitë e Njohura
            </h3>
          </div>
          <p className="text-sm font-semibold text-slate-700">
            {patient.allergies ? (
              patient.allergies
            ) : (
              <span className="text-slate-400 font-medium italic">
                Nuk ka të dhëna
              </span>
            )}
          </p>
        </div>

        {/* Karta e Kushteve Mjekësore */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-5 h-5 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Sëmundjet e Njohura
            </h3>
          </div>
          <p className="text-sm font-semibold text-slate-700">
            {patient.medical_conditions ? (
              patient.medical_conditions
            ) : (
              <span className="text-slate-400 font-medium italic">
                Nuk ka të dhëna
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Tabela Interaktive me Modal */}
      <HistorikuVizitave visits={visitsList} fieldNotesMap={fieldNotesMap} />
    </div>
  );
}
