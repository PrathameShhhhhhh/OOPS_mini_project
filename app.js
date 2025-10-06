// Simple client-side banking app implementing similar logic to the Java version.
// Data is persisted in localStorage under key 'oopp_bank'.

const STORAGE_KEY = 'oopp_bank_v1';

function nowIso() { return new Date().toISOString(); }

class Transaction {
  constructor(type, amount, balance) {
    this.date = nowIso();
    this.type = type;
    this.amount = amount;
    this.balance = balance;
  }
}

class Account {
  constructor(holderName, initialDeposit) {
    this.accountNumber = Account.nextId();
    this.holderName = holderName;
    this.balance = initialDeposit;
    this.transactions = [];
    this.addTransaction('OPEN', initialDeposit);
  }

  static nextId() {
    const key = 'oopp_bank_next';
    let v = parseInt(localStorage.getItem(key) || '1000', 10);
    localStorage.setItem(key, String(v+1));
    return v;
  }

  addTransaction(type, amount) {
    this.transactions.push(new Transaction(type, amount, this.balance));
  }

  deposit(amount) {
    if (amount <= 0) throw new Error('Amount must be positive');
    this.balance += amount;
    this.addTransaction('DEPOSIT', amount);
  }

  withdraw(amount) {
    throw new Error('Abstract');
  }

  toJSON() { return {...this}; }
}

class SavingsAccount extends Account {
  constructor(holderName, initialDeposit, dailyLimit = 20000) {
    super(holderName, initialDeposit);
    this.dailyLimit = dailyLimit;
    this.withdrawnToday = 0;
    this.today = new Date().toISOString().slice(0,10);
  }

  withdraw(amount) {
    const today = new Date().toISOString().slice(0,10);
    if (today !== this.today) { this.withdrawnToday = 0; this.today = today; }
    if (amount > this.balance) throw new Error('Insufficient balance');
    if (this.withdrawnToday + amount > this.dailyLimit) throw new Error('Daily limit exceeded');
    this.balance -= amount;
    this.withdrawnToday += amount;
    this.addTransaction('WITHDRAW', amount);
  }
}

class CurrentAccount extends Account {
  constructor(holderName, initialDeposit) { super(holderName, initialDeposit); }
  withdraw(amount) {
    if (amount > this.balance) throw new Error('Insufficient balance');
    this.balance -= amount;
    this.addTransaction('WITHDRAW', amount);
  }
}

class Bank {
  constructor(name) {
    this.name = name;
    this.accounts = new Map();
    this.load();
  }

  createAccount(type, holder, deposit) {
    let acc;
    if (type === 'savings') acc = new SavingsAccount(holder, deposit);
    else acc = new CurrentAccount(holder, deposit);
    this.accounts.set(acc.accountNumber, acc);
    this.save();
    return acc;
  }

  getAccount(accno) { return this.accounts.get(Number(accno)) || null; }

  save() {
    const payload = {name:this.name, accounts: Array.from(this.accounts.values())};
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      this.name = parsed.name || this.name;
      (parsed.accounts||[]).forEach(a => {
        // revive into right class
        let acc;
        if (a.dailyLimit !== undefined) {
          acc = Object.assign(new SavingsAccount(a.holderName, a.balance, a.dailyLimit), a);
        } else {
          acc = Object.assign(new CurrentAccount(a.holderName, a.balance), a);
        }
        // ensure transactions array is intact
        acc.transactions = (a.transactions||[]);
        this.accounts.set(acc.accountNumber, acc);
      });
    } catch(e) { console.error('load failed', e); }
  }
}

// UI wiring
const bank = new Bank('OOP Bank');
let backendAvailable = false;
const BACKEND_BASE = 'http://localhost:8001';

// Try pinging backend; if available, switch to backend mode
fetch(BACKEND_BASE + '/ping', { method: 'GET' }).then(r => {
  if (r.ok) { backendAvailable = true; log('Backend available — using server'); }
}).catch(()=>{ log('No backend detected — using localStorage'); });
const output = document.getElementById('output');
const createBtn = document.getElementById('create-btn');
const createType = document.getElementById('create-type');
const createName = document.getElementById('create-name');
const createDeposit = document.getElementById('create-deposit');
const createResult = document.getElementById('create-result');

const opAccno = document.getElementById('op-accno');
const opAmt = document.getElementById('op-amt');
const depositBtn = document.getElementById('deposit-btn');
const withdrawBtn = document.getElementById('withdraw-btn');
const balanceBtn = document.getElementById('balance-btn');
const infoBtn = document.getElementById('info-btn');
const passbookBtn = document.getElementById('passbook-btn');
const fromDate = document.getElementById('from-date');
const toDate = document.getElementById('to-date');
const opResult = document.getElementById('op-result');

function log(s) { output.textContent = (s instanceof Array ? s.join('\n') : s); }

