import type {Quote} from './commerce';
/** Explicit allow-list. Internal fields never reach customer document renderers or PDF metadata. */
export function customerDocument(q:Quote) {
 const advisor=q.advisor,client=q.client;
 return {number:q.number,title:q.title,date:q.date,validUntil:q.validUntil,status:q.status,discount:q.discount,notes:q.notes,exclusions:q.exclusions,conditions:q.conditions,
 advisor:{name:advisor.name,surname:advisor.surname,company:advisor.company,phone:advisor.phone,email:advisor.email,address:advisor.address,vatNumber:advisor.vatNumber,logo:advisor.logo},
 client:{name:client.name,city:client.city,details:{surname:client.details?.surname,address:client.details?.address,postalCode:client.details?.postalCode,phone:client.details?.phone,email:client.details?.email,taxCode:client.details?.taxCode,vatNumber:client.details?.vatNumber}},
 lines:q.lines.map(l=>({name:l.name,brand:l.brand,model:l.model,category:l.category,size:l.size,kind:l.kind,quantity:l.quantity,unit:l.unit,discount:l.discount,vat:q.commercial?10:l.vat,demo:l.demo}))};
}
