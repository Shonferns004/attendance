import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { getWorkerByLoginId } from '../models/workerModel.js';

dotenv.config();

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { email, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ token, role: 'admin', message: 'Admin login successful' });
    }
    return res.status(401).json({ message: 'Invalid admin credentials' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const workerLogin = async (req, res) => {
  try {
    const { login_id, password } = req.body;
    const worker = await getWorkerByLoginId(login_id);
    if (!worker) {
      return res.status(401).json({ message: 'Invalid login ID' });
    }
    const isMatch = await bcrypt.compare(password, worker.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    const token = jwt.sign(
      { id: worker.id, login_id: worker.login_id, role: 'worker' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      token,
      role: 'worker',
      worker: { id: worker.id, name: worker.name, email: worker.email, login_id: worker.login_id },
      message: 'Login successful',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
