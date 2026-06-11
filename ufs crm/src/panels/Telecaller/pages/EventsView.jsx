import { useState, useEffect } from 'react';
import { getEvents } from '../../../api/events';

function TelecallerEventsView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents().then(setEvents).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-gray-900">Upcoming Events</h1>
        <p className="text-gray-500 mt-1">View scheduled events and occasions</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.filter((e) => e.is_active !== false).map((event) => (
          <div key={event.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-emerald-500">event</span>
              <h3 className="font-bold text-gray-900">{event.title}</h3>
            </div>
            <p className="text-sm text-gray-500 mb-1">
              {new Date(event.event_date).toLocaleDateString()}
              {event.event_time ? ` at ${event.event_time.slice(0, 5)}` : ''}
            </p>
            {event.location && <p className="text-sm text-gray-400">{event.location}</p>}
            {event.description && <p className="text-sm text-gray-500 mt-2">{event.description}</p>}
          </div>
        ))}
        {events.length === 0 && <div className="col-span-full p-12 text-center text-gray-400">No upcoming events</div>}
      </div>
    </div>
  );
}

export default TelecallerEventsView;
