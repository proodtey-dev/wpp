// Airbnb Listing Duplicator - Popup JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const settingsForm = document.getElementById('settingsForm');
  const listingTitleInput = document.getElementById('listingTitle');
  const listingInternalNameInput = document.getElementById('listingInternalName');
  const listingBasePriceInput = document.getElementById('listingBasePrice');
  const listingDescriptionInput = document.getElementById('listingDescription');
  const listingPropertyDetailsInput = document.getElementById('listingPropertyDetails');
  const listingGuestAccessInput = document.getElementById('listingGuestAccess');
  const listingOtherDetailsInput = document.getElementById('listingOtherDetails');
  
  const countGuestsInput = document.getElementById('countGuests');
  const countBedroomsInput = document.getElementById('countBedrooms');
  const countBedsInput = document.getElementById('countBeds');
  const countBathroomsInput = document.getElementById('countBathrooms');
  
  const spaceTypeSelect = document.getElementById('spaceType');
  const spaceCategorySelect = document.getElementById('spaceCategory');
  const showExactLocationCheckbox = document.getElementById('showExactLocation');
  const cancellationPolicySelect = document.getElementById('cancellationPolicy');
  
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  
  const btnStart = document.getElementById('btnStart');
  const btnReset = document.getElementById('btnReset');
  const btnOpenHost = document.getElementById('btnOpenHost');
  const statusMessage = document.getElementById('statusMessage');

  let isAutomating = false;

  // Load existing settings
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
    
    // Fill fields
    if (res.listingTitle) listingTitleInput.value = res.listingTitle;
    if (res.listingInternalName) listingInternalNameInput.value = res.listingInternalName;
    if (res.listingBasePrice !== undefined) listingBasePriceInput.value = res.listingBasePrice;
    if (res.listingDescription) listingDescriptionInput.value = res.listingDescription;
    if (res.listingPropertyDetails) listingPropertyDetailsInput.value = res.listingPropertyDetails;
    if (res.listingGuestAccess) listingGuestAccessInput.value = res.listingGuestAccess;
    if (res.listingOtherDetails) listingOtherDetailsInput.value = res.listingOtherDetails;
    
    if (res.countGuests !== undefined) countGuestsInput.value = res.countGuests;
    if (res.countBedrooms !== undefined) countBedroomsInput.value = res.countBedrooms;
    if (res.countBeds !== undefined) countBedsInput.value = res.countBeds;
    if (res.countBathrooms !== undefined) countBathroomsInput.value = res.countBathrooms;
    
    if (res.spaceType) spaceTypeSelect.value = res.spaceType;
    if (res.spaceCategory) spaceCategorySelect.value = res.spaceCategory;
    if (res.showExactLocation !== undefined) showExactLocationCheckbox.checked = res.showExactLocation;
    if (res.cancellationPolicy) cancellationPolicySelect.value = res.cancellationPolicy;

    updateUIState();
  });

  // Listen for storage changes from background or content script (to update status reactively)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.isAutomating) {
      isAutomating = !!changes.isAutomating.newValue;
      updateUIState();
    }
  });

  // Open host creator
  btnOpenHost.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.airbnb.com.br/become-a-host' });
  });

  // Reset form
  btnReset.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja limpar todas as configurações?')) {
      settingsForm.reset();
      
      // Save defaults
      chrome.storage.local.set({
        isAutomating: false,
        listingTitle: '',
        listingInternalName: '',
        listingBasePrice: 1000,
        listingDescription: '',
        listingPropertyDetails: '',
        listingGuestAccess: '',
        listingOtherDetails: '',
        countGuests: 4,
        countBedrooms: 1,
        countBeds: 3,
        countBathrooms: 1,
        spaceType: 'Um espaço inteiro',
        spaceCategory: 'Apartamento',
        showExactLocation: false,
        cancellationPolicy: 'Restrita'
      }, () => {
        isAutomating = false;
        updateUIState();
        showNotification('Configurações redefinidas.', 'info');
      });
    }
  });

  // Save and Toggle Automation
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (isAutomating) {
      // Pause automation
      chrome.storage.local.set({ isAutomating: false }, () => {
        isAutomating = false;
        updateUIState();
        showNotification('Automação pausada.', 'info');
      });
    } else {
      // Start automation
      const settings = {
        isAutomating: true,
        listingTitle: listingTitleInput.value.trim(),
        listingInternalName: listingInternalNameInput.value.trim(),
        listingBasePrice: parseInt(listingBasePriceInput.value) || 1000,
        listingDescription: listingDescriptionInput.value.trim(),
        listingPropertyDetails: listingPropertyDetailsInput.value.trim(),
        listingGuestAccess: listingGuestAccessInput.value.trim(),
        listingOtherDetails: listingOtherDetailsInput.value.trim(),
        countGuests: parseInt(countGuestsInput.value) || 4,
        countBedrooms: parseInt(countBedroomsInput.value) || 1,
        countBeds: parseInt(countBedsInput.value) || 3,
        countBathrooms: parseFloat(countBathroomsInput.value) || 1,
        spaceType: spaceTypeSelect.value,
        spaceCategory: spaceCategorySelect.value,
        showExactLocation: showExactLocationCheckbox.checked,
        cancellationPolicy: cancellationPolicySelect.value
      };

      chrome.storage.local.set(settings, () => {
        isAutomating = true;
        updateUIState();
        showNotification('Automação iniciada! Vá para a página do Airbnb.', 'success');
        
        // Query active tab to see if it's already Airbnb become-a-host
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0];
          if (activeTab && (activeTab.url.includes('airbnb.com.br') || activeTab.url.includes('airbnb.com'))) {
            // Already on Airbnb, do nothing
          } else {
            // Offer to open Airbnb
            setTimeout(() => {
              if (confirm('Deseja abrir a página de criação de anúncios no Airbnb agora?')) {
                chrome.tabs.create({ url: 'https://www.airbnb.com.br/become-a-host' });
              }
            }, 500);
          }
        });
      });
    }
  });

  // Helper to update visual UI state
  function updateUIState() {
    if (isAutomating) {
      statusDot.className = 'status-dot active';
      statusText.textContent = 'Automação Ativa';
      btnStart.textContent = 'Pausar Automação';
      btnStart.className = 'btn-action btn-secondary'; // styled as pause
    } else {
      statusDot.className = 'status-dot';
      statusText.textContent = 'Automação Inativa';
      btnStart.textContent = 'Iniciar Automação';
      btnStart.className = 'btn-action btn-primary'; // styled as play
    }
  }

  // Helper to show status banner
  function showNotification(msg, type = 'success') {
    statusMessage.textContent = msg;
    statusMessage.className = `status-msg ${type}`;
    
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 4000);
  }
});
