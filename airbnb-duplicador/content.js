// Airbnb Listing Duplicator - Content Script

let isAutomating = false;
let settings = {};
let isProcessing = false;
let lastUrl = window.location.href;

// Helper to sleep
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Get tab-specific storage key for logs to prevent cross-tab pollution
if (!window.name || !window.name.startsWith('ab_dup_tab_')) {
  window.name = 'ab_dup_tab_' + Math.random().toString(36).substring(2, 10);
}
const tabId = window.name;
const logStorageKey = `logs_${tabId}`;

// Persist Logs in chrome.storage.local so they survive page reloads
async function addLog(text, type = 'info') {
  console.log(`[AirbnbDuplicator] [${type}] ${text}`);
  return new Promise((resolve) => {
    chrome.storage.local.get([logStorageKey], (res) => {
      const logs = res[logStorageKey] || [];
      const bullet = type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : '•';
      
      logs.push({
        text,
        type,
        bullet,
        time: new Date().toLocaleTimeString()
      });
      
      // Limit logs history
      if (logs.length > 40) {
        logs.shift();
      }
      
      chrome.storage.local.set({ [logStorageKey]: logs }, () => {
        renderLogs(logs);
        resolve();
      });
    });
  });
}

function clearLogs() {
  chrome.storage.local.set({ [logStorageKey]: [] }, () => {
    renderLogs([]);
  });
}

// Render logs into the floating widget
function renderLogs(logs) {
  const container = document.getElementById('ab-logs-container');
  if (!container) return;
  
  container.innerHTML = '';
  logs.forEach(log => {
    const entry = document.createElement('div');
    entry.className = `ab-log-entry ${log.type}`;
    entry.innerHTML = `
      <span class="ab-log-bullet">${log.bullet}</span>
      <span class="ab-log-text">[${log.time}] ${log.text}</span>
    `;
    container.appendChild(entry);
  });
  container.scrollTop = container.scrollHeight;
}

// Inject Floating Widget Panel
function injectFloatingWidget() {
  if (document.getElementById('airbnb-duplicator-widget')) return;
  
  const widget = document.createElement('div');
  widget.id = 'airbnb-duplicator-widget';
  
  widget.innerHTML = `
    <div class="ab-widget-header" id="ab-widget-header-el">
      <div class="ab-widget-title">
        <span class="ab-widget-title-icon">⌂</span>
        <span>Airbnb Duplicador</span>
      </div>
      <div class="ab-widget-controls">
        <span class="ab-widget-dot" id="ab-widget-status-dot"></span>
        <button class="ab-widget-collapse-btn" id="ab-widget-collapse-btn-el">▲</button>
      </div>
    </div>
    <div class="ab-widget-body">
      <div class="ab-status-card">
        <div class="ab-status-label">Status do Processo</div>
        <div class="ab-status-value" id="ab-widget-status-val">Inativo</div>
      </div>
      
      <div class="ab-status-label">Painel de Logs</div>
      <div class="ab-log-panel" id="ab-logs-container">
        <!-- Logs populated here -->
      </div>
      
      <div class="ab-action-row">
        <button class="ab-btn ab-btn-secondary" id="ab-btn-toggle-auto">Iniciar</button>
        <button class="ab-btn ab-btn-secondary" id="ab-btn-clear-logs">Limpar Logs</button>
      </div>

      <div class="ab-settings-accordion">
        <details class="ab-details-accordion">
          <summary class="ab-summary-accordion">⚙️ Configurar Dados do Anúncio</summary>
          <div class="ab-accordion-content">
            <div class="ab-input-group">
              <label>Título do Anúncio</label>
              <input type="text" id="w-input-title" placeholder="Título do Anúncio">
            </div>
            <div class="ab-input-group">
              <label>Nome Interno (Editor)</label>
              <input type="text" id="w-input-internal" placeholder="Nome Interno">
            </div>
            <div class="ab-input-group-row">
              <div class="ab-input-group half">
                <label>Preço Base (R$)</label>
                <input type="number" id="w-input-price" value="1000">
              </div>
              <div class="ab-input-group half">
                <label>Hóspedes</label>
                <input type="number" id="w-input-guests" value="4">
              </div>
            </div>
            <div class="ab-input-group-row">
              <div class="ab-input-group fourth">
                <label>Quartos</label>
                <input type="number" id="w-input-rooms" value="1">
              </div>
              <div class="ab-input-group fourth">
                <label>Camas</label>
                <input type="number" id="w-input-beds" value="3">
              </div>
              <div class="ab-input-group half">
                <label>Banheiros</label>
                <input type="number" id="w-input-baths" step="0.5" value="1">
              </div>
            </div>
            <div class="ab-input-group">
              <label>Descrição Geral (Anúncio)</label>
              <textarea id="w-input-desc" rows="2" placeholder="Insira a descrição geral do espaço..."></textarea>
            </div>
            <div class="ab-input-group">
              <label>Sua Propriedade (Editor)</label>
              <textarea id="w-input-prop" rows="2" placeholder="🏡 Descreva a propriedade (quartos, áreas)..."></textarea>
            </div>
            <div class="ab-input-group">
              <label>Acesso do Hóspede (Editor)</label>
              <textarea id="w-input-access" rows="2" placeholder="🚪 O que os hóspedes podem acessar..."></textarea>
            </div>
            <div class="ab-input-group">
              <label>Outras Informações (Editor)</label>
              <textarea id="w-input-other" rows="2" placeholder="📋 Regras da casa, check-in, etc..."></textarea>
            </div>
          </div>
        </details>
      </div>
    </div>
  `;
  
  document.body.appendChild(widget);
  
  // Setup toggle event
  const toggleBtn = document.getElementById('ab-btn-toggle-auto');
  toggleBtn.addEventListener('click', () => {
    chrome.storage.local.set({ isAutomating: !isAutomating }, () => {
      isAutomating = !isAutomating;
      updateWidgetUI();
      addLog(isAutomating ? 'Automação retomada pelo painel.' : 'Automação pausada pelo painel.', isAutomating ? 'success' : 'warning');
    });
  });

  // Clear logs event
  const clearBtn = document.getElementById('ab-btn-clear-logs');
  clearBtn.addEventListener('click', () => {
    clearLogs();
  });

  // Collapse/Expand widget event
  const header = document.getElementById('ab-widget-header-el');
  const collapseBtn = document.getElementById('ab-widget-collapse-btn-el');
  header.addEventListener('click', () => {
    widget.classList.toggle('collapsed');
    collapseBtn.textContent = widget.classList.contains('collapsed') ? '▼' : '▲';
  });

  // Stop click propagation to prevent triggering Airbnb background handlers
  widget.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Populate settings inputs
  const inputsMapping = {
    'w-input-title': 'listingTitle',
    'w-input-internal': 'listingInternalName',
    'w-input-price': 'listingBasePrice',
    'w-input-desc': 'listingDescription',
    'w-input-prop': 'listingPropertyDetails',
    'w-input-access': 'listingGuestAccess',
    'w-input-other': 'listingOtherDetails',
    'w-input-guests': 'countGuests',
    'w-input-rooms': 'countBedrooms',
    'w-input-beds': 'countBeds',
    'w-input-baths': 'countBathrooms'
  };

  chrome.storage.local.get(Object.values(inputsMapping), (stored) => {
    Object.entries(inputsMapping).forEach(([elemId, storageKey]) => {
      const elem = document.getElementById(elemId);
      if (elem && stored[storageKey] !== undefined) {
        elem.value = stored[storageKey];
      }
    });
  });

  // Bind input change events to storage
  Object.entries(inputsMapping).forEach(([elemId, storageKey]) => {
    const elem = document.getElementById(elemId);
    if (elem) {
      elem.addEventListener('input', () => {
        let value = elem.value;
        if (elem.type === 'number') {
          value = elem.id === 'w-input-baths' ? parseFloat(value) : parseInt(value);
        }
        chrome.storage.local.set({ [storageKey]: value });
      });
    }
  });
  
  // Render initial logs
  chrome.storage.local.get([logStorageKey], (res) => {
    renderLogs(res[logStorageKey] || []);
  });
  
  updateWidgetUI();
}

