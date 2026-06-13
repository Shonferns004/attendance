// Calls the Anthropic API (key handled by the platform — never pass one here).
export async function askClaude(prompt, system) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: system || 'You are an expert technical recruiter. Be concise, structured and practical.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error('AI request failed (' + res.status + ')');
  const data = await res.json();
  return (data.content || []).map(b => b.type === 'text' ? b.text : '').join('\n').trim();
}

// Very small markdown -> HTML for headings, bullets, bold.
export function mdToHtml(md) {
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const lines = md.split('\n');
  let html = '', inList = false;
  for (let raw of lines) {
    let line = esc(raw.trim());
    line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    if (/^#{1,6}\s/.test(line)) { if(inList){html+='</ul>';inList=false;} html += `<h5>${line.replace(/^#{1,6}\s/,'')}</h5>`; }
    else if (/^[-*]\s/.test(line)) { if(!inList){html+='<ul>';inList=true;} html += `<li>${line.replace(/^[-*]\s/,'')}</li>`; }
    else if (line === '') { if(inList){html+='</ul>';inList=false;} }
    else { if(inList){html+='</ul>';inList=false;} html += `<p>${line}</p>`; }
  }
  if (inList) html += '</ul>';
  return html;
}
