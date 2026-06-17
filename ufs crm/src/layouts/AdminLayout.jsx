import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../panels/components/Sidebar';
import SuperAdminDashboard from '../panels/SuperAdmin/pages/Dashboard';
import SuperAdminNGOList from '../panels/SuperAdmin/pages/NGOList';
import SuperAdminNGOForm from '../panels/SuperAdmin/pages/NGOForm';
import SuperAdminUserList from '../panels/SuperAdmin/pages/UserList';
import SuperAdminAuditLog from '../panels/SuperAdmin/pages/AuditLog';
import HOAdminDashboard from '../panels/HOAdmin/pages/Dashboard';
import HOAdminUserManagement from '../panels/HOAdmin/pages/UserManagement';
import HOAdminViewWorkers from '../panels/HOAdmin/pages/ViewWorkers';
import HOAdminAddWorker from '../panels/HOAdmin/pages/AddWorker';
import HOAdminLeaves from '../panels/HOAdmin/pages/Leaves';
import HOAdminAttendance from '../panels/HOAdmin/pages/Attendance';
import HOAdminGenerateQR from '../panels/HOAdmin/pages/GenerateQR';
import HOAdminSettings from '../panels/HOAdmin/pages/Settings';
import HOAdminAccountsSalary from '../panels/HOAdmin/pages/AccountsSalary';
import HOAdminHRTemplateList from '../panels/HOAdmin/pages/HRTemplateList';
import HOAdminEventList from '../panels/HOAdmin/pages/EventList';
import HOAdminEventForm from '../panels/HOAdmin/pages/EventForm';
import HOAdminNoticeList from '../panels/HOAdmin/pages/NoticeList';
import HOAdminNoticeForm from '../panels/HOAdmin/pages/NoticeForm';
import HOAdminAchievementList from '../panels/HOAdmin/pages/AchievementList';
import HOAdminAchievementForm from '../panels/HOAdmin/pages/AchievementForm';
import HRDashboard from '../panels/HR/pages/Dashboard';
import HRUserManagement from '../panels/HR/pages/UserManagement';
import HRViewWorkers from '../panels/HR/pages/ViewWorkers';
import HRAddWorker from '../panels/HR/pages/AddWorker';
import HRLeaves from '../panels/HR/pages/Leaves';
import HRAttendance from '../panels/HR/pages/Attendance';
import HRRecruiterDashboard from '../panels/HR/pages/RecruiterDashboard';
import HRAccountsSalary from '../panels/HR/pages/AccountsSalary';
import HRTemplateList from '../panels/HR/pages/Letters/TemplateList';
import HRTemplateEditor from '../panels/HR/pages/Letters/TemplateEditor';
import HRGenerateLetter from '../panels/HR/pages/Letters/Generate';
import HRGeneratedList from '../panels/HR/pages/Letters/GeneratedList';
import HREventList from '../panels/HR/pages/EventList';
import HREventForm from '../panels/HR/pages/EventForm';
import HRNoticeList from '../panels/HR/pages/NoticeList';
import GenerateQR from '../panels/HOAdmin/pages/GenerateQR';
import HRNoticeForm from '../panels/HR/pages/NoticeForm';
import HRAchievementList from '../panels/HR/pages/AchievementList';
import HRAchievementForm from '../panels/HR/pages/AchievementForm';
import HRSendNotification from '../panels/HR/pages/SendNotification';
import HRNotificationList from '../panels/HR/pages/NotificationList';
import AccountsDashboard from '../panels/Accounts/pages/Dashboard';
import AccountsSalary from '../panels/Accounts/pages/Salary';
import AccountsReports from '../panels/Accounts/pages/Reports';
import AccountsEventsView from '../panels/Accounts/pages/EventsView';
import AccountsNoticesView from '../panels/Accounts/pages/NoticesView';
import AccountsAchievementsView from '../panels/Accounts/pages/AchievementsView';
import RecruiterDashboard from '../panels/Recruiter/pages/Dashboard';
import RecruiterCandidates from '../panels/Recruiter/pages/Candidates';
import RecruiterEventsView from '../panels/Recruiter/pages/EventsView';
import RecruiterNoticesView from '../panels/Recruiter/pages/NoticesView';
import RecruiterAchievementsView from '../panels/Recruiter/pages/AchievementsView';
import LeadsDashboard from '../panels/Leads/pages/Dashboard';
import LeadsLeadList from '../panels/Leads/pages/LeadList';
import LeadsCallLogs from '../panels/Leads/pages/CallLogs';
import LeadsEventsView from '../panels/Leads/pages/EventsView';
import LeadsNoticesView from '../panels/Leads/pages/NoticesView';
import LeadsAchievementsView from '../panels/Leads/pages/AchievementsView';
import TelecallerDashboard from '../panels/Telecaller/pages/Dashboard';
import TelecallerLeads from '../panels/Telecaller/pages/Leads';
import TelecallerCallLogs from '../panels/Telecaller/pages/CallLogs';
import TelecallerEventsView from '../panels/Telecaller/pages/EventsView';
import TelecallerNoticesView from '../panels/Telecaller/pages/NoticesView';
import TelecallerAchievementsView from '../panels/Telecaller/pages/AchievementsView';
import TeamLeadDashboard from '../panels/TeamLead/pages/Dashboard';
import TeamLeadTeamDashboard from '../panels/TeamLead/pages/TeamDashboard';
import TeamLeadLeads from '../panels/TeamLead/pages/Leads';
import TeamLeadCallLogs from '../panels/TeamLead/pages/CallLogs';
import TeamLeadEventsView from '../panels/TeamLead/pages/EventsView';
import TeamLeadNoticesView from '../panels/TeamLead/pages/NoticesView';
import TeamLeadAchievementsView from '../panels/TeamLead/pages/AchievementsView';
import FROTargets from '../panels/FROTargets';
import SuperAdminEventList from '../panels/SuperAdmin/pages/EventList';
import SuperAdminEventForm from '../panels/SuperAdmin/pages/EventForm';
import SuperAdminNoticeList from '../panels/SuperAdmin/pages/NoticeList';
import SuperAdminNoticeForm from '../panels/SuperAdmin/pages/NoticeForm';
import SuperAdminAchievementList from '../panels/SuperAdmin/pages/AchievementList';
import SuperAdminAchievementForm from '../panels/SuperAdmin/pages/AchievementForm';

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
              <Route path="/events" element={<SuperAdminEventList />} />
              <Route path="/events/new" element={<SuperAdminEventForm />} />
              <Route path="/events/:id/edit" element={<SuperAdminEventForm />} />
              <Route path="/notices" element={<SuperAdminNoticeList />} />
              <Route path="/notices/new" element={<SuperAdminNoticeForm />} />
              <Route path="/notices/:id/edit" element={<SuperAdminNoticeForm />} />
              <Route path="/achievements" element={<SuperAdminAchievementList />} />
              <Route path="/achievements/new" element={<SuperAdminAchievementForm />} />
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
              <Route path="/workers" element={<HOAdminViewWorkers />} />
              <Route path="/add-worker" element={<HOAdminAddWorker />} />
              <Route path="/leaves" element={<HOAdminLeaves />} />
              <Route path="/attendance" element={<HOAdminAttendance />} />
              <Route path="/qr" element={<HOAdminGenerateQR />} />
              <Route path="/salary" element={<HOAdminAccountsSalary />} />
              <Route path="/fro-targets" element={<FROTargets />} />
              <Route path="/settings" element={<HOAdminSettings />} />
              <Route path="/letters" element={<HOAdminHRTemplateList />} />
              <Route path="/events" element={<HOAdminEventList />} />
              <Route path="/events/new" element={<HOAdminEventForm />} />
              <Route path="/events/:id/edit" element={<HOAdminEventForm />} />
              <Route path="/notices" element={<HOAdminNoticeList />} />
              <Route path="/notices/new" element={<HOAdminNoticeForm />} />
              <Route path="/notices/:id/edit" element={<HOAdminNoticeForm />} />
              <Route path="/achievements" element={<HOAdminAchievementList />} />
              <Route path="/achievements/new" element={<HOAdminAchievementForm />} />
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
              <Route path="/workers" element={<HRViewWorkers />} />
              <Route path="/add-worker" element={<HRAddWorker />} />
              <Route path="/recruiters" element={<HRRecruiterDashboard />} />
              <Route path="/users" element={<HRUserManagement />} />
              <Route path="/leaves" element={<HRLeaves />} />
              <Route path="/attendance" element={<HRAttendance />} />
              <Route path="/qr" element={<GenerateQR />} />
              <Route path="/letters" element={<HRTemplateList />} />
              <Route path="/letters/new" element={<HRTemplateEditor />} />
              <Route path="/letters/:id/edit" element={<HRTemplateEditor />} />
              <Route path="/letters/generate" element={<HRGenerateLetter />} />
              <Route path="/letters/generated" element={<HRGeneratedList />} />
              <Route path="/salary" element={<HRAccountsSalary />} />
              <Route path="/fro-targets" element={<FROTargets />} />
              <Route path="/events" element={<HREventList />} />
              <Route path="/events/new" element={<HREventForm />} />
              <Route path="/events/:id/edit" element={<HREventForm />} />
              <Route path="/notices" element={<HRNoticeList />} />
              <Route path="/notices/new" element={<HRNoticeForm />} />
              <Route path="/notices/:id/edit" element={<HRNoticeForm />} />
              <Route path="/achievements" element={<HRAchievementList />} />
              <Route path="/achievements/new" element={<HRAchievementForm />} />
              <Route path="/notifications/new" element={<HRSendNotification />} />
              <Route path="/notifications/scheduled" element={<HRNotificationList />} />
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
              <Route path="/events" element={<AccountsEventsView />} />
              <Route path="/notices" element={<AccountsNoticesView />} />
              <Route path="/achievements" element={<AccountsAchievementsView />} />
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
              <Route path="/events" element={<RecruiterEventsView />} />
              <Route path="/notices" element={<RecruiterNoticesView />} />
              <Route path="/achievements" element={<RecruiterAchievementsView />} />
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
              <Route path="/events" element={<LeadsEventsView />} />
              <Route path="/notices" element={<LeadsNoticesView />} />
              <Route path="/achievements" element={<LeadsAchievementsView />} />
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
              <Route path="/events" element={<TelecallerEventsView />} />
              <Route path="/notices" element={<TelecallerNoticesView />} />
              <Route path="/achievements" element={<TelecallerAchievementsView />} />
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
              <Route path="/events" element={<TeamLeadEventsView />} />
              <Route path="/notices" element={<TeamLeadNoticesView />} />
              <Route path="/achievements" element={<TeamLeadAchievementsView />} />
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
