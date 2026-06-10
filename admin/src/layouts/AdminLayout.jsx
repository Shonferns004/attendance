import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SuperAdminDashboard from '../SuperAdmin/Dashboard';
import SuperAdminNGOList from '../SuperAdmin/NGOList';
import SuperAdminNGOForm from '../SuperAdmin/NGOForm';
import SuperAdminUserList from '../SuperAdmin/UserList';
import SuperAdminAuditLog from '../SuperAdmin/AuditLog';
import HOAdminDashboard from '../HOAdmin/Dashboard';
import HOAdminUserManagement from '../HOAdmin/UserManagement';
import HRDashboard from '../HR/Dashboard';
import HRUserManagement from '../HR/UserManagement';
import HRTemplateList from '../HR/Letters/TemplateList';
import HRTemplateEditor from '../HR/Letters/TemplateEditor';
import HRGenerateLetter from '../HR/Letters/Generate';
import HRGeneratedList from '../HR/Letters/GeneratedList';
import AccountsDashboard from '../Accounts/Dashboard';
import AccountsSalary from '../Accounts/Salary';
import AccountsReports from '../Accounts/Reports';
import RecruiterDashboard from '../Recruiter/Dashboard';
import RecruiterCandidates from '../Recruiter/Candidates';
import LeadsDashboard from '../Leads/Dashboard';
import LeadsLeadList from '../Leads/LeadList';
import LeadsCallLogs from '../Leads/CallLogs';
import TelecallerDashboard from '../Telecaller/Dashboard';
import TelecallerLeads from '../Telecaller/Leads';
import TelecallerCallLogs from '../Telecaller/CallLogs';
import TeamLeadDashboard from '../TeamLead/Dashboard';
import TeamLeadTeamDashboard from '../TeamLead/TeamDashboard';
import TeamLeadLeads from '../TeamLead/Leads';
import TeamLeadCallLogs from '../TeamLead/CallLogs';
import ViewWorkers from '../pages/ViewWorkers';
import AddWorker from '../pages/AddWorker';
import Leaves from '../pages/Leaves';
import Attendance from '../pages/Attendance';
import GenerateQR from '../pages/GenerateQR';
import Settings from '../pages/Settings';

function AdminLayout({ user, onLogout }) {
  const role = user.role;

  const SidebarWrapper = () => <Sidebar role={role} user={user} onLogout={onLogout} />;

  if (role === 'super_admin') {
    return (
      <div className="min-h-screen bg-background">
        <SidebarWrapper />
        <main className="ml-[260px] min-h-screen">
          <div className="p-margin-page max-w-container-max-width mx-auto">
            <Routes>
              <Route path="/" element={<SuperAdminDashboard />} />
              <Route path="/ngos" element={<SuperAdminNGOList />} />
              <Route path="/ngos/new" element={<SuperAdminNGOForm />} />
              <Route path="/ngos/:id" element={<SuperAdminNGOForm />} />
              <Route path="/users" element={<SuperAdminUserList />} />
              <Route path="/audit" element={<SuperAdminAuditLog />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    );
  }

  if (role === 'hoadmin') {
    return (
      <div className="min-h-screen bg-background">
        <SidebarWrapper />
        <main className="ml-[260px] min-h-screen">
          <div className="p-margin-page max-w-container-max-width mx-auto">
            <Routes>
              <Route path="/" element={<HOAdminDashboard />} />
              <Route path="/users" element={<HOAdminUserManagement />} />
              <Route path="/workers" element={<ViewWorkers />} />
              <Route path="/add-worker" element={<AddWorker />} />
              <Route path="/leaves" element={<Leaves />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/qr" element={<GenerateQR />} />
              <Route path="/salary" element={<AccountsSalary />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/letters" element={<HRTemplateList />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    );
  }

  if (role === 'hr') {
    return (
      <div className="min-h-screen bg-background">
        <SidebarWrapper />
        <main className="ml-[260px] min-h-screen">
          <div className="p-margin-page max-w-container-max-width mx-auto">
            <Routes>
              <Route path="/" element={<HRDashboard />} />
              <Route path="/workers" element={<ViewWorkers />} />
              <Route path="/add-worker" element={<AddWorker />} />
              <Route path="/recruiters" element={<RecruiterDashboard />} />
              <Route path="/users" element={<HRUserManagement />} />
              <Route path="/leaves" element={<Leaves />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/letters" element={<HRTemplateList />} />
              <Route path="/letters/new" element={<HRTemplateEditor />} />
              <Route path="/letters/:id/edit" element={<HRTemplateEditor />} />
              <Route path="/letters/generate" element={<HRGenerateLetter />} />
              <Route path="/letters/generated" element={<HRGeneratedList />} />
              <Route path="/salary" element={<AccountsSalary />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    );
  }

  if (role === 'accounts') {
    return (
      <div className="min-h-screen bg-background">
        <SidebarWrapper />
        <main className="ml-[260px] min-h-screen">
          <div className="p-margin-page max-w-container-max-width mx-auto">
            <Routes>
              <Route path="/" element={<AccountsDashboard />} />
              <Route path="/salary" element={<AccountsSalary />} />
              <Route path="/reports" element={<AccountsReports />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    );
  }

  if (role === 'recruiter') {
    return (
      <div className="min-h-screen bg-background">
        <SidebarWrapper />
        <main className="ml-[260px] min-h-screen">
          <div className="p-margin-page max-w-container-max-width mx-auto">
            <Routes>
              <Route path="/" element={<RecruiterDashboard />} />
              <Route path="/candidates" element={<RecruiterCandidates />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    );
  }

  if (role === 'leads') {
    return (
      <div className="min-h-screen bg-background">
        <SidebarWrapper />
        <main className="ml-[260px] min-h-screen">
          <div className="p-margin-page max-w-container-max-width mx-auto">
            <Routes>
              <Route path="/" element={<LeadsDashboard />} />
              <Route path="/leads-list" element={<LeadsLeadList />} />
              <Route path="/call-logs" element={<LeadsCallLogs />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    );
  }

  if (role === 'telecaller') {
    return (
      <div className="min-h-screen bg-background">
        <SidebarWrapper />
        <main className="ml-[260px] min-h-screen">
          <div className="p-margin-page max-w-container-max-width mx-auto">
            <Routes>
              <Route path="/" element={<TelecallerDashboard />} />
              <Route path="/leads" element={<TelecallerLeads />} />
              <Route path="/call-logs" element={<TelecallerCallLogs />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    );
  }

  if (role === 'team_lead') {
    return (
      <div className="min-h-screen bg-background">
        <SidebarWrapper />
        <main className="ml-[260px] min-h-screen">
          <div className="p-margin-page max-w-container-max-width mx-auto">
            <Routes>
              <Route path="/" element={<TeamLeadDashboard />} />
              <Route path="/team" element={<TeamLeadTeamDashboard />} />
              <Route path="/leads" element={<TeamLeadLeads />} />
              <Route path="/call-logs" element={<TeamLeadCallLogs />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    );
  }

  return <Navigate to="/" />;
}

export default AdminLayout;
