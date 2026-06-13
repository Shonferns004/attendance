import groq from '../config/groq.js';

const ALL_PLACEHOLDERS = `
PERSONAL: {{name}}, {{email}}, {{phone}}, {{alternate_phone}}, {{father_husband_name}}, {{gender}}, {{dob}}, {{marital_status}}
ADDRESS: {{address}}, {{permanent_address}}, {{city}}, {{state}}, {{pincode}}
EMERGENCY CONTACT: {{emergency_contact_name}}, {{emergency_contact_relation}}, {{emergency_contact_phone}}, {{emergency_contact_name2}}, {{emergency_contact_relation2}}, {{emergency_contact_phone2}}
BANK: {{account_holder_name}}, {{ifsc_code}}, {{account_number}}
DOCUMENTS: {{aadhar_number}}, {{pan_number}}
DECLARATION: {{declaration_date}}, {{declaration_place}}
GENERAL: {{login_id}}, {{department}}, {{photo_url}}
EDUCATION TABLE (repeating block): {{#education}} ... {{degree}}, {{institution}}, {{university}}, {{year_of_passing}}, {{percentage}} ... {{/education}}
FAMILY TABLE (repeating block): {{#family}} ... {{family_name}}, {{relationship}}, {{occupation}}, {{family_phone}} ... {{/family}}
REFERENCES TABLE (repeating block): {{#references}} ... {{ref_name}}, {{designation}}, {{organization}}, {{ref_phone}} ... {{/references}}
`;

export async function suggestPlaceholders(req, res) {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }

  const prompt = `You are a form template expert. I have a worker/employee onboarding form and a list of available placeholders.

Your job: return the EXACT same form text but replace blank fields, underscores (___), dotted lines (....), or empty answer areas with the most appropriate {{placeholder}} from the list below.

AVAILABLE PLACEHOLDERS:
${ALL_PLACEHOLDERS}

RULES:
1. Only use placeholders from the list above — do not invent new ones.
2. Replace things like "Name: ___________" with "Name: {{name}}"
3. Replace things like "Date of Birth: ................" with "Date of Birth: {{dob}}"
4. For table rows that repeat (Education, Family, References), wrap the section with the correct {{#block}} ... {{/block}} tags.
5. Do NOT change any labels, headings, punctuation, or layout — only replace the blank/fill-in areas.
6. If a field has no matching placeholder, leave it as-is.
7. Return ONLY the modified form text with no explanation, no markdown, no code fences.

FORM TEXT:
${text}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4096,
    });

    const result = completion.choices[0]?.message?.content || text;
    res.json({ result });
  } catch (err) {
    console.error('Groq suggest error:', err);
    res.status(500).json({ error: 'AI suggestion failed', detail: err.message });
  }
}
