function AuditLog() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-500 mt-1">System-wide activity tracking</p>
      </div>
      <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
        <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">history</span>
        <p className="text-gray-400">Activity log coming soon — will track all create/update/delete actions across the system.</p>
      </div>
    </div>
  );
}

export default AuditLog;
