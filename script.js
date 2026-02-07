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
        const response = await fetch('http://localhost:3000/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text, targetLang })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('intermediateText').textContent = data.translated;
            document.getElementById('backTranslatedText').textContent = data.backTranslated;
            document.getElementById('targetLangLabel').textContent = `(${data.targetLang})`;
            document.getElementById('resultsSection').style.display = 'grid';
        } else {
            alert('Translation failed: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    } finally {
        // Reset loading state
        btn.textContent = 'Back Translate';
        btn.disabled = false;
    }
});
