import { useState } from 'react';
import { addWorker } from '../api/workers';

function AddWorker() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const data = await addWorker(name, email);
      setResult(data.worker);
      setName('');
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add Worker</h1>
      <div className="bg-white rounded-xl shadow-md p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Worker Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Enter worker name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Enter email address"
              required
            />
          </div>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Worker'}
          </button>
        </form>

        {result && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">Worker Added Successfully!</h3>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Name:</strong> {result.name}</p>
              <p><strong>Email:</strong> {result.email}</p>
              <p><strong>Login ID:</strong> <span className="font-mono bg-green-100 px-2 py-0.5 rounded">{result.login_id}</span></p>
              <p><strong>Password:</strong> <span className="font-mono bg-green-100 px-2 py-0.5 rounded">{result.generated_password}</span></p>
            </div>
            <p className="text-xs text-green-600 mt-2">Share these credentials with the worker.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddWorker;
