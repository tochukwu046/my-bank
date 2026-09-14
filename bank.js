bank.js

// Storage keys keep the dashboard state and selected theme between visits.



const STORAGE_KEY = 'northstar-bank-demo';
const THEME_KEY = 'northstar-bank-theme';

// Default account data used the first time the dashboard is opened.



const initialState = {
  balance: 24680.42,
  transactions: [
    { name: 'Lumen Electric', detail: 'Utilities - Today', amount: -124.80, icon: '!', tone: 'orange' },
    { name: 'Maya Thompson', detail: 'Transfer received - Yesterday', amount: 850.00, icon: 'MT', tone: 'green' },
    { name: 'Whole Foods Market', detail: 'Groceries - Aug 26', amount: -86.43, icon: '*', tone: 'pink' },
    { name: 'Northstar Payroll', detail: 'Direct deposit - Aug 25', amount: 4200.00, icon: 'NS', tone: 'blue' },
    { name: 'Frog & Co.', detail: 'Restaurant - Aug 24', amount: -64.20, icon: 'F', tone: 'orange' },
    { name: 'Aster Capital', detail: 'Investment return - Aug 22', amount: 320.50, icon: 'AC', tone: 'green' },
    { name: 'BlueStone Rental', detail: 'Rent payment - Aug 20', amount: -1450.00, icon: 'BR', tone: 'blue' },
    { name: 'Olivia Brooks', detail: 'Cash transfer - Aug 19', amount: -240.00, icon: 'OB', tone: 'pink' },
    { name: 'City Transit', detail: 'Transport pass - Aug 18', amount: -28.00, icon: 'CT', tone: 'orange' }
  ]
};

// Load saved data when available; otherwise start with the demo account.


const savedState = localStorage.getItem(STORAGE_KEY);
const state = savedState ? JSON.parse(savedState) : initialState;

// Small helpers used throughout the dashboard.


const $ = selector => document.querySelector(selector);
const money = value => `${value < 0 ? '-' : '+'}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

// Apply the selected color theme and update the theme button for accessibility.


function applyTheme(theme) {
  document.body.dataset.theme = theme;
  const toggle = $('#theme-toggle');
  if (!toggle) return;
  toggle.textContent = theme === 'dark' ? '☀' : '☾';
  toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  toggle.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  localStorage.setItem(THEME_KEY, theme);
}

const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
applyTheme(savedTheme);

// Convert stored timestamps into readable transaction dates.


function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

function transactionDestination(transaction) {
  if (!transaction.transferType) return '';
  return transaction.transferType === 'international'
    ? `${transaction.country} - ${transaction.bankAddress}`
    : `${transaction.bankName} - acct ${transaction.accountNumber}`;
}

function transactionDetail(transaction) {
  const timestamp = transaction.createdAt ? ` - ${formatTime(transaction.createdAt)}` : '';
  const destination = transactionDestination(transaction);
  return `${transaction.detail}${destination ? ` - ${destination}` : ''}${timestamp}`;
}

// Track the current modal action and any transfer waiting for confirmation.


let expandedHistory = false;
let activeAction = 'transfer';
let pendingTransfer = null;

function renderTransactions(filter = '') {


  // Filter the complete history, then limit the initial list to five entries.


  const searchText = filter.toLowerCase();
  const results = state.transactions.filter(transaction => {
    const searchableText = `${transaction.name} ${transactionDetail(transaction)}`.toLowerCase();
    return searchableText.includes(searchText);
  });
  const hasMore = results.length > 5;
  const visible = expandedHistory || results.length <= 5 ? results : results.slice(0, 5);

  const transactionList = visible.map(transaction => {
    const transactionIndex = state.transactions.indexOf(transaction);
    const amountClass = transaction.amount > 0 ? 'positive' : '';

    return `<div class="transaction" data-id="${transactionIndex}">
      <div class="tx-main">
        <div class="tx-icon ${transaction.tone}">${transaction.icon}</div>
        <div>
          <div class="tx-name">${transaction.name}</div>
          <div class="tx-date">${transactionDetail(transaction)}</div>
        </div>
      </div>
      <div class="tx-amount ${amountClass}">${money(transaction.amount)}</div>
    </div>`;
  }).join('');

  $('#transactions').innerHTML = transactionList || '<div class="empty">No matching activity found.</div>';
  document.querySelectorAll('.transaction').forEach(row => row.addEventListener('click', () => openReceipt(Number(row.dataset.id))));

  $('#all-activity').style.display = hasMore ? 'inline-block' : 'none';
  $('#all-activity').textContent = expandedHistory ? 'Show less' : 'View all';
}

function render() {
  // Refresh all dashboard values that depend on the account state.
  $('#total-balance').textContent = `$${state.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  renderTransactions($('#search').value);
}

