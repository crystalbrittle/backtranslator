const inputText = document.getElementById('inputText');
const languageSelect = document.getElementById('languageSelect');

// Load saved state
if (localStorage.getItem('savedInputText')) {
    inputText.value = localStorage.getItem('savedInputText');
}
if (localStorage.getItem('savedLanguage')) {
    languageSelect.value = localStorage.getItem('savedLanguage');
}

// Save state on change
inputText.addEventListener('input', () => {
    localStorage.setItem('savedInputText', inputText.value);
});

languageSelect.addEventListener('change', () => {
    localStorage.setItem('savedLanguage', languageSelect.value);
});

// Smart backend detection
let activeEndpoint = 'http://localhost:3000/translate';
let hasCheckedEndpoint = false;

async function translateText(payload) {
    const endpoints = ['translate.php'];

    // Only check localhost if we are running locally to avoid "local network access" popups on remote sites
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        endpoints.unshift('http://localhost:3000/translate');
    }

    // If we already found a working endpoint, try that first
    if (activeEndpoint) {
        // Move active endpoint to front
        endpoints.sort((x,y) => x == activeEndpoint ? -1 : y == activeEndpoint ? 1 : 0);
    }

    let lastError;

    for (const endpoint of endpoints) {
        try {
            console.log(`Trying endpoint: ${endpoint}`);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                 // specific error from server
                 const errData = await response.json().catch(() => ({}));
                 throw new Error(errData.error || `Server error: ${response.status}`);
            }

            const data = await response.json();
            
            // It worked! Remember this endpoint
            activeEndpoint = endpoint;
            console.log(`Success with: ${endpoint}`);
            
            return data;

        } catch (error) {
            console.warn(`Failed endpoint ${endpoint}:`, error);
            lastError = error;
            // Continue to next endpoint
        }
    }
    
    throw lastError || new Error('All translation endpoints failed');
}

document.getElementById('retranslateBtn').addEventListener('click', async () => {
    const text = inputText.value;
    const targetLang = languageSelect.value;
    const btn = document.getElementById('retranslateBtn');
    
    if (!text.trim()) {
        alert('Please enter some text to translate.');
        return;
    }

    // Set loading state
    btn.textContent = 'Back Translating...';
    btn.disabled = true;

    try {
        const data = await translateText({ text, targetLang });

        document.getElementById('intermediateText').textContent = data.translated;
        document.getElementById('backTranslatedText').textContent = data.backTranslated;
        document.getElementById('targetLangLabel').textContent = `(${data.targetLang})`;
        document.getElementById('resultsSection').style.display = 'grid';

    } catch (error) {
        console.error('Final Error:', error);
        alert('Translation failed. Please check if the server is running. ' + error.message);
    } finally {
        // Reset loading state
        btn.textContent = 'Back Translate';
        btn.disabled = false;
    }
});