// Update the float panel elements to reflect active status
function updateWidgetUI() {
  const dot = document.getElementById('ab-widget-status-dot');
  const statusVal = document.getElementById('ab-widget-status-val');
  const toggleBtn = document.getElementById('ab-btn-toggle-auto');
  
  if (!dot || !statusVal || !toggleBtn) return;
  
  if (isAutomating) {
    dot.className = 'ab-widget-dot active';
    statusVal.innerHTML = '<span class="ab-widget-loader"></span> Executando automação...';
    toggleBtn.textContent = 'Pausar';
    toggleBtn.className = 'ab-btn ab-btn-secondary';
  } else {
    dot.className = 'ab-widget-dot';
    statusVal.textContent = 'Pausado';
    toggleBtn.textContent = 'Retomar';
    toggleBtn.className = 'ab-btn ab-btn-primary';
  }
}

// Helper DOM selectors
function findHeadingContains(texts) {
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]'));
  return headings.find(h => {
    const content = h.textContent.trim().toLowerCase();
    return texts.some(t => content.includes(t.toLowerCase()));
  });
}

function findElementByText(selectors, text, exact = false) {
  const elements = Array.from(document.querySelectorAll(selectors));
  const target = text.trim().toLowerCase();
  
  // First, find all elements that match the text criteria
  const matching = elements.filter(el => {
    const content = el.textContent.trim().toLowerCase();
    return exact ? content === target : content.includes(target);
  });
  
  if (matching.length === 0) return null;
  
  // Find the deepest matching elements (leaf-most)
  // i.e., elements in 'matching' that do not contain any other element in 'matching'
  let leafMatching = matching.filter(el => {
    return !matching.some(other => other !== el && el.contains(other));
  });
  
  if (leafMatching.length === 0) {
    leafMatching = matching;
  }
  
  // Look up to 4 levels for a button, anchor, or role="button" to click
  for (const el of leafMatching) {
    let parent = el;
    for (let i = 0; i < 4; i++) {
      if (!parent) break;
      if (parent.tagName === 'BUTTON' || 
          parent.tagName === 'A' || 
          parent.getAttribute('role') === 'button' || 
          parent.classList.contains('clickable')) {
        return parent;
      }
      parent = parent.parentElement;
    }
  }
  
  // Fallback to the first leaf matching element
  return leafMatching[0];
}

// Click card option by text (Category, Space type, etc)
async function selectOptionCard(text) {
  // Find card elements (buttons, links or divs acting as cards)
  const elements = Array.from(document.querySelectorAll('button, div[role="button"], [class*="card"], [class*="option"], div, span'));
  
  // Search for the exact text container
  const textEl = elements.find(el => {
    if (el.children.length > 0) return false;
    return el.textContent.trim().toLowerCase() === text.toLowerCase();
  });
  
  if (!textEl) {
    return false;
  }
  
  // Ascend to find a clickable container if needed
  let clickTarget = textEl;
  let parent = textEl.parentElement;
  for (let i = 0; i < 4; i++) {
    if (!parent) break;
    if (parent.tagName === 'BUTTON' || parent.getAttribute('role') === 'button' || parent.classList.contains('clickable') || parent.onclick) {
      clickTarget = parent;
      break;
    }
    parent = parent.parentElement;
  }
  
  addLog(`Selecionando card: '${text}'...`, 'info');
  clickTarget.click();
  await sleep(1000);
  return true;
}

