import cron from 'node-cron';
import groq from '../config/groq.js';
import supabase from '../config/supabase.js';
import { getAllWorkers } from '../models/workerModel.js';
import { getUpcomingEvents } from '../models/eventModel.js';
import { getRecentNotices } from '../models/noticeModel.js';
import { getRecentAchievements } from '../models/achievementModel.js';
import { getAllFcmTokens } from '../models/notificationModel.js';
import { getPendingScheduledNotifications, markNotificationSent } from '../models/notificationAdminModel.js';
import { getSetting } from '../models/settingsModel.js';
import { sendPushToMultiple } from './fcmService.js';

let lastNoticeCheck = new Date(0).toISOString();
let lastAchievementCheck = new Date(0).toISOString();

function getDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function generateAiMessage(prompt) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a friendly HR assistant. Generate short, warm notification messages under 120 characters. Return ONLY the message text, no quotes, no prefixes.',
        },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 80,
      temperature: 0.7,
    });
    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Groq AI error:', error.message);
    return null;
  }
}

async function sendBirthdayNotifications(tokens, dateStr, dayOffset) {
  const isToday = dayOffset === 0;
  const isTomorrow = dayOffset === 1;
  if (!isToday && !isTomorrow) return;

  const ngoIds = [...new Set(tokens.map((t) => t.ngo_id).filter(Boolean))];
  for (const ngoId of ngoIds) {
    const workers = await getAllWorkers(ngoId);
    const birthdayWorkers = workers.filter((w) => {
      if (!w.dob) return false;
      const dob = new Date(w.dob);
      const md = `${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`;
      const targetMD = dateStr.slice(5);
      return md === targetMD;
    });

    for (const worker of birthdayWorkers) {
      const tokenData = tokens.find((t) => t.worker_id === worker.id);
      if (!tokenData) continue;

      let title, body;
      if (isTomorrow) {
        title = '🎂 Birthday Tomorrow!';
        const aiMsg = await generateAiMessage(
          `Write a warm reminder that ${worker.name}'s birthday is tomorrow. Keep it under 100 characters. Make it caring.`
        );
        body = aiMsg || `🎉 ${worker.name}'s birthday is tomorrow! Get ready to celebrate!`;
      } else {
        title = '🎂 Happy Birthday!';
        const aiMsg = await generateAiMessage(
          `Write a warm birthday wish for ${worker.name}. Keep it under 100 characters. Make it joyful.`
        );
        body = aiMsg || `🎉 Happy Birthday ${worker.name}! Wishing you a wonderful day!`;
      }

      await sendPushToMultiple([{
        workerId: worker.id, title, body, type: 'birthday', referenceId: worker.id,
      }]);
    }
  }
}

async function sendEventNotifications(tokens, dateStr, dayOffset) {
  const ngoIds = [...new Set(tokens.map((t) => t.ngo_id).filter(Boolean))];
  for (const ngoId of ngoIds) {
    const events = await getUpcomingEvents(ngoId, dateStr, dateStr);
    for (const event of events) {
      const ngoTokens = tokens.filter((t) => t.ngo_id === ngoId);
      const notifications = [];
      for (const t of ngoTokens) {
        let title, body;
        if (dayOffset === 1) {
          title = '📅 Event Tomorrow!';
          const aiMsg = await generateAiMessage(
            `Write a reminder that the event "${event.title}" is tomorrow. Keep it under 100 characters. Include the event name.`
          );
          body = aiMsg || `📅 Reminder: "${event.title}" is tomorrow${event.event_time ? ` at ${event.event_time.slice(0, 5)}` : ''}!`;
        } else {
          title = '📅 Event Today!';
          const aiMsg = await generateAiMessage(
            `Write a reminder that the event "${event.title}" is happening today. Keep it under 100 characters. Include the event name.`
          );
          body = aiMsg || `📅 "${event.title}" is today${event.event_time ? ` at ${event.event_time.slice(0, 5)}` : ''}! Don't miss it!`;
        }
        notifications.push({ workerId: t.worker_id, title, body, type: 'event', referenceId: event.id });
      }
      if (notifications.length > 0) {
        await sendPushToMultiple(notifications);
      }
    }
  }
}

async function sendNoticeNotifications(tokens) {
  const ngoIds = [...new Set(tokens.map((t) => t.ngo_id).filter(Boolean))];
  for (const ngoId of ngoIds) {
    const notices = await getRecentNotices(ngoId, lastNoticeCheck);
    for (const notice of notices) {
      const ngoTokens = tokens.filter((t) => t.ngo_id === ngoId);
      const notifications = [];
      for (const t of ngoTokens) {
        const title = '📢 New Notice';
        const aiMsg = await generateAiMessage(
          `Summarize this notice briefly: "${notice.title}: ${notice.content}". Keep it under 100 characters.`
        );
        const body = aiMsg || `📢 ${notice.title}`;
        notifications.push({ workerId: t.worker_id, title, body, type: 'notice', referenceId: notice.id });
      }
      if (notifications.length > 0) {
        await sendPushToMultiple(notifications);
      }
    }
  }
  lastNoticeCheck = new Date().toISOString();
}

