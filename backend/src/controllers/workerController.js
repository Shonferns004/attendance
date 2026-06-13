import bcrypt from 'bcryptjs';
import {
  createWorker,
  createWorkers,
  getAllWorkers,
  getWorkerById,
  getWorkerCount,
  updateWorker,
  deleteWorker,
} from '../models/workerModel.js';

const DEFAULT_PASSWORD = '123456';

async function generateLoginId(name) {
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const surnameInitial = parts.length > 1
    ? parts[parts.length - 1].charAt(0).toLowerCase().replace(/[^a-z0-9]/g, '')
    : '';
  const base = surnameInitial ? `${firstName}${surnameInitial}` : firstName;
  const count = await getWorkerCount();
  return `${base}_ufs_${String(count + 1).padStart(2, '0')}`;
}

export const addWorker = async (req, res) => {
  try {
    const { name, email, gender, dob, ngo_id } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    const login_id = await generateLoginId(name);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);

    const worker = await createWorker({
      name,
      email,
      login_id,
      password: hashedPassword,
      gender: gender || null,
      dob: dob || null,
      ngo_id: ngo_id || req.user.ngo_id || null,
      created_by: req.user.id,
    });

    return res.status(201).json({
      message: 'Worker added successfully',
      worker: {
        id: worker.id,
        name: worker.name,
        email: worker.email,
        login_id: worker.login_id,
        gender: worker.gender,
        dob: worker.dob,
        generated_password: DEFAULT_PASSWORD,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const bulkAddWorkers = async (req, res) => {
  try {
    const { workers } = req.body;
    if (!workers || !Array.isArray(workers) || workers.length === 0) {
      return res.status(400).json({ message: 'Workers array is required' });
    }
    const count = await getWorkerCount();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);
    const prepared = workers.map((w, i) => {
      const parts = (w.name || '').trim().split(/\s+/);
      const firstName = parts[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const surnameInitial = parts.length > 1
        ? parts[parts.length - 1].charAt(0).toLowerCase().replace(/[^a-z0-9]/g, '')
        : '';
      const base = surnameInitial ? `${firstName}${surnameInitial}` : firstName;
      const login_id = `${base}_ufs_${String(count + i + 1).padStart(2, '0')}`;
      return {
        name: w.name,
        email: w.email,
        login_id,
        password: hashedPassword,
        gender: w.gender || null,
        dob: w.dob || null,
        ngo_id: w.ngo_id || req.user.ngo_id || null,
        created_by: req.user.id,
      };
    });
    const created = await createWorkers(prepared);
    return res.status(201).json({
      message: `${created.length} workers added successfully`,
      workers: created.map((w) => ({
        id: w.id,
        name: w.name,
        email: w.email,
        login_id: w.login_id,
        gender: w.gender,
        dob: w.dob,
        generated_password: DEFAULT_PASSWORD,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getWorkers = async (req, res) => {
  try {
    const ngoId = req.user.role === 'hr' ? null : (req.user.ngo_id || req.query.ngo_id);
    const workers = await getAllWorkers(ngoId);
    const safeWorkers = workers.map((w) => ({
      id: w.id,
      name: w.name,
      email: w.email,
      login_id: w.login_id,
      gender: w.gender,
      dob: w.dob,
      phone: w.phone,
      department: w.department,
      shift: w.shift,
      address: w.address,
      city: w.city,
      state: w.state,
      pincode: w.pincode,
      photo_url: w.photo_url,
      is_active: w.is_active,
      ngo_id: w.ngo_id,
      created_at: w.created_at,
    }));
    return res.json(safeWorkers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const worker = await getWorkerById(req.user.id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    return res.json({
      id: worker.id,
      name: worker.name,
      email: worker.email,
      login_id: worker.login_id,
      gender: worker.gender,
      dob: worker.dob,
      phone: worker.phone,
      department: worker.department,
      shift: worker.shift,
      address: worker.address,
      city: worker.city,
      state: worker.state,
      pincode: worker.pincode,
      photo_url: worker.photo_url,
      is_active: worker.is_active,
      ngo_id: worker.ngo_id,
      created_at: worker.created_at,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getWorker = async (req, res) => {
  try {
    const worker = await getWorkerById(req.params.id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    return res.json({
      id: worker.id,
      name: worker.name,
      email: worker.email,
      login_id: worker.login_id,
      gender: worker.gender,
      dob: worker.dob,
      phone: worker.phone,
      alternate_phone: worker.alternate_phone,
      department: worker.department,
      shift: worker.shift,
      address: worker.address,
      city: worker.city,
      state: worker.state,
      pincode: worker.pincode,
      permanent_address: worker.permanent_address,
      photo_url: worker.photo_url,
      is_active: worker.is_active,
      onboarding_completed: worker.onboarding_completed,
      ngo_id: worker.ngo_id,
      created_at: worker.created_at,
      father_husband_name: worker.father_husband_name,
      marital_status: worker.marital_status,
      pan_number: worker.pan_number,
      aadhar_number: worker.aadhar_number,
      aadhar_front_url: worker.aadhar_front_url,
      aadhar_back_url: worker.aadhar_back_url,
      pan_card_url: worker.pan_card_url,
      bank_proof_url: worker.bank_proof_url,
      light_bill_url: worker.light_bill_url,
      account_holder_name: worker.account_holder_name,
      ifsc_code: worker.ifsc_code,
      account_number: worker.account_number,
      emergency_contact_name: worker.emergency_contact_name,
      emergency_contact_relation: worker.emergency_contact_relation,
      emergency_contact_phone: worker.emergency_contact_phone,
      declaration_date: worker.declaration_date,
      declaration_place: worker.declaration_place,
      previous_organizations: worker.previous_organizations,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const editWorker = async (req, res) => {
  try {
    const {
      name, email, gender, dob, phone, alternate_phone,
      department, shift, address, city, state, pincode,
      permanent_address, father_husband_name, marital_status,
      pan_number, aadhar_number, is_active,
      emergency_contact_name, emergency_contact_relation, emergency_contact_phone,
      account_holder_name, ifsc_code, account_number,
    } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (gender !== undefined) updates.gender = gender;
    if (dob !== undefined) updates.dob = dob || null;
    if (phone !== undefined) updates.phone = phone;
    if (alternate_phone !== undefined) updates.alternate_phone = alternate_phone;
    if (department !== undefined) updates.department = department;
    if (shift !== undefined) updates.shift = shift;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (pincode !== undefined) updates.pincode = pincode;
    if (permanent_address !== undefined) updates.permanent_address = permanent_address;
    if (father_husband_name !== undefined) updates.father_husband_name = father_husband_name;
    if (marital_status !== undefined) updates.marital_status = marital_status;
    if (pan_number !== undefined) updates.pan_number = pan_number;
    if (aadhar_number !== undefined) updates.aadhar_number = aadhar_number;
    if (is_active !== undefined) updates.is_active = is_active;
    if (emergency_contact_name !== undefined) updates.emergency_contact_name = emergency_contact_name;
    if (emergency_contact_relation !== undefined) updates.emergency_contact_relation = emergency_contact_relation;
    if (emergency_contact_phone !== undefined) updates.emergency_contact_phone = emergency_contact_phone;
    if (account_holder_name !== undefined) updates.account_holder_name = account_holder_name;
    if (ifsc_code !== undefined) updates.ifsc_code = ifsc_code;
    if (account_number !== undefined) updates.account_number = account_number;
    const worker = await updateWorker(req.params.id, updates);
    return res.json({ message: 'Worker updated successfully', worker });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getBirthdays = async (req, res) => {
  try {
    const ngoId = req.user.role === 'hr' ? null : (req.user.ngo_id || req.query.ngo_id);
    const workers = await getAllWorkers(ngoId);
    const today = new Date();
    const todayMD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const upcoming = workers
      .filter((w) => w.dob)
      .map((w) => {
        const dob = new Date(w.dob);
        const md = `${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`;
        const diffDays = (new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) - today) / 86400000;
        return { ...w, _md: md, _diff: diffDays >= 0 ? diffDays : diffDays + 365 };
      })
      .filter((w) => w._diff <= 30)
      .sort((a, b) => a._diff - b._diff)
      .slice(0, 10)
      .map(({ password, _md, _diff, ...rest }) => ({
        ...rest,
        birthdayInDays: Math.round(_diff),
      }));
    return res.json(upcoming);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const removeWorker = async (req, res) => {
  try {
    const result = await deleteWorker(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