// Click Next ("Avançar") button
async function clickNextButton() {
  const nextBtn = findElementByText('button, [role="button"], a, div, span', 'avançar', true) || 
                  findElementByText('button, [role="button"], a, div, span', 'próximo', true) || 
                  findElementByText('button, [role="button"], a, div, span', 'continuar', true) || 
                  findElementByText('button, [role="button"], a, div, span', 'publicar', true) ||
                  findElementByText('button, [role="button"], a, div, span', 'next', true) ||
                  findElementByText('button, [role="button"], a, div, span', 'continue', true);

  if (!nextBtn) {
    addLog(`Botão 'Avançar' não encontrado ou não visível.`, 'warning');
    return false;
  }

  // Check if disabled
  const isDisabled = nextBtn.disabled || 
                     nextBtn.getAttribute('disabled') !== null || 
                     nextBtn.getAttribute('aria-disabled') === 'true';

  if (isDisabled) {
    addLog(`O botão 'Avançar' está desabilitado. Por favor, preencha as informações necessárias na página.`, 'warning');
    return false;
  }

  addLog(`Clicando no botão 'Avançar'...`, 'success');
  nextBtn.click();
  await sleep(2000);
  return true;
}

// Adjust quantity for basic settings (Guests, Bedrooms, Beds, Bathrooms)
async function adjustQuantityRow(label, targetVal) {
  // Find element containing label text
  const elements = Array.from(document.querySelectorAll('div, span, p'));
  const rowLabelElement = elements.find(el => {
    if (el.children.length > 0) return false;
    return el.textContent.trim().toLowerCase() === label.toLowerCase();
  });

  if (!rowLabelElement) {
    addLog(`Aviso: Capacidade '${label}' não encontrada na página.`, 'warning');
    return false;
  }

  // Ascend to row container
  let container = rowLabelElement.parentElement;
  let buttons = [];
  for (let i = 0; i < 4; i++) {
    if (!container) break;
    buttons = Array.from(container.querySelectorAll('button'));
    if (buttons.length >= 2) break;
    container = container.parentElement;
  }

  if (buttons.length < 2 || !container) {
    addLog(`Aviso: Botões + / - para '${label}' não encontrados.`, 'warning');
    return false;
  }

  // Parse current value inside the container
  const subElements = Array.from(container.querySelectorAll('*')).filter(el => el.children.length === 0);
  let currentVal = null;
  for (const subEl of subElements) {
    const text = subEl.textContent.trim();
    if (/^\d+(\.\d+)?$/.test(text)) {
      currentVal = parseFloat(text);
      break;
    }
  }

  if (currentVal === null) {
    addLog(`Aviso: Não foi possível ler o valor atual de '${label}'.`, 'warning');
    return false;
  }

  if (currentVal === targetVal) {
    return true; // Correctly matched!
  }

  // First button is decrease (-), second button is increase (+)
  const decBtn = buttons[0];
  const incBtn = buttons[1];

  if (currentVal < targetVal) {
    addLog(`Aumentando '${label}' de ${currentVal} para ${targetVal}...`, 'info');
    incBtn.click();
  } else {
    addLog(`Diminuindo '${label}' de ${currentVal} para ${targetVal}...`, 'info');
    decBtn.click();
  }

  await sleep(500); // Wait between clicks
  return false; // Re-evaluate on next tick
}

// Adjust exact location toggle switch
async function adjustExactLocationToggle(targetVal) {
  // Find "Mostrar localização exata" text
  const elements = Array.from(document.querySelectorAll('div, span, p, label'));
  const labelEl = elements.find(el => {
    if (el.children.length > 0) return false;
    return el.textContent.trim().toLowerCase().includes("mostrar localização exata");
  });

  if (!labelEl) {
    addLog(`Aviso: Opção 'Mostrar localização exata' não encontrada na tela.`, 'warning');
    return false;
  }

  let parent = labelEl.parentElement;
  let toggleEl = null;
  for (let i = 0; i < 4; i++) {
    if (!parent) break;
    toggleEl = parent.querySelector('button[role="switch"], input[type="checkbox"], [role="checkbox"]');
    if (toggleEl) break;
    parent = parent.parentElement;
  }

  if (!toggleEl && parent) {
    toggleEl = parent.querySelector('button'); // Fallback to any button inside
  }

  if (!toggleEl) {
    addLog(`Aviso: Switch de localização exata não encontrado.`, 'warning');
    return false;
  }

  // Determine current checked status
  let isChecked = false;
  if (toggleEl.tagName === 'INPUT' && toggleEl.type === 'checkbox') {
    isChecked = toggleEl.checked;
  } else {
    const ariaChecked = toggleEl.getAttribute('aria-checked');
    if (ariaChecked === 'true') {
      isChecked = true;
    } else if (toggleEl.classList.contains('checked') || toggleEl.getAttribute('checked') !== null) {
      isChecked = true;
    }
  }

  if (isChecked === targetVal) {
    addLog(`Localização exata já está em ${targetVal ? 'ATIVADO' : 'DESATIVADO'}.`, 'success');
    return true;
  }

  addLog(`Alternando localização exata para ${targetVal ? 'ATIVADO' : 'DESATIVADO'}...`, 'info');
  toggleEl.click();
  await sleep(1000);
  return false;
}

// Fill text fields (inputs / textareas) supporting React events
async function fillTextField(targetValue) {
  const fields = Array.from(document.querySelectorAll('textarea, input'));
  if (fields.length === 0) {
    addLog(`Aviso: Campo para preenchimento de texto não encontrado.`, 'warning');
    return false;
  }

  // Find the first visible field
  const field = fields.find(f => f.getBoundingClientRect().height > 0) || fields[0];

  if (field.value === targetValue) {
    return true; // Already matches
  }

  addLog(`Preenchendo campo: "${targetValue.substring(0, 30)}..."`, 'info');
  field.value = targetValue;
  
  // React updates
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Backup InputEvent
  const inputEv = new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    data: targetValue
  });
  field.dispatchEvent(inputEv);
  
  await sleep(1000);
  return false; // Allow state to settle
}

