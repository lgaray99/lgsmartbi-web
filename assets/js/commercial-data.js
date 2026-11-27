/* DemoComercial S.A.: generación determinista, sin aleatoriedad ni fuentes externas. */
(function (root) {
    'use strict';
    const products = [
        {id:'P001', name:'Pan integral', category:'Panificados', unit:'unidad', price:15000, cost:9000},
        {id:'P002', name:'Chipá', category:'Panificados', unit:'unidad', price:6000, cost:3500},
        {id:'P003', name:'Budín', category:'Panificados', unit:'unidad', price:22000, cost:14000},
        {id:'P004', name:'Café molido', category:'Bebidas', unit:'paquete', price:40000, cost:24000},
        {id:'P005', name:'Jugo', category:'Bebidas', unit:'botella', price:12000, cost:7000},
        {id:'P006', name:'Combo merienda', category:'Combos', unit:'unidad', price:24000, cost:14000}
    ];
    const branches = ['Centro','Norte','Sur'].map((name,i) => ({id:`S00${i+1}`, name}));
    const customers = Array.from({length:6}, (_,i) => ({id:`C00${i+1}`, name:`Cliente demo ${i+1}`}));
    const calendar = Array.from({length:365}, (_,i) => {
        const date = new Date(Date.UTC(2026,0,i+1)).toISOString().slice(0,10);
        return {date, year:2026, month:Number(date.slice(5,7)), quarter:Math.ceil(Number(date.slice(5,7))/3)};
    });
    const raw = [];
    for (let month=1; month<=6; month++) {
        for (let ticket=1; ticket<=8; ticket++) {
            const date=`2026-${String(month).padStart(2,'0')}-${String(ticket*3).padStart(2,'0')}`;
            const orderId=`V-${String(month).padStart(2,'0')}${String(ticket).padStart(2,'0')}`;
            for (let line=1; line<=2; line++) {
                const product=products[(month+ticket+line-3)%products.length];
                raw.push({id:` ${orderId}-${line} `, orderId, date, branchId:branches[(ticket-1)%3].id,
                    customerId:customers[(month+ticket-2)%6].id, productId:product.id,
                    qty:String(1+(month+ticket+line)%5), price:String(product.price), cost:String(product.cost),
                    status:ticket===8?' anulado ':' ok ', source:ticket%2?'ERP':'TIENDA', updatedAt:`${date}T18:00:00Z`});
            }
        }
    }
    raw.push({...raw[0]}, {...raw[1],id:'ERROR-QTY',qty:'-1'},
        {...raw[2],id:'ERROR-FECHA',date:'2026-02-30'},
        {...raw[3],id:'ERROR-CLIENTE',customerId:'C999'}, {...raw[4],id:''});
    const data={company:'DemoComercial S.A.', products, branches, customers, calendar, raw};
    function freeze(value) { Object.values(value).forEach(v => {if(v && typeof v==='object')freeze(v);}); return Object.freeze(value); }
    root.LGCommercialData=freeze(data);
    if(typeof module!=='undefined'&&module.exports) module.exports=root.LGCommercialData;
})(typeof globalThis!=='undefined'?globalThis:this);
