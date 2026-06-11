import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail, getUserById, getAllUsers, updateUser } from '../models/userModel.js';

const DEFAULT_PASSWORD = '123456';

export const addUser = async (req, res) => {
  try {
    let { ngo_id, name, email, role, department } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Name, email, and role are required' });
    }

    if (req.user.role === 'hoadmin') {
      ngo_id = req.user.ngo_id;
    }

    if (!ngo_id) ngo_id = null;

    if (role !== 'hr' && !ngo_id) {
      return res.status(400).json({ message: 'NGO is required for this role' });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(DEFAULT_PASSWORD, salt);

    const user = await createUser({
      ngo_id,
      name,
      email,
      password_hash,
      role,
      department: department || null,
      created_by: req.user.id,
    });

    const { password_hash: _, ...safeUser } = user;
    return res.status(201).json({
      message: 'User created successfully',
      user: { ...safeUser, generated_password: DEFAULT_PASSWORD },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const listUsers = async (req, res) => {
  try {
    const { ngo_id, role, is_active } = req.query;
    const filters = {};
    if (ngo_id) filters.ngo_id = ngo_id;
    if (role) filters.role = role;
    if (is_active !== undefined) filters.is_active = is_active === 'true';

    const users = await getAllUsers(filters);
    const safe = users.map(({ password_hash, ...rest }) => rest);
    return res.json(safe);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password_hash, ...safe } = user;
    return res.json(safe);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const editUser = async (req, res) => {
  try {
    const { name, email, role, department, is_active, password } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (department !== undefined) updates.department = department;
    if (is_active !== undefined) updates.is_active = is_active;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(password, salt);
    }
    const user = await updateUser(req.params.id, updates);
    const { password_hash, ...safe } = user;
    return res.json({ message: 'User updated successfully', user: safe });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
