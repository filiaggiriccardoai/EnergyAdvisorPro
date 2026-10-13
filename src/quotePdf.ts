import {advisorName} from './workspace';
import {currency,isQuote,quoteTotals,sizeLabel,type Quote} from './commerce';

export async function quotePdf(quote:Quote) {
 if(!isQuote(quote,quote.advisorId))throw Error('Preventivo non valido.');
 const {jsPDF}=await import('jspdf');
 const doc=new jsPDF();const totals=quoteTotals(quote);let y=20;
 const plain=(text:string)=>text.replace(/[^\x20-\x7E\xA0-\xFF\n]/g, c=>({'€':'EUR','−':'-','’':"'",'·':' / '}[c]||''));
 const page=()=>{doc.addPage();y=20;};
 const ensure=(height:number)=>{if(y+height>275)page();};
 function text(value:string,size=10,bold=false) {
  doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(38,60,44);
  const lines:string[]=doc.splitTextToSize(plain(value||'Da completare'),174);
  const height=size*0.45;
  for(const line of lines){ensure(height+2);doc.text(line,18,y);y+=height;}
  y+=3;
 }
 if(quote.advisor.logo){const image=doc.getImageProperties(quote.advisor.logo);const scale=Math.min(32/image.width,20/image.height);doc.addImage(quote.advisor.logo,'PNG',18,16,image.width*scale,image.height*scale,undefined,'FAST');y=43;}
 text(quote.advisor.company||advisorName(quote.advisor),19,true);
 text([advisorName(quote.advisor),quote.advisor.address,quote.advisor.phone,quote.advisor.email,quote.advisor.vatNumber?`P. IVA ${quote.advisor.vatNumber}`:''].filter(Boolean).join('\n'));
 text(`PREVENTIVO ${quote.number} / BOZZA`,15,true);
 text(`Data: ${quote.date} | Validita fino al: ${quote.validUntil||'Da concordare'}`);
 text('DESTINATARIO',10,true);
 const client=quote.client;
 text([[client.name,client.details?.surname].filter(Boolean).join(' ')||'Cliente da completare',client.details?.address,client.details?.postalCode,client.city,client.details?.phone,client.details?.email,client.details?.taxCode?`C.F. ${client.details.taxCode}`:'',client.details?.vatNumber?`P. IVA ${client.details.vatNumber}`:''].filter(Boolean).join('\n'));
 text(quote.title,14,true);
 if(quote.lines.some(l=>l.demo))text('ATTENZIONE: prodotti e prezzi DEMO. Esempi modificabili, non listini ufficiali.',10,true);
 function tableHeader(){ensure(16);doc.setFillColor(236,243,232);doc.rect(18,y-4,174,10,'F');doc.setFontSize(8);doc.setFont('helvetica','bold');doc.text('Componente / servizio',20,y+1);doc.text('Q.ta',106,y+1);doc.text('Unit. netto',126,y+1);doc.text('Sc.% / IVA%',150,y+1);doc.text('Imponibile',190,y+1,{align:'right'});y+=13;}
 tableHeader();
 quote.lines.forEach((line,index)=>{
  doc.setFontSize(8);doc.setFont('helvetica','normal');
  const description=plain([line.name,line.brand,line.model,sizeLabel(line),line.kind].filter(Boolean).join(' / '));
  const desc:string[]=doc.splitTextToSize(description,82);
  // A long description continues on later pages without losing text.
  let first=true;
  for(let start=0;start<desc.length;){
   if(y>250){page();tableHeader();}
   const count=Math.min(desc.length-start,Math.max(1,Math.floor((263-y)/4)));
   doc.text(desc.slice(start,start+count),20,y);
   if(first){doc.text(`${line.quantity} ${plain(line.unit)}`,106,y);doc.text(plain(currency(line.sale+line.installationSale)),126,y);doc.text(`${line.discount} / ${line.vat}`,150,y);doc.text(plain(currency(totals.lines[index].net)),190,y,{align:'right'});first=false;}
   y+=count*4+5;start+=count;
  }
  doc.setDrawColor(225,232,220);doc.line(18,y-3,192,y-3);
 });
 text(`Unitari comprensivi di installazione. Imponibili dopo sconto riga e sconto offerta ${quote.discount}%. Arrotondamento a centesimi per riga.`,8);
 text(`Subtotale: ${currency(totals.gross)} | Sconti: ${currency(totals.discount)}`);
 text(`Imponibile: ${currency(totals.net)}`,12,true);
 totals.vatGroups.forEach(group=>text(`IVA ${group.rate}% su ${currency(group.net)}: ${currency(group.vat)}`));
 text(`TOTALE OFFERTA: ${currency(totals.total)}`,16,true);
 for(const [title,value] of [['NOTE',quote.notes],['ESCLUSIONI',quote.exclusions],['CONDIZIONI',quote.conditions]]){text(title,10,true);text(value||'Da concordare e completare.');}
 text('Proposta in bozza. Taglie nominali di catalogo: non costituiscono dimensionamento tecnico o verifica degli incentivi.',8);
 const pages=doc.getNumberOfPages();
 for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFontSize(8);doc.setTextColor(120);doc.text(plain(`${quote.number} / BOZZA`),18,287);doc.text(`Pagina ${i} / ${pages}`,192,287,{align:'right'});}
 return doc;
}
export async function downloadQuotePdf(quote:Quote) {const doc=await quotePdf(quote);doc.save(`preventivo-${quote.number.replace(/[^a-zA-Z0-9_-]/g,'_')}.pdf`);}