createBtn.addEventListener('click', ()=>{
  try {
    const type = createType.value;
    const name = createName.value.trim() || 'Anonymous';
    const deposit = Number(createDeposit.value) || 0;
    if (backendAvailable) {
      fetch(BACKEND_BASE + '/create', { method: 'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:`type=${encodeURIComponent(type)}&holder=${encodeURIComponent(name)}&deposit=${deposit}` })
        .then(r=>r.json()).then(j=>{ createResult.textContent = `Created ${type} account #${j.accountNumber}`; log(JSON.stringify(j)); })
        .catch(e=>{ createResult.textContent = e.message; });
    } else {
      const acc = bank.createAccount(type, name, deposit);
      createResult.textContent = `Created ${type} account #${acc.accountNumber}`;
      bank.save();
      log(`Created account ${acc.accountNumber} - ${acc.holderName} - ₹${acc.balance}`);
    }
  } catch(e) { createResult.textContent = e.message; }
});

depositBtn.addEventListener('click', ()=>{
  try {
    const accno = opAccno.value;
    const amt = Number(opAmt.value);
    if (backendAvailable) {
      fetch(`${BACKEND_BASE}/account/${accno}/deposit`, { method: 'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:`amount=${amt}` })
        .then(r=>{ if (!r.ok) return r.text().then(t=>{ throw new Error(t||'Server error'); }); return r.text(); })
        .then(()=>{ opResult.textContent = `₹${amt} deposited to ${accno}`; log(`Deposited ₹${amt}`); })
        .catch(e=>opResult.textContent = e.message);
    } else {
      const acc = bank.getAccount(accno);
      if (!acc) throw new Error('Account not found');
      acc.deposit(amt);
      bank.save();
      opResult.textContent = `₹${amt} deposited to ${acc.accountNumber}`;
      log(`Deposited ₹${amt}\nBalance: ₹${acc.balance}`);
    }
  } catch(e) { opResult.textContent = e.message; }
});

withdrawBtn.addEventListener('click', ()=>{
  try {
    const accno = opAccno.value;
    const amt = Number(opAmt.value);
    if (backendAvailable) {
      fetch(`${BACKEND_BASE}/account/${accno}/withdraw`, { method: 'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:`amount=${amt}` })
        .then(r=>{ if (!r.ok) return r.text().then(t=>{ throw new Error(t||'Server error'); }); return r.text(); })
        .then(()=>{ opResult.textContent = `₹${amt} withdrawn from ${accno}`; log(`Withdrawn ₹${amt}`); })
        .catch(e=>opResult.textContent = e.message);
    } else {
      const acc = bank.getAccount(accno);
      if (!acc) throw new Error('Account not found');
      acc.withdraw(amt);
      bank.save();
      opResult.textContent = `₹${amt} withdrawn from ${acc.accountNumber}`;
      log(`Withdrawn ₹${amt}\nBalance: ₹${acc.balance}`);
    }
  } catch(e) { opResult.textContent = e.message; }
});

balanceBtn.addEventListener('click', ()=>{
  const acc = bank.getAccount(opAccno.value);
  if (!acc) { opResult.textContent = 'Account not found'; return; }
  log(`Account: ${acc.accountNumber} | Holder: ${acc.holderName} | Balance: ₹${acc.balance}`);
});

infoBtn.addEventListener('click', ()=>{
  const acc = bank.getAccount(opAccno.value);
  if (!acc) { opResult.textContent = 'Account not found'; return; }
  const lines = [];
  lines.push(`Account: ${acc.accountNumber}`);
  lines.push(`Holder: ${acc.holderName}`);
  lines.push(`Balance: ₹${acc.balance}`);
  lines.push(`Type: ${acc.dailyLimit!==undefined? 'Savings' : 'Current'}`);
  log(lines);
});

passbookBtn.addEventListener('click', ()=>{
  const accno = opAccno.value;
  if (!accno) { opResult.textContent = 'Account number required'; return; }
  const from = fromDate.value ? fromDate.value : '';
  const to = toDate.value ? toDate.value : '';
  if (backendAvailable) {
    const q = [];
    if (from) q.push(`from=${from}`);
    if (to) q.push(`to=${to}`);
    const url = `${BACKEND_BASE}/account/${accno}/passbook` + (q.length? `?${q.join('&')}` : '');
    fetch(url).then(r=>r.json()).then(arr=>{ if (!arr.length) log(['-- no transactions --']); else log(arr.map(t=>`${t.date} | ${t.type} | ₹${t.amount} | Balance: ₹${t.balance}`)); }).catch(e=>opResult.textContent=e.message);
  } else {
    const acc = bank.getAccount(accno);
    if (!acc) { opResult.textContent = 'Account not found'; return; }
    const fromD = from ? new Date(from) : null;
    const toD = to ? new Date(to) : null;
    const rows = acc.transactions.filter(t=>{
      const td = new Date(t.date);
      if (fromD && td < fromD) return false;
      if (toD) { const toEnd = new Date(toD); toEnd.setHours(23,59,59,999); if (td > toEnd) return false; }
      return true;
    }).map(t=>`${t.date} | ${t.type} | ₹${t.amount} | Balance: ₹${t.balance}`);
    log(rows.length? rows : ['-- no transactions --']);
  }
});

// show stored accounts on load
log('Ready. Use the controls above to manage accounts.');

// Expose bank for dev console
window.bank = bank;