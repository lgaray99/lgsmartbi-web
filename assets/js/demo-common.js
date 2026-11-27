(function(root) {
    'use strict';
    const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const money=n=>n==null?'—':'Gs. '+Math.round(n).toLocaleString('es-PY');
    const metrics=items=>`<div class="demo-metrics">${items.map(([k,v])=>`<div class="demo-metric"><strong>${esc(v)}</strong><span>${esc(k)}</span></div>`).join('')}</div>`;
    const table=(headers,rows)=>{
        const numeric=headers.map((_,i)=>rows.some(row=>typeof row[i]==='number'));
        return `<div class="demo-table-wrap" tabindex="0" role="region" aria-label="Tabla desplazable horizontalmente"><table class="demo-table"><thead><tr>${headers.map((h,i)=>`<th scope="col"${numeric[i]?' class="demo-number"':''}>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(row=>`<tr>${row.map((c,i)=>`<td${numeric[i]?' class="demo-number"':''}>${esc(typeof c==='number'?c.toLocaleString('es-PY',{maximumFractionDigits:3}):c)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}">Sin registros para esta selección.</td></tr>`}</tbody></table></div>`;
    };
    const select=(key,label,options,value)=>`<label class="demo-field" for="${esc(key)}">${esc(label)}<select id="${esc(key)}">${options.map(x=>{const [v,t]=Array.isArray(x)?x:[x,x];return `<option value="${esc(v)}"${String(v)===String(value)?' selected':''}>${esc(t)}</option>`;}).join('')}</select></label>`;
    const input=(key,label,value,type='number',attrs='')=>`<label class="demo-field" for="${esc(key)}">${esc(label)}<input id="${esc(key)}" type="${type}" value="${esc(value)}" ${attrs}></label>`;
    const notice=text=>`<p class="demo-notice">${esc(text)}</p>`;
    function textDownload(text,filename,type='text/plain;charset=utf-8') {
        const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');
        a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
    function csv(rows,filename,safe=true) {
        if(safe)rows=rows.map(row=>row.map(v=>typeof v==='string'&&/^[\s\uFEFF]*[=+@-]/.test(v)?"'"+v:v));
        textDownload('\uFEFF'+root.LGPortfolioDemo.serializeCsv(rows,';'),filename,'text/csv;charset=utf-8');
    }
    root.LGDemoUI={esc,money,metrics,table,select,input,notice,csv,textDownload};
})(globalThis);
