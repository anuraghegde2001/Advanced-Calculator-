class Calculator {
    constructor() {
        this.display = document.getElementById('display');
        this.historyPanel = document.getElementById('historyPanel');
        this.historyList = document.getElementById('historyList');
        this.historyBtn = document.getElementById('historyBtn');
        this.clearHistoryBtn = document.getElementById('clearHistory');
        
        this.currentInput = '';
        this.previousInput = '';
        this.operation = null;
        this.shouldResetDisplay = false;
        this.sessionId = this.generateSessionId();
        
        this.initializeEventListeners();
        this.initializeSession();
        this.loadHistory();
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async initializeSession() {
        try {
            const response = await fetch('/api/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId: this.sessionId })
            });
            
            if (!response.ok) {
                throw new Error('Failed to initialize session');
            }
            
            const data = await response.json();
            console.log('Session initialized:', data.sessionId);
        } catch (error) {
            console.error('Session initialization error:', error);
            this.showMessage('Failed to connect to server', 'error');
        }
    }
    
    initializeEventListeners() {
        // Calculator button events
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('click', this.handleButtonClick.bind(this));
        });
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyboardInput.bind(this));
        
        // History panel events
        this.historyBtn.addEventListener('click', this.toggleHistory.bind(this));
        this.clearHistoryBtn.addEventListener('click', this.clearAllHistory.bind(this));
    }
    
    handleButtonClick(event) {
        const button = event.target;
        
        if (button.dataset.number !== undefined) {
            this.inputNumber(button.dataset.number);
        } else if (button.dataset.operation !== undefined) {
            this.inputOperation(button.dataset.operation);
        } else if (button.dataset.action !== undefined) {
            this.handleAction(button.dataset.action);
        }
    }
    
    handleKeyboardInput(event) {
        const key = event.key;
        
        if (/[0-9.]/.test(key)) {
            this.inputNumber(key);
        } else if (['+', '-', '*', '/'].includes(key)) {
            this.inputOperation(key);
        } else if (key === 'Enter' || key === '=') {
            this.handleAction('calculate');
            event.preventDefault();
        } else if (key === 'Escape') {
            this.handleAction('clear');
        } else if (key === 'Backspace') {
            this.handleAction('delete');
            event.preventDefault();
        }
    }
    
    inputNumber(number) {
        if (this.shouldResetDisplay) {
            this.currentInput = '';
            this.shouldResetDisplay = false;
        }
        
        if (number === '.' && this.currentInput.includes('.')) {
            return;
        }
        
        this.currentInput += number;
        this.updateDisplay();
    }
    
    inputOperation(operation) {
        if (this.currentInput === '' && this.previousInput === '') {
            return;
        }
        
        if (this.currentInput === '' && this.operation) {
            this.operation = operation;
            return;
        }
        
        if (this.previousInput !== '' && this.currentInput !== '' && this.operation) {
            this.calculate();
        }
        
        this.operation = operation;
        this.previousInput = this.currentInput;
        this.currentInput = '';
    }
    
    handleAction(action) {
        switch (action) {
            case 'clear':
                this.clear();
                break;
            case 'delete':
                this.delete();
                break;
            case 'calculate':
                this.calculate();
                break;
        }
    }
    
    clear() {
        this.currentInput = '';
        this.previousInput = '';
        this.operation = null;
        this.shouldResetDisplay = false;
        this.updateDisplay();
    }
    
    delete() {
        if (this.currentInput !== '') {
            this.currentInput = this.currentInput.slice(0, -1);
            this.updateDisplay();
        }
    }
    
    async calculate() {
        if (this.previousInput === '' || this.currentInput === '' || !this.operation) {
            return;
        }
        
        try {
            const expression = `${this.previousInput} ${this.operation} ${this.currentInput}`;
            const result = this.performCalculation(
                parseFloat(this.previousInput),
                parseFloat(this.currentInput),
                this.operation
            );
            
            if (result === 'Error') {
                this.showMessage('Invalid calculation', 'error');
                return;
            }
            
            // Save to database
            await this.saveCalculation(expression, result.toString());
            
            this.currentInput = result.toString();
            this.previousInput = '';
            this.operation = null;
            this.shouldResetDisplay = true;
            this.updateDisplay();
            
            // Refresh history
            this.loadHistory();
            
        } catch (error) {
            console.error('Calculation error:', error);
            this.showMessage('Calculation failed', 'error');
        }
    }
    
    performCalculation(prev, current, operation) {
        let result;
        
        switch (operation) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
                result = prev * current;
                break;
            case '/':
                if (current === 0) {
                    this.showMessage('Cannot divide by zero', 'error');
                    return 'Error';
                }
                result = prev / current;
                break;
            default:
                return 'Error';
        }
        
        // Round to avoid floating point precision issues
        return Math.round((result + Number.EPSILON) * 100000000) / 100000000;
    }
    
    async saveCalculation(expression, result) {
        try {
            const response = await fetch('/api/calculations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    expression: expression,
                    result: result,
                    operationType: this.operation
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save calculation');
            }
            
        } catch (error) {
            console.error('Save calculation error:', error);
        }
    }
    
    async loadHistory() {
        try {
            const response = await fetch(`/api/calculations/${this.sessionId}`);
            
            if (!response.ok) {
                throw new Error('Failed to load history');
            }
            
            const history = await response.json();
            this.displayHistory(history);
            
        } catch (error) {
            console.error('Load history error:', error);
        }
    }
    
    displayHistory(history) {
        this.historyList.innerHTML = '';
        
        if (history.length === 0) {
            this.historyList.innerHTML = '<div class="history-item">No calculations yet</div>';
            return;
        }
        
        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-expression">${item.expression}</div>
                <div class="history-result">= ${item.result}</div>
                <div class="history-time">${new Date(item.created_at).toLocaleString()}</div>
            `;
            
            historyItem.addEventListener('click', () => {
                this.currentInput = item.result;
                this.updateDisplay();
                this.shouldResetDisplay = true;
            });
            
            this.historyList.appendChild(historyItem);
        });
    }
    
    toggleHistory() {
        this.historyPanel.classList.toggle('hidden');
        this.historyBtn.textContent = this.historyPanel.classList.contains('hidden') ? 'History' : 'Hide';
    }
    
    async clearAllHistory() {
        if (!confirm('Are you sure you want to clear all calculation history?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/calculations/${this.sessionId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to clear history');
            }
            
            this.loadHistory();
            this.showMessage('History cleared successfully', 'success');
            
        } catch (error) {
            console.error('Clear history error:', error);
            this.showMessage('Failed to clear history', 'error');
        }
    }
    
    updateDisplay() {
        this.display.value = this.currentInput || '0';
    }
    
    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = message;
        
        const container = document.querySelector('.calculator');
        container.appendChild(messageDiv);
        
        setTimeout(() => {
            container.removeChild(messageDiv);
        }, 3000);
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});