function toast(message) {
  // Show short feedback messages without interrupting the user's workflow.
  const element = $('#toast');
  if (!element) return;
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 2800);
}
function openReceipt(index) {
  // Build a receipt from the selected transaction and open its modal.
  const transaction = state.transactions[index];
  if (!transaction) return;
  const transactionType = transaction.amount > 0 ? 'Credit' : 'Debit';
  const reference = `NS-${String(index + 1).padStart(6, '0')}-2026`;

  $('#receipt-content').innerHTML = `
    <div class="receipt-total">${money(transaction.amount)}</div>
    <div class="receipt-details">
      <div class="receipt-row"><span>Description</span><strong>${transaction.name}</strong></div>
      <div class="receipt-row"><span>Type</span><strong>${transactionType}</strong></div>
      ${transaction.transferType ? `<div class="receipt-row"><span>Transfer details</span><strong>${transactionDestination(transaction)}</strong></div>` : ''}
      <div class="receipt-row"><span>Date and time</span><strong>${transactionDetail(transaction)}</strong></div>
      <div class="receipt-row"><span>Account</span><strong>Everyday Checking - 4821</strong></div>
      <div class="receipt-row"><span>Status</span><strong class="receipt-status">Completed</strong></div>
      <div class="receipt-row"><span>Reference</span><strong>${reference}</strong></div>
    </div>`;
  $('#receipt-backdrop').classList.add('open');
}

function openModal(type = 'transfer') {

  // Configure the shared form for transfer, payment, deposit, or request actions.



  activeAction = type;
  const titles = { transfer: 'Make a transfer', pay: 'Pay a bill', request: 'Request money', deposit: 'Deposit a check' };
  $('#modal-title').textContent = titles[type];
  $('#recipient').placeholder = type === 'pay' ? 'Company name' : type === 'deposit' ? 'Check memo' : 'Name or email';
  document.querySelectorAll('.transfer-only').forEach(field => { field.style.display = type === 'transfer' ? 'grid' : 'none'; });
  if (type === 'transfer') {
    $('#transfer-type').value = 'local';
    toggleInternationalFields(false);
  } else {
    toggleInternationalFields(false);
  }
  $('#transfer-error').textContent = '';
  $('#modal-backdrop').classList.add('open');
  $('#recipient').focus();
}
function toggleInternationalFields(visible) {


  // International-only fields remain hidden until that transfer type is selected.


  document.querySelectorAll('.local-field').forEach(field => {
    field.classList.toggle('visible', !visible);
    field.querySelector('input').required = !visible;
  });
  $('#country-field').classList.toggle('visible', visible);
  $('#country').required = visible;
  document.querySelectorAll('.international-bank-field').forEach(field => {
    field.classList.toggle('visible', visible);
    field.querySelector('input').required = visible;
  });
  $('#transfer-pin').required = !visible;
}
function closeModal() {
  $('#modal-backdrop').classList.remove('open');
  $('#action-form').reset();
  $('#transfer-type').value = 'local';
  toggleInternationalFields(false);
  $('#transfer-error').textContent = '';
}
function closeReceipt() { $('#receipt-backdrop').classList.remove('open'); }
function closeConfirmation() { $('#confirm-backdrop').classList.remove('open'); pendingTransfer = null; }

// Commit a transfer only after the user confirms the review modal.


