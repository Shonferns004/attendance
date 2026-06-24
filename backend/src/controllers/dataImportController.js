import { v4 as uuidv4 } from 'uuid';
import { insertNewDataBatch, getImportBatches, getBatchRecords, getBatchCount, getBatchById, updateNewDataStatus } from '../models/newDataModel.js';
import { upsertDonorProfile } from '../models/donorProfileModel.js';
import supabase from '../config/supabase.js';
import {
  parseImportFile,
  getSheetNames,
  dedupRows,
  normalizeDate,
} from '../services/fileParser.js';

export const inspectImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }
    const sheets = getSheetNames(req.file.buffer);
    return res.json({ sheets });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const uploadImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }
    const { date, data_source_id, sheets } = req.body;
    if (!date || !data_source_id) {
      return res.status(400).json({ message: 'Date and data source are required' });
    }

    const sheetFilter = sheets ? (Array.isArray(sheets) ? sheets : sheets.split(',').map(s => s.trim())) : undefined;
    const { rows: extracted, fullSheet } = parseImportFile(req.file.buffer, { sheets: sheetFilter });
    if (extracted.length === 0) {
      return res.status(400).json({ message: 'File is empty or has no data rows' });
    }

    if (fullSheet) {
      for (const r of extracted) {
        r.transaction_date = normalizeDate(r.transaction_date);
        r.birth_date = normalizeDate(r.birth_date);
        r.receipt_date = normalizeDate(r.receipt_date);
      }
    }

    const { deduped, duplicatesRemoved } = dedupRows(extracted);

    const { data: ngos, error: nErr } = await supabase
      .from('ngos')
      .select('id, name')
      .eq('is_active', true);
    if (nErr) throw nErr;

    const importBatchId = uuidv4();

    // Distribute donors equally among NGOs
    let ngoIndex = 0;
    const ngoNames = ngos && ngos.length > 0 ? ngos.map(n => n.name) : ['Default'];
    const dbRows = [];

    for (const r of deduped) {
      const ngo = ngoNames[ngoIndex % ngoNames.length];
      ngoIndex++;

      const row = {
        data_source_id,
        import_date: date,
        import_batch_id: importBatchId,
        mobile_number: r.mobile_number,
        name: r.name || null,
        category: r.category || '',
        amount: r.amount || 0,
        ngo,
      };
      if (fullSheet) {
        Object.assign(row, {
          transaction_date: r.transaction_date || null,
          bank_donor_name: r.bank_donor_name || null,
          agent_donor_name: r.agent_donor_name || null,
          mobile_2: r.mobile_2 || null,
          address_1: r.address_1 || null,
          address_2: r.address_2 || null,
          city: r.city || null,
          pin_code: r.pin_code || null,
          pan_number: r.pan_number || null,
          email: r.email || null,
          birth_date: r.birth_date || null,
          data_category: r.data_category || null,
          team: r.team || null,
          agent_name: r.agent_name || null,
          mop: r.mop || null,
          received_bank: r.received_bank || null,
          payment_id_no: r.payment_id_no || null,
          donors_bank_name: r.donors_bank_name || null,
          receipt_no: r.receipt_no || null,
          receipt_date: r.receipt_date || null,
          receipt_time: r.receipt_time || null,
          project_supported: r.project_supported || null,
          account_of: r.account_of || null,
          branch: r.branch || null,
          station: r.station || null,
        });
      }
      dbRows.push(row);
    }

    const inserted = await insertNewDataBatch(dbRows);

    // Build per-NGO stats
    const ngoCounts = {};
    for (const row of dbRows) {
      ngoCounts[row.ngo] = (ngoCounts[row.ngo] || 0) + 1;
    }
    const distribution = Object.entries(ngoCounts).map(([name, count]) => `${count} → ${name}`);

    return res.status(201).json({
      message: 'Data imported and distributed to NGOs successfully',
      batch_id: importBatchId,
      total_in_file: extracted.length,
      duplicates_removed: duplicatesRemoved,
      imported: inserted.length,
      distribution: distribution.join('; '),
      ngo_counts: ngoCounts,
      ngos_used: ngoNames.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const uploadOldDataImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }
    const { date, data_source_id, sheets } = req.body;
    if (!date || !data_source_id) {
      return res.status(400).json({ message: 'Date and data source are required' });
    }

    const sheetFilter = sheets ? (Array.isArray(sheets) ? sheets : sheets.split(',').map(s => s.trim())) : undefined;
    const { rows: extracted, fullSheet } = parseImportFile(req.file.buffer, { sheets: sheetFilter });
    if (extracted.length === 0) {
      return res.status(400).json({ message: 'File is empty or has no data rows' });
    }

    if (fullSheet) {
      for (const r of extracted) {
        r.transaction_date = normalizeDate(r.transaction_date);
        r.birth_date = normalizeDate(r.birth_date);
        r.receipt_date = normalizeDate(r.receipt_date);
      }
    }

    const importBatchId = uuidv4();

    const dbRows = extracted.map((r) => {
      const row = {
        data_source_id,
        import_date: date,
        import_batch_id: importBatchId,
        mobile_number: r.mobile_number,
        name: r.name || null,
        category: r.category || '',
        amount: r.amount || 0,
      };
      if (fullSheet) {
        Object.assign(row, {
          transaction_date: r.transaction_date || null,
          bank_donor_name: r.bank_donor_name || null,
          agent_donor_name: r.agent_donor_name || null,
          mobile_2: r.mobile_2 || null,
          address_1: r.address_1 || null,
          address_2: r.address_2 || null,
          city: r.city || null,
          pin_code: r.pin_code || null,
          pan_number: r.pan_number || null,
          email: r.email || null,
          birth_date: r.birth_date || null,
          data_category: r.data_category || null,
          team: r.team || null,
          agent_name: r.agent_name || null,
          mop: r.mop || null,
          received_bank: r.received_bank || null,
          payment_id_no: r.payment_id_no || null,
          donors_bank_name: r.donors_bank_name || null,
          receipt_no: r.receipt_no || null,
          receipt_date: r.receipt_date || null,
          receipt_time: r.receipt_time || null,
          project_supported: r.project_supported || null,
          account_of: r.account_of || null,
          branch: r.branch || null,
          station: r.station || null,
          ngo: r.ngo || null,
        });
      }
      return row;
    });

    const inserted = await insertNewDataBatch(dbRows);

    let profilesCreated = 0;
    const errors = [];
    const BATCH_SIZE = 10;
    for (let i = 0; i < extracted.length; i += BATCH_SIZE) {
      const batch = extracted.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(row => {
          const profile = {
            mobile_number: row.mobile_number,
            name: row.name || null,
            bank_donor_name: row.bank_donor_name || null,
            agent_donor_name: row.agent_donor_name || null,
            mobile_2: row.mobile_2 || null,
            address_1: row.address_1 || null,
            address_2: row.address_2 || null,
            city: row.city || null,
            pin_code: row.pin_code || null,
            pan_number: row.pan_number || null,
            email: row.email || null,
            birth_date: row.birth_date || null,
            data_category: row.data_category || null,
            team: row.team || null,
            agent_name: row.agent_name || null,
            mop: row.mop || null,
            donors_bank_name: row.donors_bank_name || null,
            project_supported: row.project_supported || null,
            account_of: row.account_of || null,
            raw_data: row,
            import_batch_id: importBatchId,
            category: row.category || '',
            amount: row.amount || 0,
            transaction_date: row.transaction_date || null,
            station: row.station || null,
            ngo: row.ngo || null,
          };
          return upsertDonorProfile(profile);
        })
      );
      for (const r of results) {
        if (r.status === 'fulfilled') {
          if (r.value && r.value.first_import_batch_id === importBatchId) profilesCreated++;
        } else {
          errors.push({ row: 'batch item', reason: r.reason?.message || 'Unknown error' });
        }
      }
    }

    return res.status(201).json({
      message: 'Old data imported successfully',
      type: fullSheet ? 'full' : 'quick',
      batch_id: importBatchId,
      total_in_file: extracted.length,
      valid_rows: extracted.length,
      imported: inserted.length,
      profiles_created: profilesCreated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const listImportBatches = async (req, res) => {
  try {
    const batches = await getImportBatches();
    const enriched = await Promise.all(
      batches.map(async (b) => {
        const count = await getBatchCount(b.import_batch_id);
        return { ...b, record_count: count };
      })
    );
    return res.json(enriched);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getImportBatch = async (req, res) => {
  try {
    const batch = await getBatchById(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    const records = await getBatchRecords(req.params.id);
    return res.json({ ...batch, records });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const exportBatch = async (req, res) => {
  try {
    const records = await getBatchRecords(req.params.id);
    if (records.length === 0) {
      return res.status(404).json({ message: 'No records found for this batch' });
    }

    const exportData = records.map((r) => ({
      Name: r.name || '',
      Mobile: r.mobile_number,
      Category: r.category,
      Amount: r.amount,
      'Transaction Date': r.transaction_date || '',
      'Bank Donor Name': r.bank_donor_name || '',
      'Agent Donor Name': r.agent_donor_name || '',
      'Mobile 2': r.mobile_2 || '',
      Address: r.address_1 || '',
      City: r.city || '',
      'Pin Code': r.pin_code || '',
      'PAN No': r.pan_number || '',
      Email: r.email || '',
      'Birth Date': r.birth_date || '',
      Team: r.team || '',
      'Agent Name': r.agent_name || '',
      MOP: r.mop || '',
      'Received Bank': r.received_bank || '',
      'Payment ID': r.payment_id_no || '',
      "Donor's Bank": r.donors_bank_name || '',
      'Receipt No': r.receipt_no || '',
      'Receipt Date': r.receipt_date || '',
      Project: r.project_supported || '',
      'Account Of': r.account_of || '',
      Branch: r.branch || '',
    }));

    const XLSX = (await import('xlsx')).default;
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Exported');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=import-batch-${req.params.id}.xlsx`);
    return res.send(buf);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const downloadTestSheet = async (req, res) => {
  try {
    const XLSX = (await import('xlsx')).default;
    const data = [
      { Name: 'Amit Sharma', Mobile: '9876543210', Category: 'NGO001', Amount: 15000 },
      { Name: 'Priya Verma', Mobile: '9876543211', Category: 'NGO002', Amount: 12000 },
      { Name: 'Rahul Singh', Mobile: '9876543212', Category: 'NGO001', Amount: 8000 },
      { Name: 'Sneha Patel', Mobile: '9876543213', Category: 'NGO003', Amount: 20000 },
      { Name: 'Vikram Joshi', Mobile: '9876543214', Category: 'NGO002', Amount: 5000 },
      { Name: 'Amit Sharma', Mobile: '9876543210', Category: 'NGO001', Amount: 18000 },
      { Name: 'Neha Gupta', Mobile: '9876543215', Category: 'NGO001', Amount: 7500 },
      { Name: 'Rahul Singh', Mobile: '9876543212', Category: 'NGO001', Amount: 6000 },
      { Name: 'Deepak Kumar', Mobile: '9876543216', Category: 'NGO003', Amount: 22000 },
      { Name: 'Pooja Mehta', Mobile: '9876543217', Category: 'NGO002', Amount: 3000 },
      { Name: 'Priya Verma', Mobile: '9876543211', Category: 'NGO002', Amount: 14000 },
      { Name: 'Ankit Tiwari', Mobile: '9876543218', Category: 'NGO001', Amount: 9500 },
      { Name: 'Sneha Patel', Mobile: '9876543213', Category: 'NGO003', Amount: 16000 },
      { Name: 'Ravi Desai', Mobile: '9876543219', Category: 'NGO002', Amount: 11000 },
      { Name: 'Kiran Rao', Mobile: '9876543220', Category: 'NGO001', Amount: 6500 },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Test Data');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=data-import-test.xlsx');
    return res.send(buf);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const downloadSample = async (req, res) => {
  try {
    const XLSX = (await import('xlsx')).default;
    const full = [
      {
        'Transaction Date': '01-04-2025',
        'Bank Donar Name': 'Rajesh Kumar',
        'Agent donar name': 'Amit Sharma',
        'Mobile No.': '9876543210',
        'Address-1': '123, MG Road',
        'Address-2': 'Near Market',
        City: 'Mumbai',
        'Pin Code': '400001',
        'Pan. No.': 'ABCDE1234F',
        'Mail Id': 'rajesh@email.com',
        'Birth Date': '15-08-1985',
        'Data Category': 'NGO001',
        Amount: 15000,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(full);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=data-import-sample.xlsx');
    return res.send(buf);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const distributeToNgos = async (req, res) => {
  try {
    const { data: ngos, error: nErr } = await supabase
      .from('ngos')
      .select('id, name')
      .eq('is_active', true);
    if (nErr) throw nErr;
    if (!ngos || ngos.length < 2) {
      return res.status(400).json({ message: 'Need at least 2 active NGOs to distribute' });
    }

    const { data: allRows, error: rErr } = await supabase
      .from('new_data')
      .select('name, mobile_number, category, amount')
      .is('ngo', null)
      .not('mobile_number', 'is', null)
      .order('created_at', { ascending: false });
    if (rErr) throw rErr;
    if (!allRows || allRows.length === 0) {
      return res.json({ message: 'No unassigned new data to distribute', count: 0 });
    }

    const latest = {};
    for (const row of allRows) {
      if (!latest[row.mobile_number]) {
        latest[row.mobile_number] = row;
      }
    }

    const mobiles = Object.keys(latest);

    const { data: existingProfiles, error: pErr } = await supabase
      .from('donor_profiles')
      .select('mobile_number')
      .in('mobile_number', mobiles);
    if (pErr) throw pErr;

    const existingSet = new Set(existingProfiles.map(p => p.mobile_number));
    const newMobiles = mobiles.filter(m => !existingSet.has(m));

    if (newMobiles.length === 0) {
      return res.json({ message: 'All data already has donor profiles', count: 0 });
    }

    const shuffled = [...newMobiles].sort(() => Math.random() - 0.5);
    const base = Math.floor(shuffled.length / ngos.length);
    const remainder = shuffled.length % ngos.length;

    let totalCreated = 0;
    let idx = 0;
    const results = [];

    for (let i = 0; i < ngos.length; i++) {
      const count = base + (i < remainder ? 1 : 0);
      const batchMobiles = shuffled.slice(idx, idx + count);
      idx += count;
      if (batchMobiles.length === 0) continue;

      let created = 0;
      for (const mobile of batchMobiles) {
        const row = latest[mobile];
        await upsertDonorProfile({
          mobile_number: mobile,
          name: row.name || null,
          category: row.category || '',
          amount: parseFloat(row.amount) || 0,
          total_amount: parseFloat(row.amount) || 0,
          donation_count: 1,
          ngo: ngos[i].name,
        });
        created++;
      }

      await supabase
        .from('new_data')
        .update({ ngo: ngos[i].name })
        .in('mobile_number', batchMobiles)
        .is('ngo', null);

      await updateNewDataStatus(batchMobiles, null, 'converted');

      totalCreated += created;
      results.push(`${created} donors → ${ngos[i].name}`);
    }

    return res.json({
      message: results.join('; '),
      count: totalCreated,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