// --- Listing Editor Helpers (Post-Publish) ---

async function clickSidebarItem(texts) {
  // Find list of elements in sidebar
  const elements = Array.from(document.querySelectorAll('a, button, div[role="button"], span, div'));
  
  for (const text of texts) {
    const el = elements.find(item => {
      if (item.children.length > 0 && item.tagName !== 'A') return false;
      return item.textContent.trim().toLowerCase().includes(text.toLowerCase());
    });

    if (el) {
      addLog(`Clicando na seção lateral: '${el.textContent.trim()}'...`, 'info');
      el.click();
      await sleep(2000);
      return true;
    }
  }

  addLog(`Aviso: Seção lateral contendo '${texts[0]}' não encontrada.`, 'warning');
  return false;
}

function findInputByLabel(labelText) {
  const labels = Array.from(document.querySelectorAll('label, div, span, p'));
  const label = labels.find(el => el.textContent.trim().toLowerCase() === labelText.toLowerCase() && el.children.length === 0);
  if (label) {
    let parent = label.parentElement;
    for (let i = 0; i < 4; i++) {
      if (!parent) break;
      const input = parent.querySelector('input, textarea');
      if (input) return input;
      parent = parent.parentElement;
    }
  }
  
  // Fallback: search inputs by placeholder
  const inputs = Array.from(document.querySelectorAll('input, textarea'));
  const found = inputs.find(input => {
    const ph = (input.placeholder || input.getAttribute('placeholder') || '').toLowerCase();
    return ph.includes(labelText.toLowerCase());
  });
  if (found) return found;

  // Second fallback: check if input is near the text
  const textEl = labels.find(el => el.textContent.trim().toLowerCase().includes(labelText.toLowerCase()));
  if (textEl) {
    let sibling = textEl.nextElementSibling;
    while (sibling) {
      if (sibling.tagName === 'INPUT' || sibling.tagName === 'TEXTAREA') return sibling;
      const input = sibling.querySelector('input, textarea');
      if (input) return input;
      sibling = sibling.nextElementSibling;
    }
  }
  
  return inputs[0] || null;
}