function confirmTransfer() {
  if (!pendingTransfer) return;
  const transferAmount = pendingTransfer.amount;
  state.balance -= pendingTransfer.amount;
  state.transactions.unshift({
    name: pendingTransfer.recipient,
    detail: pendingTransfer.transferType === 'international' ? 'International transfer sent' : 'Local transfer sent',
    amount: -pendingTransfer.amount,
    icon: pendingTransfer.recipient.slice(0, 2).toUpperCase(),
    tone: 'orange',
    transferType: pendingTransfer.transferType,
    country: pendingTransfer.country,
    bankName: pendingTransfer.bankName,
    accountNumber: pendingTransfer.accountNumber,
    bankAddress: pendingTransfer.bankAddress,
    iban: pendingTransfer.iban,
    swift: pendingTransfer.swift,
    createdAt: pendingTransfer.createdAt
  });
  save();
  render();
  closeModal();
  closeConfirmation();
  toast(`$${transferAmount.toFixed(2)} transfer scheduled`);
}

const dashboard = $('#total-balance');

// Dashboard event handlers are registered only on the dashboard page.


if (dashboard) {
  $('#theme-toggle').addEventListener('click', () => {
    const nextTheme = document.body.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
  });
  $('#open-transfer').addEventListener('click', () => openModal());
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.action)));
  $('#transfer-type').addEventListener('change', event => toggleInternationalFields(event.target.value === 'international'));
  $('#close-modal').addEventListener('click', closeModal);
  $('#cancel-modal').addEventListener('click', closeModal);
  $('#modal-backdrop').addEventListener('click', event => { if (event.target.id === 'modal-backdrop') closeModal(); });
  $('#close-receipt').addEventListener('click', closeReceipt);
  $('#done-receipt').addEventListener('click', closeReceipt);
  $('#receipt-backdrop').addEventListener('click', event => { if (event.target.id === 'receipt-backdrop') closeReceipt(); });
  $('#close-confirm').addEventListener('click', closeConfirmation);
  $('#cancel-confirm').addEventListener('click', closeConfirmation);
  $('#confirm-send').addEventListener('click', confirmTransfer);
  $('#confirm-backdrop').addEventListener('click', event => { if (event.target.id === 'confirm-backdrop') closeConfirmation(); });
  $('#search').addEventListener('input', event => renderTransactions(event.target.value));
  $('#all-activity').addEventListener('click', () => { expandedHistory = !expandedHistory; renderTransactions($('#search').value); });
  document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', () => { document.querySelectorAll('.nav-link').forEach(item => item.classList.remove('active')); link.classList.add('active'); if (link.dataset.view !== 'overview') toast(`${link.textContent.trim()} is ready to explore`); }));
}

const actionForm = $('#action-form');


// Handle deposits, requests, bill payments, and transfer review submission.


