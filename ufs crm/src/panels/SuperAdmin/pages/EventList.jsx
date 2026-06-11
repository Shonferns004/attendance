import { useState, useEffect } from 'react';
import { getEvents, deleteEvent } from '../../../api/events';
import { useNavigate } from 'react-router-dom';

function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getEvents().then(setEvents).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    try {
      await deleteEvent(id);
      setEvents(events.filter((e) => e.id !== id));
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 mt-1">Manage upcoming events and occasions</p>
        </div>
        <button onClick={() => navigate('/events/new')}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm">
          + Add Event
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-label-md text-gray-400 uppercase tracking-wider bg-gray-50">
              <th className="px-6 py-4 font-medium">Title</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Time</th>
              <th className="px-6 py-4 font-medium">Location</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{event.title}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(event.event_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-gray-500">{event.event_time ? event.event_time.slice(0, 5) : '—'}</td>
                <td className="px-6 py-4 text-gray-500">{event.location || '—'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-label-sm font-medium ${event.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {event.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/events/${event.id}/edit`)}
                      className="text-sm text-indigo-600 hover:text-indigo-800">Edit</button>
                    <button onClick={() => handleDelete(event.id)}
                      className="text-sm text-red-500 hover:text-red-700">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && <div className="p-12 text-center text-gray-400">No events yet. Create your first event!</div>}
      </div>
    </div>
  );
}

export default EventList;