async function editEditorSection(label, fillCallback) {
  // Find label element in editor panel
  const elements = Array.from(document.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6, li'));
  const labelEl = elements.find(el => {
    if (el.children.length > 0) return false;
    const txt = el.textContent.trim().toLowerCase();
    const search = label.toLowerCase();
    return txt === search || 
           txt.includes(search + '\n') || 
           (txt.length < 40 && txt.includes(search));
  });

  if (!labelEl) {
    addLog(`Aviso: Detalhe do editor '${label}' não encontrado no painel da direita.`, 'warning');
    return false;
  }

  // Scroll into view
  labelEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
  await sleep(800);

  // Find edit button or click container row
  let container = labelEl.parentElement;
  let editBtn = null;
  for (let i = 0; i < 4; i++) {
    if (!container) break;
    editBtn = Array.from(container.querySelectorAll('button, a, [role="button"]')).find(btn => {
      const text = btn.textContent.trim().toLowerCase();
      return text.includes('editar') || text.includes('alterar') || text.includes('edit') || text.includes('change');
    });
    if (editBtn) break;
    container = container.parentElement;
  }

  if (!editBtn) {
    addLog(`Botão 'Editar' para '${label}' não encontrado. Clicando diretamente no elemento...`, 'info');
    labelEl.click();
  } else {
    addLog(`Clicando em 'Editar' para '${label}'...`, 'info');
    editBtn.click();
  }

  // Wait for edit mode/modal to render
  await sleep(2000);

  // Run the callback to insert fields
  const success = await fillCallback();
  if (!success) return false;

  // Find and click save button
  const buttons = Array.from(document.querySelectorAll('button'));
  const saveBtn = buttons.find(btn => {
    const text = btn.textContent.trim().toLowerCase();
    return text === 'salvar' || text === 'save' || text === 'guardar' || text.includes('salvar');
  });

  if (!saveBtn) {
    addLog(`Aviso: Botão 'Salvar' não encontrado na seção.`, 'warning');
    return false;
  }

  if (saveBtn.disabled || saveBtn.getAttribute('disabled') !== null) {
    addLog(`Botão 'Salvar' está desativado. Verifique os dados inseridos.`, 'warning');
    return false;
  }

  addLog(`Salvando alterações de '${label}'...`, 'info');
  saveBtn.click();
  await sleep(2500); // wait for save transition
  return true;
}

// Specific editor fill callbacks
async function fillCancellationPolicy() {
  const select = document.querySelector('select');
  if (select) {
    const option = Array.from(select.options).find(opt => 
      opt.text.toLowerCase().includes(settings.cancellationPolicy.toLowerCase())
    );
    if (option) {
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      addLog(`Selecionado política no dropdown: '${option.text}'`, 'info');
      return true;
    }
  }

  // Fallback radio buttons or items
  const options = Array.from(document.querySelectorAll('button, div[role="button"], label, span'));
  const targetOpt = options.find(opt => 
    opt.textContent.trim().toLowerCase().includes(settings.cancellationPolicy.toLowerCase())
  );

  if (targetOpt) {
    addLog(`Selecionando política: '${settings.cancellationPolicy}'`, 'info');
    targetOpt.click();
    await sleep(1000);
    return true;
  }

  addLog(`Aviso: Opção de política '${settings.cancellationPolicy}' não encontrada.`, 'warning');
  return false;
}

async function fillInternalName() {
  const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea'));
  if (inputs.length === 0) {
    addLog(`Aviso: Campo do Nome Interno não encontrado.`, 'warning');
    return false;
  }
  
  const input = inputs[0];
  input.value = settings.listingInternalName;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  addLog(`Nome interno definido para: "${settings.listingInternalName}"`, 'info');
  return true;
}

async function fillDescription() {
  const textareas = Array.from(document.querySelectorAll('textarea'));
  if (textareas.length === 0) {
    addLog(`Aviso: Campo da descrição no editor não encontrado.`, 'warning');
    return false;
  }
  
  const textarea = textareas[0];
  textarea.value = settings.listingDescription;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
  addLog(`Descrição preenchida.`, 'info');
  return true;
}

// --- Automation State Machine Loop ---

async function runAutomationCycle() {
  if (!isAutomating || isProcessing) return;
  
  isProcessing = true;
  
  try {
    // Handle any modal overlays (like "Seu tour por fotos está pronto!" or other announcements)
    const popupBtn = findElementByText('button, [role="button"], a, div, span', 'Confira', true) || 
                     findElementByText('button, [role="button"], a, div, span', 'Fechar', true) ||
                     findElementByText('button, [role="button"], a, div, span', 'Confirmar', true);
    if (popupBtn && popupBtn.getBoundingClientRect().height > 0) {
      addLog(`Descartando pop-up do Airbnb (clicando em '${popupBtn.textContent.trim()}')...`, 'info');
      popupBtn.click();
      await sleep(1500);
      return; // let DOM settle
    }

    const url = window.location.href;
    
    // Detect page context
    if (url.includes('/become-a-host')) {
      await runWizardAutomation();
    } else if (url.includes('/hosting/listings/editor/')) {
      await runEditorAutomation();
    } else {
      // Not on creation page nor editor page
      // Do nothing, but widget remains visible
    }
  } catch (err) {
    addLog(`Erro inesperado na automação: ${err.message}`, 'error');
  } finally {
    isProcessing = false;
  }
}

// Wizard Automation Flow
async function runWizardAutomation() {
  // Step 0: Overview / Welcome Page
  const startBtn = findElementByText('button, [role="button"], a, div, span', 'Começar', true) || 
                   findElementByText('button, [role="button"], a, div, span', 'Começar', false);
  if (startBtn && (window.location.pathname.endsWith('/overview') || window.location.href.includes('/overview'))) {
    addLog(`Página inicial detectada. Clicando em 'Começar'...`, 'info');
    startBtn.click();
    await sleep(2000);
    return;
  }

  // Step 0.5: Intro to Chapter 1 ("Descreva sua acomodação" / about-your-place)
  if (findHeadingContains(['Descreva sua acomodação']) || window.location.pathname.endsWith('/about-your-place') || window.location.href.includes('/about-your-place')) {
    addLog(`Etapa detectada: Introdução (Descreva sua acomodação). Clicando em 'Avançar'...`, 'info');
    await clickNextButton();
    return;
  }

  // Step 1: Category selection
  if (findHeadingContains(['Qual destas opções', 'Qual das seguintes opções', 'Qual opção descreve melhor'])) {
    addLog(`Etapa detectada: Categoria do Espaço`, 'info');
    const success = await selectOptionCard(settings.spaceCategory);
    if (success) {
      await clickNextButton();
    }
    return;
  }

  // Step 2: Space type selection
  if (findHeadingContains(['Que tipo de espaço', 'Que tipo de acomodação'])) {
    addLog(`Etapa detectada: Tipo de Espaço`, 'info');
    const success = await selectOptionCard(settings.spaceType);
    if (success) {
      await clickNextButton();
    }
    return;
  }

  // Step 3: Exact location toggle
  if (findHeadingContains(['como os hóspedes visualizam sua localização', 'localização em um mapa'])) {
    addLog(`Etapa detectada: Localização no mapa`, 'info');
    const success = await adjustExactLocationToggle(settings.showExactLocation);
    if (success) {
      await clickNextButton();
    }
    return;
  }

  // Step 4: Map marker verification
  if (findHeadingContains(['O marcador está no local certo'])) {
    addLog(`Etapa detectada: Confirmação do Marcador do Mapa`, 'info');
    await clickNextButton();
    return;
  }

  // Step 5: Capacity Info
  if (findHeadingContains(['informações básicas sobre sua acomodação', 'básicas sobre sua acomodação'])) {
    addLog(`Etapa detectada: Capacidades Básicas`, 'info');
    
    const hMatched = await adjustQuantityRow('Hóspedes', settings.countGuests);
    const qMatched = await adjustQuantityRow('Quartos', settings.countBedrooms);
    const cMatched = await adjustQuantityRow('Camas', settings.countBeds);
    const bMatched = await adjustQuantityRow('Banheiros', settings.countBathrooms);
    
    if (hMatched && qMatched && cMatched && bMatched) {
      addLog(`Todas as capacidades básicas configuradas corretamente.`, 'success');
      await clickNextButton();
    }
    return;
  }

  // Step 6: Step 2 intro
  if (findHeadingContains(['Faça sua acomodação se destacar'])) {
    addLog(`Etapa detectada: Introdução de Comodidades e Destaques`, 'info');
    await clickNextButton();
    return;
  }

  // Step 7: Amenities selection
  if (findHeadingContains(['Informe aos hóspedes o que seu espaço tem'])) {
    addLog(`Etapa detectada: Comodidades. Aguardando seleção manual. Clique em 'Avançar' no Airbnb quando concluir.`, 'warning');
    // We do not auto-click here to let the user select their amenities, or we wait for button to be clicked.
    // The loop will simply stand by.
    return;
  }

  // Step 8: Photos upload
  if (findHeadingContains(['Pronto! Que tal?', 'Foto de capa'])) {
    addLog(`Etapa detectada: Fotos. Aguardando upload das fotos. Clique em 'Avançar' no Airbnb quando concluir.`, 'warning');
    // Stand by for photo upload
    return;
  }

  // Step 9: Title input
  if (findHeadingContains(['Agora, vamos dar um título', 'dar um título à sua acomodação'])) {
    addLog(`Etapa detectada: Título do Anúncio`, 'info');
    const filled = await fillTextField(settings.listingTitle);
    if (filled) {
      await clickNextButton();
    }
    return;
  }

  // Step 10: Description input
  if (findHeadingContains(['Crie sua descrição', 'descrição do seu espaço', 'vamos descrever seu'])) {
    addLog(`Etapa detectada: Descrição do Anúncio`, 'info');
    const filled = await fillTextField(settings.listingDescription);
    if (filled) {
      await clickNextButton();
    }
    return;
  }
  
  // Step 11: Address manual search step (usually "Onde fica seu espaço?")
  if (findHeadingContains(['Onde fica seu espaço?'])) {
    addLog(`Etapa detectada: Entrada de Endereço. Por favor, digite o endereço manualmente e selecione na lista.`, 'warning');
    // Stand by for address
    return;
  }

  // Step 12: Add highlights/tags description
  if (findHeadingContains(['vamos descrever sua acomodação', 'descrever sua acomodação'])) {
    addLog(`Etapa detectada: Destaques da descrição da acomodação`, 'info');
    await clickNextButton();
    return;
  }

  // Step 13: Weekday Price input
  if (findHeadingContains(['preço básico para dias de semana', 'Defina um preço básico'])) {
    addLog(`Etapa detectada: Preço Básico Semanal`, 'info');
    const filled = await fillTextField(String(settings.listingBasePrice || 1000));
    if (filled) {
      await clickNextButton();
    }
    return;
  }

  // Step 14: Weekend Price input
  if (findHeadingContains(['preço para fins de semana', 'Defina um preço para fins'])) {
    addLog(`Etapa detectada: Preço de Fim de Semana`, 'info');
    await clickNextButton();
    return;
  }

  // Step 15: Add discounts page
  if (findHeadingContains(['Adicione descontos'])) {
    addLog(`Etapa detectada: Adição de Descontos`, 'info');
    await clickNextButton();
    return;
  }

  // Step 15.5: Chapter 3 intro ("Concluir e publicar")
  if (findHeadingContains(['Concluir e publicar', 'Hora de dar o toque final', 'Última etapa', 'Finalizar e publicar'])) {
    addLog(`Etapa detectada: Introdução (Concluir e publicar). Clicando em 'Avançar'...`, 'info');
    await clickNextButton();
    return;
  }

  // Step 16: Safety Information
  if (findHeadingContains(['informações de segurança', 'segurança de sua acomodação'])) {
    addLog(`Etapa detectada: Informações de Segurança`, 'info');
    await clickNextButton();
    return;
  }
}

// Editor Automation Flow
async function runEditorAutomation() {
  chrome.storage.local.get(['editorStep'], async (res) => {
    const step = res.editorStep || 'START';
    
    // Check if modal "Tem certeza de que deseja desativar a Reserva Instantânea?" is open
    const disableInstantBookBtn = findElementByText('button, [role="button"], a, div, span', 'Desativar Reserva Instantânea', true);
    if (disableInstantBookBtn && disableInstantBookBtn.getBoundingClientRect().height > 0) {
      addLog(`Confirmando desativação da Reserva Instantânea...`, 'info');
      disableInstantBookBtn.click();
      await sleep(1500);
      return;
    }

    if (step === 'START') {
      addLog(`Iniciando automação do Editor. Abrindo 'Configurações de reserva'...`, 'info');
      const clicked = await clickSidebarItem(['Configurações de reserva', 'Reserva', 'Booking settings']);
      if (clicked) {
        chrome.storage.local.set({ editorStep: 'BOOKING_SETTINGS_CLICKED' });
      }
    } 
    else if (step === 'BOOKING_SETTINGS_CLICKED') {
      addLog(`Selecionando 'Aprovar todas as reservas'...`, 'info');
      const card = findElementByText('button, div[role="button"], div, span', 'Aprovar todas as reservas', false);
      if (card) {
        card.click();
        chrome.storage.local.set({ editorStep: 'BOOKING_SETTINGS_OPTION_SELECTED' });
        await sleep(1500);
      } else {
        addLog(`Aviso: Opção 'Aprovar todas as reservas' não encontrada.`, 'warning');
      }
    }
    else if (step === 'BOOKING_SETTINGS_OPTION_SELECTED') {
      addLog(`Salvando Configurações de Reserva...`, 'info');
      const saveBtn = findElementByText('button, [role="button"], a, div, span', 'Salvar', true);
      if (saveBtn) {
        saveBtn.click();
        addLog(`Configurações de Reserva salvas com sucesso!`, 'success');
        chrome.storage.local.set({ editorStep: 'BOOKING_SETTINGS_SAVED' });
        await sleep(2500);
      } else {
        addLog(`Aviso: Botão Salvar das configurações de reserva não encontrado.`, 'warning');
      }
    }
    else if (step === 'BOOKING_SETTINGS_SAVED') {
      addLog(`Navegando para Políticas de cancelamento...`, 'info');
      const clicked = await clickSidebarItem(['Políticas de cancelamento', 'Políticas', 'Políticas e regras', 'Políticas de cancelamento']);
      if (clicked) {
        chrome.storage.local.set({ editorStep: 'POLICIES_CLICKED' });
      }
    }
    else if (step === 'POLICIES_CLICKED') {
      addLog(`Abrindo edição das Estadias de Curta Duração...`, 'info');
      const success = await editShortTermStays();
      if (success) {
        chrome.storage.local.set({ editorStep: 'POLICY_EDIT_OPENED' });
        await sleep(2000);
      } else {
        const card = findElementByText('button, [role="button"], a, div, span', 'Editar', false);
        if (card) {
          card.click();
          chrome.storage.local.set({ editorStep: 'POLICY_EDIT_OPENED' });
          await sleep(2000);
        } else {
          addLog(`Aviso: Botão Editar de Estadias de curta duração não encontrado.`, 'warning');
        }
      }
    } 
    else if (step === 'POLICY_EDIT_OPENED') {
      addLog(`Selecionando política Restrita...`, 'info');
      const options = Array.from(document.querySelectorAll('button, div[role="button"], label, span, div'));
      const targetOpt = options.find(opt => {
        if (opt.children.length > 0) return false;
        return opt.textContent.trim() === 'Restrita';
      });

      if (targetOpt) {
        targetOpt.click();
        await sleep(1000);
        
        const saveBtn = findElementByText('button, [role="button"], a, div, span', 'Salvar', true);
        if (saveBtn) {
          saveBtn.click();
          addLog(`Política de cancelamento Restrita salva com sucesso!`, 'success');
          chrome.storage.local.set({ editorStep: 'POLICY_SAVED' });
          await sleep(2500);
        } else {
          addLog(`Aviso: Botão Salvar do drawer de políticas não encontrado.`, 'warning');
        }
      } else {
        addLog(`Aviso: Opção de política 'Restrita' não encontrada no drawer.`, 'warning');
      }
    } 
    else if (step === 'POLICY_SAVED') {
      addLog(`Navegando para Título e Nome Interno...`, 'info');
      const clicked = await clickSidebarItem(['Título', 'Title', 'Nome']);
      if (clicked) {
        chrome.storage.local.set({ editorStep: 'TITLE_CLICKED' });
      }
    }
    else if (step === 'TITLE_CLICKED') {
      addLog(`Ajustando Nome Interno do anúncio...`, 'info');
      const input = findInputByLabel('Nome interno');
      if (input) {
        input.value = settings.listingInternalName;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        const saveBtn = findElementByText('button, [role="button"], a, div, span', 'Salvar', false) || 
                        findElementByText('button, [role="button"], a, div, span', 'Save', false);
        if (saveBtn) {
          saveBtn.click();
          addLog(`Nome interno definido como "${settings.listingInternalName}" e salvo!`, 'success');
          chrome.storage.local.set({ editorStep: 'TITLE_SAVED' });
          await sleep(2500);
        } else {
          addLog(`Aviso: Botão Salvar não encontrado na edição do Nome Interno.`, 'warning');
        }
      } else {
        addLog(`Aviso: Campo Nome Interno não encontrado na página.`, 'warning');
      }
    } 
    else if (step === 'TITLE_SAVED') {
      addLog(`Navegando para Descrição do anúncio...`, 'info');
      const clicked = await clickSidebarItem(['Descrição', 'Description']);
      if (clicked) {
        chrome.storage.local.set({ editorStep: 'DESCRIPTION_MENU_CLICKED' });
      }
    }
    else if (step === 'DESCRIPTION_MENU_CLICKED') {
      if (!settings.listingPropertyDetails) {
        addLog(`Pulando detalhes de 'Sua propriedade' (vazio)...`, 'info');
        chrome.storage.local.set({ editorStep: 'PROPERTY_SAVED' });
        return;
      }
      addLog(`Abrindo edição de 'Sua propriedade'...`, 'info');
      const row = findElementByText('div, span, p, button', 'Sua propriedade', false);
      if (row) {
        row.scrollIntoView({ block: 'center', behavior: 'smooth' });
        await sleep(500);
        row.click();
        chrome.storage.local.set({ editorStep: 'PROPERTY_EDIT_OPENED' });
        await sleep(2000);
      } else {
        addLog(`Aviso: Linha 'Sua propriedade' não encontrada no painel de descrição.`, 'warning');
      }
    }
    else if (step === 'PROPERTY_EDIT_OPENED') {
      addLog(`Preenchendo detalhes de 'Sua propriedade'...`, 'info');
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = settings.listingPropertyDetails;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        
        const saveBtn = findElementByText('button, [role="button"], a, div, span', 'Salvar', true);
        if (saveBtn) {
          saveBtn.click();
          addLog(`Detalhes de 'Sua propriedade' salvos com sucesso!`, 'success');
          chrome.storage.local.set({ editorStep: 'PROPERTY_SAVED' });
          await sleep(2500);
        } else {
          addLog(`Aviso: Botão Salvar da propriedade não encontrado.`, 'warning');
        }
      } else {
        addLog(`Aviso: Textarea de 'Sua propriedade' não encontrada.`, 'warning');
      }
    }
    else if (step === 'PROPERTY_SAVED') {
      if (!settings.listingGuestAccess) {
        addLog(`Pulando detalhes de 'Acesso do hóspede' (vazio)...`, 'info');
        chrome.storage.local.set({ editorStep: 'GUEST_ACCESS_SAVED' });
        return;
      }
      addLog(`Abrindo edição de 'Acesso do hóspede'...`, 'info');
      const row = findElementByText('div, span, p, button', 'Acesso do hóspede', false);
      if (row) {
        row.scrollIntoView({ block: 'center', behavior: 'smooth' });
        await sleep(500);
        row.click();
        chrome.storage.local.set({ editorStep: 'GUEST_ACCESS_EDIT_OPENED' });
        await sleep(2000);
      } else {
        addLog(`Aviso: Linha 'Acesso do hóspede' não encontrada.`, 'warning');
      }
    }
    else if (step === 'GUEST_ACCESS_EDIT_OPENED') {
      addLog(`Preenchendo detalhes de 'Acesso do hóspede'...`, 'info');
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = settings.listingGuestAccess;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        
        const saveBtn = findElementByText('button, [role="button"], a, div, span', 'Salvar', true);
        if (saveBtn) {
          saveBtn.click();
          addLog(`Detalhes de 'Acesso do hóspede' salvos com sucesso!`, 'success');
          chrome.storage.local.set({ editorStep: 'GUEST_ACCESS_SAVED' });
          await sleep(2500);
        } else {
          addLog(`Aviso: Botão Salvar de acesso não encontrado.`, 'warning');
        }
      } else {
        addLog(`Aviso: Textarea de acesso do hóspede não encontrada.`, 'warning');
      }
    }
    else if (step === 'GUEST_ACCESS_SAVED') {
      if (!settings.listingOtherDetails) {
        addLog(`Parabéns! Automação concluída com sucesso.`, 'success');
        chrome.storage.local.set({ editorStep: 'COMPLETED', isAutomating: false });
        isAutomating = false;
        updateWidgetUI();
        return;
      }
      addLog(`Abrindo edição de 'Outras informações importantes'...`, 'info');
      const row = findElementByText('div, span, p, button', 'Outras informações importantes', false);
      if (row) {
        row.scrollIntoView({ block: 'center', behavior: 'smooth' });
        await sleep(500);
        row.click();
        chrome.storage.local.set({ editorStep: 'OTHER_INFO_EDIT_OPENED' });
        await sleep(2000);
      } else {
        addLog(`Aviso: Linha 'Outras informações importantes' não encontrada.`, 'warning');
      }
    }
    else if (step === 'OTHER_INFO_EDIT_OPENED') {
      addLog(`Preenchendo detalhes de 'Outras informações importantes'...`, 'info');
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = settings.listingOtherDetails;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        
        const saveBtn = findElementByText('button, [role="button"], a, div, span', 'Salvar', true);
        if (saveBtn) {
          saveBtn.click();
          addLog(`Detalhes de 'Outras informações importantes' salvos com sucesso!`, 'success');
          chrome.storage.local.set({ editorStep: 'COMPLETED', isAutomating: false });
          addLog(`PARABÉNS! Duplicação e configurações concluídas com sucesso.`, 'success');
          isAutomating = false;
          updateWidgetUI();
        } else {
          addLog(`Aviso: Botão Salvar de outras informações não encontrado.`, 'warning');
        }
      } else {
        addLog(`Aviso: Textarea de outras informações não encontrada.`, 'warning');
      }
    }
    else if (step === 'COMPLETED') {
      // Already complete
    }
  });
}