async function sendAchievementNotifications(tokens) {
  const ngoIds = [...new Set(tokens.map((t) => t.ngo_id).filter(Boolean))];
  for (const ngoId of ngoIds) {
    const achievements = await getRecentAchievements(ngoId, lastAchievementCheck);
    for (const ach of achievements) {
      const workerName = ach.workers?.name || 'A worker';
      const ngoTokens = tokens.filter((t) => t.ngo_id === ngoId);
      const notifications = [];
      for (const t of ngoTokens) {
        const title = '🏆 Achievement Unlocked!';
        const aiMsg = await generateAiMessage(
          `Celebrate that ${workerName} earned "${ach.title}". Keep it under 100 characters. Make it exciting.`
        );
        const body = aiMsg || `🏆 ${workerName} earned "${ach.title}"!`;
        notifications.push({ workerId: t.worker_id, title, body, type: 'achievement', referenceId: ach.id });
      }
      if (notifications.length > 0) {
        await sendPushToMultiple(notifications);
      }
    }
  }
  lastAchievementCheck = new Date().toISOString();
}

async function runNotificationCycle() {
  try {
    const tokens = await getAllFcmTokens();
    if (!tokens || tokens.length === 0) return;

    const today = new Date();
    const todayStr = getDateString(today);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = getDateString(tomorrow);

    await sendBirthdayNotifications(tokens, tomorrowStr, 1);
    await sendBirthdayNotifications(tokens, todayStr, 0);
    await sendEventNotifications(tokens, tomorrowStr, 1);
    await sendEventNotifications(tokens, todayStr, 0);
    await sendNoticeNotifications(tokens);
    await sendAchievementNotifications(tokens);

    console.log(`Notification cycle completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Notification cycle error:', error.message);
  }
}

cron.schedule('30 10 * * *', () => runNotificationCycle());
console.log('Scheduled: 10:30 AM notification check');

cron.schedule('0 13 * * *', () => runNotificationCycle());
console.log('Scheduled: 1:00 PM notification check');

cron.schedule('0 18 * * *', () => runNotificationCycle());
console.log('Scheduled: 6:00 PM notification check');

async function sendScheduledNotifications() {
  try {
    const pending = await getPendingScheduledNotifications();
    if (!pending || pending.length === 0) return;
    const tokens = await getAllFcmTokens();
    if (!tokens || tokens.length === 0) return;
    for (const notification of pending) {
      const notifications = tokens.map((t) => ({
        workerId: t.worker_id,
        title: notification.title,
        body: notification.body,
        type: 'admin',
        referenceId: null,
      }));
      await sendPushToMultiple(notifications);
      await markNotificationSent(notification.id);
      console.log(`Scheduled notification "${notification.title}" sent at ${new Date().toISOString()}`);
    }
  } catch (error) {
    console.error('Send scheduled notifications error:', error.message);
  }
}

async function sendPunchInReminders() {
  try {
    const officeStart = await getSetting('office_start_time');
    if (!officeStart) return;
    const [startHour, startMinute] = officeStart.split(':').map(Number);
    const shiftTotalMinutes = startHour * 60 + startMinute;

    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(new Date().getTime() + istOffset);
    const currentTotalMinutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();

    const diff = shiftTotalMinutes - currentTotalMinutes;
    let window;
    if (diff >= 20 && diff < 21) window = '20';
    else if (diff >= 10 && diff < 11) window = '10';
    else return;

    const todayDateStr = getDateString(ist);
    const tokens = await getAllFcmTokens();
    if (!tokens || tokens.length === 0) return;

    for (const t of tokens) {
      const title = `⏰ ${window} min to shift!`;

      const { data: existing } = await supabase
        .from('notification_log')
        .select('id')
        .eq('worker_id', t.worker_id)
        .eq('type', 'punch_reminder')
        .eq('title', title)
        .gte('sent_at', `${todayDateStr}T00:00:00+05:30`)
        .lte('sent_at', `${todayDateStr}T23:59:59+05:30`)
        .maybeSingle();

      if (existing) continue;

      const { data: attendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('worker_id', t.worker_id)
        .eq('date', todayDateStr)
        .maybeSingle();

      if (attendance) continue;

      const workerName = t.name || t.workers?.name || 'there';
      const prompt = `Remind ${workerName} that their shift starts in ${window} minutes. Tell them to get ready and punch in on time. Keep it under 100 characters. Warm and motivating.`;
      const aiMsg = await generateAiMessage(prompt);
      const body = aiMsg || `Hey ${workerName}, your shift starts in ${window} minutes! Please punch in on time.`;

      await sendPushToMultiple([{
        workerId: t.worker_id, title, body, type: 'punch_reminder', referenceId: null,
      }]);
    }

    console.log(`Punch-in ${window}min reminders sent at ${ist.toISOString()}`);
  } catch (error) {
    console.error('Punch-in reminder error:', error.message);
  }
}

cron.schedule('* * * * *', () => sendScheduledNotifications());
console.log('Scheduled: every-minute check for admin-scheduled notifications');

cron.schedule('* * * * *', () => sendPunchInReminders());
console.log('Scheduled: every-minute check for punch-in reminders');
