import {
  getTodayAttendance,
  createAttendance,
  updateAttendance,
  getMonthlyLateMinutes,
  getAttendanceHistory,
} from '../models/attendanceModel.js';
import { getQRByCode } from '../models/qrModel.js';
import { getSetting } from '../models/settingsModel.js';

const MAX_LATE_MINUTES = 180;

async function getOfficeStart() {
  const val = await getSetting('office_start_time');
  if (val) {
    const [h, m] = val.split(':').map(Number);
    return { hour: h, minute: m };
  }
  return { hour: 10, minute: 0 };
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const punchIn = async (req, res) => {
  try {
    const { code, latitude, longitude } = req.body;
    if (!code || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'QR code, latitude, and longitude are required' });
    }

    const qr = await getQRByCode(code);
    if (!qr) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    const distance = haversineDistance(qr.latitude, qr.longitude, latitude, longitude);
    if (distance > qr.radius_meters) {
      return res.status(403).json({
        message: `Outside range (${Math.round(distance)}m / ${qr.radius_meters}m)`,
      });
    }

    const existing = await getTodayAttendance(req.user.id);
    if (existing && existing.punch_in_time) {
      return res.status(400).json({ message: 'Already punched in today' });
    }

    const officeStart = await getOfficeStart();
    const now = new Date();
    const lateMinutes = (now.getHours() > officeStart.hour || (now.getHours() === officeStart.hour && now.getMinutes() > officeStart.minute))
      ? (now.getHours() - officeStart.hour) * 60 + now.getMinutes() - officeStart.minute
      : 0;

    if (lateMinutes > 0) {
      const usedLate = await getMonthlyLateMinutes(req.user.id);
      if (usedLate + lateMinutes > MAX_LATE_MINUTES) {
        return res.status(403).json({
          message: `Late limit exceeded. Used ${usedLate}/${MAX_LATE_MINUTES} min this month.`,
        });
      }
    }

    const status = lateMinutes > 0 ? 'late' : 'present';

    if (existing) {
      const updated = await updateAttendance(existing.id, {
        punch_in_time: now.toISOString(),
        punch_in_lat: latitude,
        punch_in_lng: longitude,
        late_minutes: lateMinutes,
        status,
      });
      return res.json({ message: 'Punch in recorded', attendance: updated, lateMinutes });
    }

    const attendance = await createAttendance({
      worker_id: req.user.id,
      date: now.toISOString().split('T')[0],
      punch_in_time: now.toISOString(),
      punch_in_lat: latitude,
      punch_in_lng: longitude,
      late_minutes: lateMinutes,
      status,
    });

    return res.status(201).json({ message: 'Punch in recorded', attendance, lateMinutes });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const punchOut = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const existing = await getTodayAttendance(req.user.id);
    if (!existing || !existing.punch_in_time) {
      return res.status(400).json({ message: 'No punch in record for today' });
    }
    if (existing.punch_out_time) {
      return res.status(400).json({ message: 'Already punched out today' });
    }

    const now = new Date();
    const updated = await updateAttendance(existing.id, {
      punch_out_time: now.toISOString(),
      punch_out_lat: latitude,
      punch_out_lng: longitude,
    });

    const punchIn = new Date(existing.punch_in_time);
    const hoursWorked = ((now - punchIn) / 3600000).toFixed(1);

    return res.json({ message: 'Punch out recorded', attendance: updated, hoursWorked });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const todayStatus = async (req, res) => {
  try {
    const record = await getTodayAttendance(req.user.id);
    const lateUsed = await getMonthlyLateMinutes(req.user.id);
    return res.json({
      attendance: record || null,
      lateUsed,
      lateRemaining: MAX_LATE_MINUTES - lateUsed,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const myHistory = async (req, res) => {
  try {
    const records = await getAttendanceHistory(req.user.id);
    return res.json(records);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