async function editShortTermStays() {
  const elements = Array.from(document.querySelectorAll('div, span, p'));
  const label = elements.find(el => el.textContent.trim().toLowerCase() === 'estadias de curta duração' && el.children.length === 0);
  if (label) {
    let parent = label.parentElement;
    for (let i = 0; i < 4; i++) {
      if (!parent) break;
      const editBtn = Array.from(parent.querySelectorAll('button')).find(btn => btn.textContent.trim().toLowerCase().includes('editar'));
      if (editBtn) {
        editBtn.click();
        return true;
      }
      parent = parent.parentElement;
    }
  }
  return false;
}

// Initializer
function init() {
  // Load state and inject overlay
  chrome.storage.local.get([
    'isAutomating',
    'listingTitle',
    'listingInternalName',
    'listingBasePrice',
    'listingDescription',
    'listingPropertyDetails',
    'listingGuestAccess',
    'listingOtherDetails',
    'countGuests',
    'countBedrooms',
    'countBeds',
    'countBathrooms',
    'spaceType',
    'spaceCategory',
    'showExactLocation',
    'cancellationPolicy'
  ], (res) => {
    isAutomating = !!res.isAutomating;
    settings = res;
    
    // Inject widget if we are on Airbnb
    injectFloatingWidget();
    
    // Run loop
    setInterval(runAutomationCycle, 2000);
  });
  
  // Watch for storage modifications from Popup UI
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      if (changes.isAutomating) {
        isAutomating = !!changes.isAutomating.newValue;
        updateWidgetUI();
      }
      
      // Update local copy of settings
      for (const [key, change] of Object.entries(changes)) {
        settings[key] = change.newValue;
      }
      
      // Update floating widget inputs if changed externally
      const inputsMapping = {
        'w-input-title': 'listingTitle',
        'w-input-internal': 'listingInternalName',
        'w-input-price': 'listingBasePrice',
        'w-input-desc': 'listingDescription',
        'w-input-prop': 'listingPropertyDetails',
        'w-input-access': 'listingGuestAccess',
        'w-input-other': 'listingOtherDetails',
        'w-input-guests': 'countGuests',
        'w-input-rooms': 'countBedrooms',
        'w-input-beds': 'countBeds',
        'w-input-baths': 'countBathrooms'
      };
      
      Object.entries(inputsMapping).forEach(([elemId, storageKey]) => {
        const elem = document.getElementById(elemId);
        if (elem && changes[storageKey] !== undefined) {
          elem.value = changes[storageKey].newValue !== undefined ? changes[storageKey].newValue : '';
        }
      });
      
      // Reset editor step if automation restarted
      if (changes.isAutomating && changes.isAutomating.newValue === true) {
        // Find if we are currently in listing editor or wizard
        const url = window.location.href;
        if (url.includes('/hosting/listings/editor/')) {
          chrome.storage.local.set({ editorStep: 'START' });
        }
      }
    }
  });
}

// Listen to URL changes on Single Page App navigation
setInterval(() => {
  const url = window.location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    addLog(`URL alterada. Reavaliando página...`, 'info');
  }
}, 1000);

// Run initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
