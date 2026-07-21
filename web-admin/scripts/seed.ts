import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Mungojnë variablat e mjedisit!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedDatabase() {
  console.log('Fillohet mbushja e databazës me të dhëna sintetike...');

  // 1. Gjenerimi i Pacientëve
  const patients = [];
  for (let i = 0; i < 20; i++) {
    patients.push({
      reference_code: `PAT-${faker.string.alphanumeric(6).toUpperCase()}`,
      age_group: faker.helpers.arrayElement(['18-30', '31-50', '51-70', '70+']),
      zone_id: faker.helpers.arrayElement(['Qendra', 'Iliridë', 'Bair', 'Zhabar', 'Tavnik', 'Suhodoll']),
    });
  }

  const { data: insertedPatients, error: patientsError } = await supabase
    .from('patients')
    .insert(patients)
    .select();

  if (patientsError) {
    console.error('Gabim gjatë shtimit të pacientëve:', patientsError);
    return;
  }
  console.log(`✅ U shtuan ${insertedPatients.length} pacientë sintetikë.`);

  const FIELD_WORKER_ID = 'eaf3b619-d94c-413d-a37c-8a0d4f14b2ae'; 
  const SUPERVISOR_ID = 'a8f08adc-ba84-4507-a3a2-08ef180cb60e';

  // 2. Gjenerimi i Vizitave (Këtu shtohen logjistikat e reja)
  const visits = [];
  for (let i = 0; i < 50; i++) {
    const scheduledStart = faker.date.soon({ days: 10 });
    const scheduledEnd = new Date(scheduledStart.getTime() + 60 * 60 * 1000);

    visits.push({
      patient_id: faker.helpers.arrayElement(insertedPatients).id,
      assigned_staff_id: FIELD_WORKER_ID,
      scheduled_start: scheduledStart.toISOString(),
      scheduled_end: scheduledEnd.toISOString(),
      status: faker.helpers.arrayElement(['scheduled', 'completed', 'cancelled']),
      priority: faker.helpers.arrayElement(['emergjente', 'normale', 'normale']), // 'normale' ka më shumë gjasa
      is_patient_notified: faker.datatype.boolean(),
      care_category: faker.helpers.arrayElement(['Kujdes për të Moshuar', 'Paliativ', 'Nëna dhe Fëmijë', 'Rehabilitim Fizik']),
    });
  }

  const { data: insertedVisits, error: visitsError } = await supabase
    .from('visits')
    .insert(visits)
    .select();

  if (visitsError) {
    console.error('Gabim gjatë shtimit të vizitave:', visitsError);
    return;
  }
  console.log(`✅ U shtuan ${insertedVisits.length} vizita me prioritete dhe kategori.`);

  console.log('🎉 Seeding përfundoi me sukses!');
}

seedDatabase();