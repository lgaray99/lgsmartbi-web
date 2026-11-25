/* Motores independientes, únicamente datos ficticios: sin red ni APIs. */
(function (root) {
    "use strict";
    const sample = Object.freeze({
        bankInternal: [
            { ref: "OP-001", amount: 100000 }, { ref: "OP-002", amount: 75000 },
            { ref: "OP-003", amount: 120000 }, { ref: "OP-004", amount: 50000 },
            { ref: "OP-005", amount: 90000 }, { ref: "OP-005", amount: 90000 }
        ],
        bankStatement: [
            { ref: "OP-001", amount: 100000 }, { ref: "OP-002", amount: 70000 },
            { ref: "OP-005", amount: 90000 }, { ref: "OP-006", amount: 130000 }
        ],
        erp: [
            { ref: "FAC-101", amount: 240000 }, { ref: "FAC-102", amount: 87000 },
            { ref: "FAC-103", amount: 112000 }, { ref: "FAC-105", amount: 45000 }
        ],
        ledger: [
            { ref: "FAC-101", amount: 240000 }, { ref: "FAC-102", amount: 85000 },
            { ref: "FAC-104", amount: 112000 }, { ref: "FAC-105", amount: 45000 }
        ],
        cardSales: [
            { ref: "CUP-11", amount: 100000 }, { ref: "CUP-12", amount: 200000 },
            { ref: "CUP-13", amount: 150000 }, { ref: "CUP-14", amount: 120000 }
        ],
        cardSettlements: [
            { ref: "CUP-11", amount: 98000 }, { ref: "CUP-12", amount: 190000 },
            { ref: "CUP-14", amount: 117600 }, { ref: "CUP-15", amount: 75000 }
        ],
        sales: [
            { id: 1, month: "Ene", branch: "Centro", product: "Pan integral", units: 2, price: 50000, status: "OK" },
            { id: 2, month: "Ene", branch: "Norte", product: "Chipá", units: 3, price: 35000, status: "OK" },
            { id: 3, month: "Feb", branch: "Centro", product: "Pan integral", units: 1, price: 50000, status: "OK" },
            { id: 4, month: "Feb", branch: "Sur", product: "Budín", units: 4, price: 25000, status: "OK" },
            { id: 5, month: "Mar", branch: "Norte", product: "Chipá", units: 2, price: 35000, status: "OK" },
            { id: 6, month: "Mar", branch: "Centro", product: "Pan integral", units: 4, price: 50000, status: "OK" },
            { id: 7, month: "Mar", branch: "Sur", product: "Budín", units: 1, price: 25000, status: "ANULADO" },
            { id: 8, month: "Abr", branch: "Centro", product: "Chipá", units: 2, price: 35000, status: "OK" }
        ],
        etlRaw: [
            { id: "R1", qty: 2, price: 45000, status: "OK" },
            { id: "R2", qty: 3, price: 40000, status: "OK" },
            { id: "R2", qty: 3, price: 40000, status: "OK" },
            { id: "R3", qty: -1, price: 50000, status: "OK" },
            { id: "R4", qty: 2, price: 100000, status: "ANULADO" },
            { id: "R5", qty: 1, price: 90000, status: "OK" }
        ],
        recipe: [
            { ingredient: "Harina", perUnit: 0.23, unit: "kg" },
            { ingredient: "Queso", perUnit: 0.08, unit: "kg" },
            { ingredient: "Empaque", perUnit: 1, unit: "unidad" }
        ]
    });
    function reconcile(left, right, amountLeft = (x) => x.amount, amountRight = (x) => x.amount) {
        for (const [rows, amount] of [[left, amountLeft], [right, amountRight]]) {
            if (!Array.isArray(rows)) throw new TypeError("Se requiere una lista de movimientos");
            rows.forEach(r => {
                if (typeof r.ref !== "string" || !r.ref.trim() || !Number.isFinite(amount(r))) {
                    throw new TypeError("Referencia o importe inválido");
                }
            });
        }
        const groups = (rows) => {
            const map = new Map();
            rows.forEach((r) => {
                if (!map.has(r.ref)) map.set(r.ref, []);
                map.get(r.ref).push(r);
            });
            return map;
        };
        const L = groups(left), R = groups(right);
        const refs = [...new Set([...L.keys(), ...R.keys()])].sort();
        return refs.map((ref) => {
            const a = L.get(ref) || [], b = R.get(ref) || [];
            let status;
            if (a.length > 1 || b.length > 1) status = "Duplicado";
            else if (a.length === 0) status = "Solo en destino";
            else if (b.length === 0) status = "Solo en origen";
            else if (Math.abs(amountLeft(a[0]) - amountRight(b[0])) < 0.005) status = "Conciliado";
            else status = "Diferencia";
            const origin = a.length ? a.reduce((sum, row) => sum + amountLeft(row), 0) : null;
            const destination = b.length ? b.reduce((sum, row) => sum + amountRight(row), 0) : null;
            if ([origin, destination].some(n => n !== null && (!Number.isFinite(n) || Math.abs(n) > Number.MAX_SAFE_INTEGER))) throw new RangeError("La suma de importes está fuera de rango");
            return {
                ref,
                origin, destination,
                originCount: a.length, destinationCount: b.length, status
            };
        });
    }
    function summaries(rows) {
        const result = { total: rows.length, matched: 0, differences: 0, only: 0, duplicates: 0 };
        rows.forEach((row) => {
            if (row.status === "Conciliado") result.matched++;
            else if (row.status === "Diferencia") result.differences++;
            else if (row.status === "Duplicado") result.duplicates++;
            else result.only++;
        });
        return result;
    }
    function etl(rows) {
        if (!Array.isArray(rows) || rows.length > 20000) throw new TypeError("Se requiere un arreglo de hasta 20.000 registros");
        const ids = new Set(), accepted = [], rejected = [];
        rows.forEach((r) => {
            let reason = "";
            if (!r || typeof r.id !== "string" || !r.id.trim()) reason = "ID inválido";
            else if (r.status !== "OK") reason = "Estado excluido";
            else if (!Number.isFinite(r.qty) || !Number.isFinite(r.price) || r.qty <= 0 || r.price < 0) reason = "Cantidad o precio inválido";
            else if (!Number.isSafeInteger(r.qty * r.price)) reason = "Importe no entero o fuera de rango";
            else if (ids.has(r.id.trim())) reason = "ID duplicado";
            if (reason) rejected.push({ ...r, reason });
            else { ids.add(r.id.trim()); accepted.push({ ...r, id: r.id.trim(), amount: r.qty * r.price }); }
        });
        const totalAmount = accepted.reduce((sum, r) => sum + r.amount, 0);
        if (!Number.isSafeInteger(totalAmount)) throw new RangeError("El importe total supera el rango de enteros exactos");
        return { accepted, rejected, totalAmount };
    }
    function aggregateSales(branch, month) {
        const rows = sample.sales.filter(r => r.status === "OK" && (!branch || branch === "Todas" || r.branch === branch) && (!month || month === "Todos" || r.month === month));
        const total = rows.reduce((sum, r) => sum + r.units * r.price, 0);
        const units = rows.reduce((sum, r) => sum + r.units, 0);
        const months = ["Ene", "Feb", "Mar", "Abr"].map(month => ({
            month, amount: rows.filter(r => r.month === month).reduce((sum, r) => sum + r.units * r.price, 0)
        }));
        return { count: rows.length, total, units, months };
    }
    function recipeRequirements(units) {
        if (!Number.isInteger(units) || units < 0 || units > 100000) throw new RangeError("Unidades fuera del rango admitido");
        return sample.recipe.map(r => ({ ingredient: r.ingredient, quantity: Number((r.perUnit * units).toFixed(3)), unit: r.unit }));
    }
    function cardReconciliation(feeRate = 0.02, sales = sample.cardSales, settlements = sample.cardSettlements) {
        if (feeRate < 0 || feeRate > 0.3 || !Number.isFinite(feeRate)) throw new RangeError("Comisión fuera de rango");
        return reconcile(sales, settlements,
            (r) => Math.round(r.amount * (1 - feeRate)), r => r.amount);
    }
    /* CSV: formato RFC 4180 simplificado con soporte de comillas y saltos de línea. */
    function parseCsv(text, delimiter = ",") {
        if (![",", ";", "\t"].includes(delimiter)) throw new Error("Delimitador inválido");
        const rows = []; let row = [], field = "", quoted = false, closed = false;
        text = text.replace(/^\uFEFF/, "");
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (ch === '"') {
                if (quoted && text[i + 1] === '"') { field += '"'; i++; }
                else if (!quoted && !closed && field.length === 0) quoted = true;
                else if (quoted) { quoted = false; closed = true; }
                else throw new Error("Comillas inesperadas en CSV");
            } else if (!quoted && ch === delimiter) { row.push(field); field = ""; closed = false; }
            else if (!quoted && (ch === "\r" || ch === "\n")) {
                row.push(field); rows.push(row); row = []; field = ""; closed = false;
                if (ch === "\r" && text[i + 1] === "\n") i++;
            } else {
                if (closed) throw new Error("Carácter inesperado después de comillas de cierre");
                field += ch;
            }
        }
        if (quoted) throw new Error("Comillas sin cierre en CSV");
        if (field !== "" || row.length || closed) { row.push(field); rows.push(row); }
        return rows;
    }
    function serializeCsv(rows, delimiter = ";") {
        return rows.map(row => row.map(value => {
            const s = String(value ?? "");
            return s.includes(delimiter) || /["\n\r]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s;
        }).join(delimiter)).join("\r\n") + "\r\n";
    }
    function validateCsv(rows) {
        if (!rows.length) throw new Error("CSV vacío");
        if (rows.length > 20001) throw new Error("Máximo 20.000 registros más encabezado");
        const headers = rows[0];
        if (headers.some(h => !h.trim()) || new Set(headers).size !== headers.length) throw new Error("Encabezados vacíos o repetidos");
        if (rows.some(row => row.length !== headers.length)) throw new Error("Todas las filas deben tener la misma cantidad de campos");
        return rows;
    }
    function readMovements(text) {
        const rows = validateCsv(parseCsv(text, ";"));
        if (rows[0].join(";") !== "referencia;importe") throw new Error("Encabezado requerido: referencia;importe");
        return rows.slice(1).map((row, i) => {
            if (!row[0].trim() || !/^-?\d+$/.test(row[1]) || !Number.isSafeInteger(Number(row[1])) || Math.abs(Number(row[1])) > 1e12) {
                throw new Error(`Fila ${i + 2}: usá referencia e importe entero en PYG, sin separadores de miles`);
            }
            return { ref: row[0].trim(), amount: Number(row[1]) };
        });
    }
    const api = { sample, reconcile, summaries, etl, aggregateSales, recipeRequirements, cardReconciliation, parseCsv, serializeCsv, validateCsv, readMovements };
    root.LGPortfolioDemo = api;
    if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
