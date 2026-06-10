import { createNgo, getAllNgos, getNgoById, updateNgo, deleteNgo } from '../models/ngoModel.js';
import { getAllUsers } from '../models/userModel.js';

export const addNgo = async (req, res) => {
  try {
    const { name, code, address } = req.body;
    if (!name || !code) {
      return res.status(400).json({ message: 'Name and code are required' });
    }
    const ngo = await createNgo({ name, code: code.toUpperCase(), address });
    return res.status(201).json({ message: 'NGO created successfully', ngo });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const listNgos = async (req, res) => {
  try {
    const ngos = await getAllNgos();
    const enriched = await Promise.all(
      ngos.map(async (ngo) => {
        const users = await getAllUsers({ ngo_id: ngo.id });
        const userCounts = {};
        users.forEach((u) => {
          userCounts[u.role] = (userCounts[u.role] || 0) + 1;
        });
        return { ...ngo, userCounts, totalUsers: users.length };
      })
    );
    return res.json(enriched);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getNgo = async (req, res) => {
  try {
    const ngo = await getNgoById(req.params.id);
    if (!ngo) return res.status(404).json({ message: 'NGO not found' });
    const users = await getAllUsers({ ngo_id: ngo.id });
    return res.json({ ...ngo, users });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const editNgo = async (req, res) => {
  try {
    const { name, code, address, is_active } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (code) updates.code = code.toUpperCase();
    if (address !== undefined) updates.address = address;
    if (is_active !== undefined) updates.is_active = is_active;
    const ngo = await updateNgo(req.params.id, updates);
    return res.json({ message: 'NGO updated successfully', ngo });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const removeNgo = async (req, res) => {
  try {
    const result = await deleteNgo(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
