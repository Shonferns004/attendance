import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://sqlbimnmhdvesudpxtbi.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbGJpbW5taGR2ZXN1ZHB4dGJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk4MDg1MywiZXhwIjoyMDk2NTU2ODUzfQ.-1blwyk_qxNEfnRceBzvd1m3oTq9t-4ueHtanMsSS4U";

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_NAMES = ['BSCT', 'MANN', 'AFLF'];

async function getNgoByNameInsensitive(name) {
  const { data, error } = await supabase
    .from('ngos')
    .select('id, name')
    .ilike('name', name);
  if (error) throw error;
  return data?.[0] || null;
}

async function getNgosToRemove(targetIds) {
  const { data, error } = await supabase
    .from('ngos')
    .select('id, name');
  if (error) throw error;
  return (data || []).filter(n => !targetIds.includes(n.id));
}

async function main() {
  console.log('=== Reassign NGOs Script ===\n');

  // Step 0: Find target NGOs
  const targets = [];
  for (const name of TARGET_NAMES) {
    const ngo = await getNgoByNameInsensitive(name);
    if (ngo) {
      targets.push(ngo);
      console.log(`Found target NGO: "${ngo.name}" (id: ${ngo.id})`);
    } else {
      console.warn(`WARNING: NGO matching "${name}" not found!`);
    }
  }

  if (targets.length === 0) {
    console.error('No target NGOs found. Aborting.');
    process.exit(1);
  }

  const targetIds = targets.map(t => t.id);
  const targetNames = targets.map(t => t.name.toLowerCase());

  // Step 1: Find NGOs to remove
  const toRemove = await getNgosToRemove(targetIds);
  if (toRemove.length === 0) {
    console.log('No NGOs to remove. Nothing to do.');
    return;
  }

  console.log(`\nNGOs to remove (${toRemove.length}):`);
  for (const n of toRemove) {
    console.log(`  - "${n.name}" (id: ${n.id})`);
  }

  console.log('\nProceeding with reassignment...\n');

  let targetIdx = 0;
  function nextTarget() {
    const t = targets[targetIdx % targets.length];
    targetIdx++;
    return t;
  }

  for (const oldNgo of toRemove) {
    const target = nextTarget();
    console.log(`\n--- Processing "${oldNgo.name}" → target "${target.name}" ---`);

    // a. Update donor_profiles.ngo
    const { data: dpUpdated, error: dpErr } = await supabase
      .from('donor_profiles')
      .update({ ngo: target.name })
      .ilike('ngo', oldNgo.name)
      .select('id');
    if (dpErr) {
      console.error(`  donor_profiles error:`, dpErr.message);
    } else {
      console.log(`  donor_profiles: ${dpUpdated?.length || 0} rows updated`);
    }

    // b. Update new_data.ngo
    const { data: ndUpdated, error: ndErr } = await supabase
      .from('new_data')
      .update({ ngo: target.name })
      .ilike('ngo', oldNgo.name)
      .select('id');
    if (ndErr) {
      console.error(`  new_data error:`, ndErr.message);
    } else {
      console.log(`  new_data: ${ndUpdated?.length || 0} rows updated`);
    }

    // c. Get + update workers
    const { data: workers, error: wErr } = await supabase
      .from('workers')
      .select('id, name')
      .eq('ngo_id', oldNgo.id);
    if (wErr) { console.error(`  workers query error:`, wErr.message); continue; }

    if (workers && workers.length > 0) {
      const workerIds = workers.map(w => w.id);
      console.log(`  workers to reassign: ${workers.length} (${workers.map(w => w.name).join(', ')})`);

      const { error: uwErr } = await supabase
        .from('workers')
        .update({ ngo_id: target.id })
        .eq('ngo_id', oldNgo.id);
      if (uwErr) {
        console.error(`  workers update error:`, uwErr.message);
      } else {
        console.log(`  workers: ${workers.length} rows updated`);
      }

      // d. Update fro_assignments
      const { data: faUpdated, error: faErr } = await supabase
        .from('fro_assignments')
        .update({ ngo_id: target.id })
        .eq('ngo_id', oldNgo.id)
        .select('id');
      if (faErr) {
        console.error(`  fro_assignments error:`, faErr.message);
      } else {
        console.log(`  fro_assignments: ${faUpdated?.length || 0} rows updated`);
      }

      // e. Update fro_monthly_targets
      const { data: fmtUpdated, error: fmtErr } = await supabase
        .from('fro_monthly_targets')
        .update({ ngo_id: target.id })
        .eq('ngo_id', oldNgo.id)
        .select('id');
      if (fmtErr) {
        console.error(`  fro_monthly_targets error:`, fmtErr.message);
      } else {
        console.log(`  fro_monthly_targets: ${fmtUpdated?.length || 0} rows updated`);
      }

      // f. Handle fro_station_assignments (UNIQUE(ngo_id, station) conflict)
      const { data: oldStations, error: fsErr } = await supabase
        .from('fro_station_assignments')
        .select('id, fro_worker_id, station')
        .eq('ngo_id', oldNgo.id);
      if (fsErr) {
        console.error(`  fro_station_assignments query error:`, fsErr.message);
      } else if (oldStations && oldStations.length > 0) {
        // Get existing stations in target NGO
        const { data: targetStations } = await supabase
          .from('fro_station_assignments')
          .select('station')
          .eq('ngo_id', target.id);
        const existingStations = new Set((targetStations || []).map(s => s.station));
        let maxU = 0;
        for (const s of existingStations) {
          const m = s.match(/^U-(\d+)$/);
          if (m) maxU = Math.max(maxU, parseInt(m[1]));
        }

        for (const st of oldStations) {
          let newStation = st.station;
          if (existingStations.has(newStation)) {
            maxU++;
            newStation = `U-${maxU}`;
            console.log(`  station conflict: "${st.station}" → "${newStation}" (worker ${st.fro_worker_id})`);
          }
          const { error: upFsErr } = await supabase
            .from('fro_station_assignments')
            .update({ ngo_id: target.id, station: newStation })
            .eq('id', st.id);
          if (upFsErr) {
            console.error(`  fro_station_assignments update error for ${st.id}:`, upFsErr.message);
          }
          if (!existingStations.has(st.station)) {
            existingStations.add(newStation);
          }
        }
        console.log(`  fro_station_assignments: ${oldStations.length} rows updated`);
      }
    } else {
      console.log(`  No workers found for this NGO. Skipping worker-related updates.`);
    }

    // g. Delete worker_ngo_allocations (ON DELETE RESTRICT blocker)
    const { data: wnaDeleted, error: wnaErr } = await supabase
      .from('worker_ngo_allocations')
      .delete()
      .eq('ngo_id', oldNgo.id)
      .select('id');
    if (wnaErr) {
      console.error(`  worker_ngo_allocations delete error:`, wnaErr.message);
    } else {
      console.log(`  worker_ngo_allocations: ${wnaDeleted?.length || 0} rows deleted`);
    }
  }

  // Step 3: Delete NGOs
  console.log('\n--- Deleting NGOs ---');
  const removeIds = toRemove.map(n => n.id);
  for (const id of removeIds) {
    const ngo = toRemove.find(n => n.id === id);
    const { error: dErr } = await supabase
      .from('ngos')
      .delete()
      .eq('id', id);
    if (dErr) {
      console.error(`  Failed to delete "${ngo.name}" (${id}): ${dErr.message}`);
    } else {
      console.log(`  Deleted: "${ngo.name}"`);
    }
  }

  console.log('\n=== Done ===');
}

main().catch(console.error);