if (actionForm) actionForm.addEventListener('submit', event => {
  event.preventDefault();
  const recipient = $('#recipient').value.trim();
  const amount = Number($('#amount').value);
  if (!recipient || !Number.isFinite(amount) || amount < 1) return;
  if (activeAction === 'transfer') {
    const transferType = $('#transfer-type').value;
    const accountNumber = $('#account-number').value.trim();
    const bankName = $('#bank-name').value.trim();
    const pin = $('#transfer-pin').value.trim();
    const bankAddress = $('#bank-address').value.trim();
    const iban = $('#iban').value.trim();
    const swift = $('#swift').value.trim();
    let validationMessage = '';

    if (amount > state.balance) {
      validationMessage = 'Transfer amount cannot be greater than your balance.';
    } else if (transferType === 'local' && !/^\d{6,20}$/.test(accountNumber)) {
      validationMessage = 'Enter a valid local account number with 6 to 20 digits.';
    } else if (transferType === 'local' && !bankName) {
      validationMessage = 'Enter the recipient bank name.';
    } else if (transferType === 'local' && !/^\d{4}$/.test(pin)) {
      validationMessage = 'Enter a valid 4-digit transfer PIN.';
    } else if (transferType === 'international' && !bankAddress) {
      validationMessage = 'Enter the international bank address.';
    } else if (transferType === 'international' && !/^[A-Za-z0-9 ]{10,34}$/.test(iban)) {
      validationMessage = 'Enter a valid IBAN between 10 and 34 characters.';
    } else if (transferType === 'international' && !/^[A-Za-z0-9]{8}([A-Za-z0-9]{3})?$/.test(swift)) {
      validationMessage = 'Enter a valid 8 or 11 character SWIFT code.';
    } else if (transferType === 'international' && !/^\d{4}$/.test(pin)) {
      validationMessage = 'Enter a valid 4-digit transfer PIN.';
    }

    if (validationMessage) {
      $('#transfer-error').textContent = validationMessage;
      return;
    }

    pendingTransfer = {
      recipient,
      amount,
      fromAccount: $('#from-account').value,
      transferType,
      country: $('#country').value,
      accountNumber,
      bankName,
      bankAddress,
      iban,
      swift,
      createdAt: new Date().toISOString()
    };
    $('#confirm-content').innerHTML = `
      <div class="confirm-amount">-$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      <div class="confirm-summary">
        <div class="confirm-row"><span>From</span><strong>${pendingTransfer.fromAccount}</strong></div>
        <div class="confirm-row"><span>Transfer type</span><strong>${transferType === 'international' ? 'International' : 'Local'}</strong></div>
        <div class="confirm-row"><span>Recipient</span><strong>${recipient}</strong></div>
        <div class="confirm-row"><span>Bank</span><strong>${transferType === 'international' ? bankAddress : bankName}</strong></div>
        <div class="confirm-row"><span>Account details</span><strong>${transferType === 'international' ? iban : accountNumber}</strong></div>
        <div class="confirm-row"><span>Transfer time</span><strong>${formatTime(pendingTransfer.createdAt)}</strong></div>
      </div>`;
    $('#confirm-backdrop').classList.add('open');
    return;
  }
  const deposit = activeAction === 'deposit';
  const request = activeAction === 'request';
  const signedAmount = deposit || request ? amount : -amount;
  state.balance += signedAmount;
  state.transactions.unshift({
    name: deposit ? 'Mobile check deposit' : recipient,
    detail: deposit ? 'Deposit received' : request ? 'Request created' : 'Bill payment sent',
    amount: signedAmount,
    icon: deposit ? '+' : recipient.slice(0, 2).toUpperCase(),
    tone: deposit || request ? 'green' : 'orange',
    createdAt: new Date().toISOString()
  });
  save();
  render();
  closeModal();
  toast('Action completed successfully');
});

const loginForm = $('#login-form');
if (loginForm) {


  // Demo login validation stores a session flag before redirecting to the dashboard.

  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    const email = $('#login-email').value.trim();
    const password = $('#login-password').value;
    const validEmail = email.toLowerCase() === 'nnamanigideon6@gmail.com';
    const validUsername = email.toLowerCase() === 'nnamanigideon6';
    const validLogin = (validEmail || validUsername) && password === 'big1244';
    if (!validLogin) {
      const message = document.createElement('p');
      message.className = 'login-error';
      message.textContent = 'Invalid email or password.';
      loginForm.querySelector('.login-error')?.remove();
      loginForm.insertBefore(message, loginForm.querySelector('.login-submit'));
      return;
    }
    localStorage.setItem('northstar-bank-auth', 'true');
    window.location.href = 'my bank.html';
  });
}

const logoutButton = $('#logout-btn');
if (logoutButton) {
  
  // Clear the demo session and return to the login page.

  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('northstar-bank-auth');
    window.location.href = 'login.html';
  });
}

const isDashboard = window.location.pathname.toLowerCase().endsWith('my bank.html');
const isLoginPage = window.location.pathname.toLowerCase().endsWith('login.html');
const isAuthenticated = localStorage.getItem('northstar-bank-auth') === 'true';

// Prevent unauthenticated dashboard access and skip the login screen for active sessions.

if (isDashboard && !isAuthenticated) window.location.href = 'login.html';
if (isLoginPage && isAuthenticated) window.location.href = 'my bank.html';
if (dashboard) render();
