import { useState, useEffect } from 'react';
import { getWorkers, getBirthdays } from '../api/workers';
import { getTasks } from '../api/tasks';

function Dashboard() {
  const [stats, setStats] = useState({ workers: 0, tasks: 0, pending: 0, completed: 0 });
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [workers, tasks, bdays] = await Promise.all([getWorkers(), getTasks(), getBirthdays()]);
        setStats({
          workers: workers.length,
          tasks: tasks.length,
          pending: tasks.filter((t) => t.status === 'pending').length,
          completed: tasks.filter((t) => t.status === 'completed').length,
        });
        setBirthdays(bdays);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Workers',
      value: stats.workers,
      icon: 'group',
      trend: 'Stable',
      color: true,
      empty: false,
    },
    {
      label: 'Total Tasks',
      value: stats.tasks,
      icon: 'assignment',
      trend: stats.tasks > 0 ? 'Active' : 'No active data',
      color: stats.tasks > 0,
      empty: stats.tasks === 0,
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: 'hourglass_empty',
      trend: stats.pending > 0 ? 'In queue' : 'Queue empty',
      color: stats.pending > 0,
      empty: stats.pending === 0,
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: 'check_circle',
      trend: stats.completed > 0 ? 'Done' : 'Awaiting cycles',
      color: stats.completed > 0,
      empty: stats.completed === 0,
    },
  ];

  return (
    <div>
      <div className="mb-stack-lg">
        <h2 className="text-headline-lg text-primary">Dashboard Overview</h2>
        <p className="text-body-md text-on-surface-variant">Real-time status of your workforce and operational tasks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-stack-lg">
        {cards.map((card) => (
          <div key={card.label} className="bg-white p-6 border border-outline-variant shadow-sm rounded-xl flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <span className="text-label-md text-on-surface-variant uppercase tracking-widest">{card.label}</span>
              <div className="p-2 bg-primary-container/10 rounded-lg">
                <span className="material-symbols-outlined text-primary">{card.icon}</span>
              </div>
            </div>
            <div className="text-center py-2">
              <span className={`text-[42px] font-extrabold leading-none ${card.empty ? 'text-on-surface-variant opacity-40' : 'text-primary'}`}>
                {card.value}
              </span>
            </div>
            <div className={`flex items-center gap-1 mt-4 ${card.color ? 'text-secondary' : 'text-on-surface-variant/50'}`}>
              {card.color && <span className="material-symbols-outlined text-sm">trending_up</span>}
              <span className="text-[11px] font-bold">{card.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-8 space-y-gutter">
          <div className="bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm">
            <div className="bg-surface p-6 border-b border-outline-variant flex justify-between items-center">
              <h3 className="text-headline-sm text-primary">System Overview</h3>
              <button className="px-4 py-2 bg-primary text-on-primary text-label-md rounded-lg hover:bg-primary-container transition-colors">
                Generate Report
              </button>
            </div>
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-on-surface-variant text-4xl opacity-30">analytics</span>
              </div>
              <p className="text-headline-sm text-primary mb-2">{stats.tasks === 0 ? 'No activity recorded yet' : `${stats.tasks} tasks in system`}</p>
              <p className="text-body-md text-on-surface-variant max-w-md">
                {stats.tasks === 0
                  ? 'Once you assign tasks to your workers, performance analytics and real-time activity logs will appear here.'
                  : 'Monitor worker performance, task completion rates, and system health from this dashboard.'}
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-gutter">
          <div className="bg-white p-6 border border-outline-variant rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-label-md text-primary uppercase tracking-widest">Active Workers</h4>
              {stats.workers > 0 && <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />}
            </div>
            <div className="flex items-center justify-center py-8 text-center">
              <div>
                <span className="text-[42px] font-extrabold text-primary">{stats.workers}</span>
                <p className="text-body-sm text-on-surface-variant mt-1">registered workers</p>
              </div>
            </div>
            {stats.workers > 0 && (
              <div className="pt-4 border-t border-outline-variant flex justify-between text-center">
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase">Tasks</p>
                  <p className="font-bold text-primary">{stats.tasks}</p>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase">Pending</p>
                  <p className="font-bold text-primary">{stats.pending}</p>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase">Done</p>
                  <p className="font-bold text-secondary">{stats.completed}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 border border-outline-variant rounded-xl shadow-sm">
            <h4 className="text-label-md text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">celebration</span>
              Upcoming Birthdays
            </h4>
            {birthdays.length === 0 ? (
              <div className="flex items-start gap-3 opacity-60">
                <span className="material-symbols-outlined text-primary text-lg">info</span>
                <p className="text-body-sm text-on-surface-variant italic">No upcoming birthdays in the next 30 days.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {birthdays.map((b) => (
                  <div key={b.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-white font-bold text-xs">
                      {b.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-primary truncate">{b.name}</p>
                      <p className="text-[11px] text-on-surface-variant">
                        {b.birthdayInDays === 0 ? 'Today!' : `In ${b.birthdayInDays} day${b.birthdayInDays > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
