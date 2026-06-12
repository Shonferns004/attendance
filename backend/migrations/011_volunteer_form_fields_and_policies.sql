-- Volunteer joining form fields from the HR reference document.
ALTER TABLE workers ADD COLUMN IF NOT EXISTS father_husband_name TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS permanent_address TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS marital_status TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS pan_number TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS aadhar_number TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS previous_organizations JSONB DEFAULT '[]'::jsonb;

ALTER TABLE worker_education ADD COLUMN IF NOT EXISTS from_year TEXT;
ALTER TABLE worker_education ADD COLUMN IF NOT EXISTS to_year TEXT;
ALTER TABLE worker_education ADD COLUMN IF NOT EXISTS specialization TEXT;

DELETE FROM company_policies;

INSERT INTO company_policies (title, content, sort_order) VALUES
('Appointment and Remuneration', 'Volunteers are appointed for the role and location communicated by the Trust and must report to the assigned HOD or nominated supervisor.

At joining, volunteers are informed of the volunteer expense amount approved by the Trust. Payment is subject to Trust terms and may be revised at the sole discretion of management.', 1),
('Probation, Confirmation and Termination', 'The probation period is six months from the date of joining. Management may extend probation by another three months based on performance.

During probation, volunteer service may be terminated without notice. Confirmation is subject to satisfactory completion of probation. The Trust may terminate service without notice for misconduct or non-performance. Expense eligibility after termination is governed by Trust policy.', 2),
('Office Time, Attendance and Grace Time', 'Office hours are 10:00 AM to 7:00 PM, including break time. Attendance is recorded through the attendance system.

For half-day leave, departure time is 3:00 PM and reporting time is 2:00 PM. A volunteer reporting for a half day is not eligible for lunch time and may be marked absent if late. Late sitting does not qualify for reimbursement.

A cumulative grace period of 180 minutes per month is allowed for late entry or early exit:
1. Up to 180 minutes: no expense deduction.
2. 181 to 240 minutes: half-day expense deduction.
3. 241 to 480 minutes: one-day expense deduction.
4. More than 480 minutes: expenses are calculated from actual entry, exit and working hours.', 3),
('Leave, Half-Day and Weekly-Off Rules', 'Leave requires a minimum of three days prior approval. Half-day requests must be informed at least one day in advance. Valid proof or reason must be provided.

During probation, leave may affect increment eligibility. The normal weekly off is Sunday and may change after notice. Outdoor duty and leave forms must be approved by the HOD and submitted to accounts.

If leave is taken on Saturday, Monday, or immediately next to a public or office holiday, the related Sunday weekly off may be deducted from that month’s expenses. If a volunteer is absent for more than six days in a month, all Sunday weekly offs in that month may be deducted.', 4),
('Lunch, Dress Code and Office Conduct', 'Lunch break is 30 minutes and may be taken between 1:30 PM and 2:00 PM.

Formal dress is required on working days; casual dress is allowed on Saturday where approved. Personal mobile phones must not be used during working hours except during lunch or with permission.

All general, administrative, HR and office directions issued by the Trust must be followed. Policies may be revised from time to time.', 5),
('Office Assets and Data', 'Every volunteer must handle office assets carefully. Damage or misuse may lead to action by the Trust. Assets must be recorded in the asset register by the Team Leader or HOD.

Official mobile phones, SIM cards and laptops remain under the care of the assigned volunteer and supervisor. Only official call expenses are payable. Usage records must be maintained, and laptops must be secured when not in use.', 6),
('College Student Volunteer Policy', 'A college student volunteer who becomes irregular or discontinues volunteering because of college, examinations or personal academic reasons without proper prior information will not be eligible for volunteer expenses, reimbursements or organizational benefits.', 7),
('Exit, Separation and Abandonment', 'A resigning volunteer must complete separation clearance, settle outstanding dues, return all Trust property and provide a complete handover. Full and final settlement is processed in the next expense cycle. An experience letter is available after completing one year, subject to policy.

Volunteers on probation must serve one month’s notice. Confirmed volunteers must serve 45 days’ notice. Leaving without completing notice may make the volunteer ineligible for expenses.

Absence without information for seven days may be treated as abandonment of service. Consistent non-performance or violation of the Trust code of conduct may result in termination.', 8),
('Incentive and Legal Indemnification', 'Performance-linked, team or individual incentives are discretionary, depend on performance and HOD approval, and may change from month to month.

The volunteer confirms that no obligation to a previous employer conflicts with service to the Trust and agrees to indemnify the Trust and its management against claims arising from breach of prior employment, trade restriction or confidentiality obligations.', 9),
('Confidentiality and Non-Disclosure', 'All confidential information and proprietary data concerning the Trust, its beneficiaries, donors, volunteers, systems and operations must be protected during and after service.

Confidential information must not be copied, removed, reproduced, disclosed or used for personal or commercial benefit. Notes, documents, devices, official WhatsApp accounts, email IDs, contact numbers and all other Trust property must be returned on resignation or termination.

Violations may result in disciplinary action, termination and civil or criminal proceedings. This obligation is governed by applicable law in Maharashtra and continues after the volunteer leaves the Trust.', 10);
