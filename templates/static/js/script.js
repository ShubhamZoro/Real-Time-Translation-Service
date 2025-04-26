// static/js/script.js
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const sourceLanguageSelect = document.getElementById('sourceLanguage');
    const targetLanguageSelect = document.getElementById('targetLanguage');
    const sourceTextArea = document.getElementById('sourceText');
    const translatedTextArea = document.getElementById('translatedText');
    const translateBtn = document.getElementById('translateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const historyBody = document.getElementById('historyBody');
    
    // Bootstrap modal for loading
    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    
    // Translation history array
    let translationHistory = JSON.parse(localStorage.getItem('translationHistory')) || [];
    
    // Load translation history from local storage
    function loadTranslationHistory() {
        historyBody.innerHTML = '';
        
        if (translationHistory.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="5" class="text-center text-muted">No translation history yet</td>
            `;
            historyBody.appendChild(emptyRow);
            return;
        }
        
        translationHistory.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.sourceLanguage}</td>
                <td>${item.targetLanguage}</td>
                <td class="truncate">${item.sourceText.substring(0, 30)}${item.sourceText.length > 30 ? '...' : ''}</td>
                <td class="truncate">${item.translatedText.substring(0, 30)}${item.translatedText.length > 30 ? '...' : ''}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary restore-btn" data-index="${index}">
                        <i class="fas fa-redo-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            historyBody.appendChild(row);
        });
        
        // Add event listeners to restore and delete buttons
        document.querySelectorAll('.restore-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                restoreTranslation(index);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                deleteTranslation(index);
            });
        });
    }
    
    // Restore translation from history
    function restoreTranslation(index) {
        const item = translationHistory[index];
        sourceLanguageSelect.value = item.sourceLanguage;
        targetLanguageSelect.value = item.targetLanguage;
        sourceTextArea.value = item.sourceText;
        translatedTextArea.value = item.translatedText;
    }
    
    // Delete translation from history
    function deleteTranslation(index) {
        translationHistory.splice(index, 1);
        localStorage.setItem('translationHistory', JSON.stringify(translationHistory));
        loadTranslationHistory();
    }
    
    // Add translation to history
    function addToHistory(sourceLanguage, targetLanguage, sourceText, translatedText) {
        translationHistory.unshift({
            sourceLanguage,
            targetLanguage,
            sourceText,
            translatedText,
            timestamp: new Date().toISOString()
        });
        
        // Keep only the latest 10 translations
        if (translationHistory.length > 10) {
            translationHistory.pop();
        }
        
        localStorage.setItem('translationHistory', JSON.stringify(translationHistory));
        loadTranslationHistory();
    }
    
    // Translate text function
    async function translateText() {
        const sourceLanguage = sourceLanguageSelect.value;
        const targetLanguage = targetLanguageSelect.value;
        const sourceText = sourceTextArea.value.trim();
        
        // Input validation
        if (!sourceText) {
            alert('Please enter text to translate.');
            return;
        }
        
        // Show loading modal
        loadingModal.show();
        
        try {
            const response = await fetch('/translate/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: sourceText,
                    source_language: sourceLanguage,
                    target_language: targetLanguage
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                translatedTextArea.value = data.translated_text;
                
                // Add to translation history
                addToHistory(sourceLanguage, targetLanguage, sourceText, data.translated_text);
            } else {
                alert(`Translation error: ${data.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to connect to the translation service. Please try again later.');
        } finally {
            // Hide loading modal
            loadingModal.hide();
        }
    }
    
    // Event listeners
    translateBtn.addEventListener('click', translateText);
    
    copyBtn.addEventListener('click', function() {
        translatedTextArea.select();
        document.execCommand('copy');
        
        // Visual feedback
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        }, 2000);
    });
    
    // Swap languages button
    document.getElementById('translateBtn').addEventListener('dblclick', function() {
        const sourceValue = sourceLanguageSelect.value;
        const targetValue = targetLanguageSelect.value;
        
        sourceLanguageSelect.value = targetValue;
        targetLanguageSelect.value = sourceValue;
        
        // Also swap text if there's translated text
        if (translatedTextArea.value) {
            sourceTextArea.value = translatedTextArea.value;
            translatedTextArea.value = '';
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to translate
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            translateText();
        }
    });
    
    // Initialize history
    loadTranslationHistory();
});