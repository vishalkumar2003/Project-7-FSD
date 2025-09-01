class CodeBreakerGame {
    constructor() {
        this.array = [3, 1, 7, null, 2, 1, 4, 9];
        this.maxSize = 10;
        this.targetPattern = [];
        this.level = 1;
        this.timer = 60;
        this.gameActive = false;
        this.timerInterval = null;

        this.initializeGame();
        this.bindEvents();
        this.generateTargetPattern();
        this.renderArray();
        this.updateDisplay();
    }

    initializeGame() {
        this.gameActive = true;
        this.startTimer();
    }

    bindEvents() {
        document.getElementById('insert-btn').addEventListener('click', () => this.handleInsert());
        document.getElementById('delete-btn').addEventListener('click', () => this.handleDelete());
        document.getElementById('search-btn').addEventListener('click', () => this.handleSearch());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetArray());
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('play-again-btn').addEventListener('click', () => this.newGame());

        // Enter key support
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const activeElement = document.activeElement;
                if (activeElement.id === 'insert-value' || activeElement.id === 'insert-index') {
                    this.handleInsert();
                } else if (activeElement.id === 'delete-index') {
                    this.handleDelete();
                } else if (activeElement.id === 'search-pattern') {
                    this.handleSearch();
                }
            }
        });
    }

    generateTargetPattern() {
        const patternLength = this.level === 1 ? 2 : 3;
        this.targetPattern = [];
        for (let i = 0; i < patternLength; i++) {
            this.targetPattern.push(Math.floor(Math.random() * 10));
        }
        this.updateTargetDisplay();
    }

    updateTargetDisplay() {
        const targetElement = document.getElementById('target-pattern');
        targetElement.textContent = `[${this.targetPattern.join(', ')}]`;
    }

    updateDisplay() {
        document.getElementById('level').textContent = this.level;
        document.getElementById('timer').textContent = this.timer;
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer--;
            this.updateDisplay();

            if (this.timer <= 0) {
                this.gameOver(false);
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    renderArray() {
        const arrayDisplay = document.getElementById('array-display');
        arrayDisplay.innerHTML = '';

        this.array.forEach((value, index) => {
            const cell = document.createElement('div');
            cell.className = 'array-cell';
            cell.dataset.index = index;

            if (value === null) {
                cell.classList.add('empty');
                cell.textContent = '';
            } else {
                cell.textContent = value;
            }

            arrayDisplay.appendChild(cell);
        });
    }

    showFeedback(message, type = 'normal') {
        const feedback = document.getElementById('feedback');
        feedback.textContent = message;
        feedback.className = `feedback ${type}`;

        // Play sound effect based on type
        this.playSound(type);
    }

    playSound(type) {
        // Create audio context for sound effects
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            switch (type) {
                case 'success':
                    // Victory fanfare
                    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
                    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
                    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
                    break;
                case 'error':
                    // Error buzz
                    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
                    oscillator.type = 'sawtooth';
                    break;
                default:
                    // Beep on insert/normal operations
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                    break;
            }

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // Fallback if audio context is not supported
            console.log('Audio not supported');
        }
    }

    handleInsert() {
        if (!this.gameActive) return;

        const indexInput = document.getElementById('insert-index');
        const valueInput = document.getElementById('insert-value');
        const index = parseInt(indexInput.value);
        const value = parseInt(valueInput.value);

        if (isNaN(index) || isNaN(value)) {
            this.showFeedback('Please enter valid numbers!', 'error');
            return;
        }

        if (index < 0 || index > this.array.length) {
            this.showFeedback('Index out of bounds!', 'error');
            return;
        }

        if (this.array.filter(x => x !== null).length >= this.maxSize) {
            this.showFeedback('Array is full!', 'error');
            return;
        }

        this.insertAtIndex(index, value);
        this.showFeedback(`Inserted ${value} at index ${index}!`, 'success');

        // Clear inputs
        valueInput.value = '';
        indexInput.focus();
    }

    handleDelete() {
        if (!this.gameActive) return;

        const indexInput = document.getElementById('delete-index');
        const index = parseInt(indexInput.value);

        if (isNaN(index)) {
            this.showFeedback('Please enter a valid index!', 'error');
            return;
        }

        if (index < 0 || index >= this.array.length || this.array[index] === null) {
            this.showFeedback('Nothing to delete at this index!', 'error');
            return;
        }

        this.deleteAtIndex(index);
        this.showFeedback(`Deleted element at index ${index}.`, 'success');

        // Clear input
        indexInput.value = '';
        indexInput.focus();
    }

    handleSearch() {
        if (!this.gameActive) return;

        const patternInput = document.getElementById('search-pattern');
        const patternStr = patternInput.value.trim();

        if (!patternStr) {
            this.showFeedback('Enter a valid pattern (e.g., 1,2,3)', 'warning');
            return;
        }

        const pattern = patternStr.split(',').map(x => parseInt(x.trim()));

        if (pattern.some(isNaN)) {
            this.showFeedback('Invalid pattern format! Use numbers separated by commas.', 'error');
            return;
        }

        this.searchPattern(pattern);
    }

    insertAtIndex(index, value) {
        // Add animation class to existing elements that will shift
        const cells = document.querySelectorAll('.array-cell');
        for (let i = index; i < cells.length; i++) {
            if (this.array[i] !== null) {
                cells[i].classList.add('sliding-right');
            }
        }

        // Insert the value
        this.array.splice(index, 0, value);

        // Ensure array doesn't exceed max size
        if (this.array.length > this.maxSize) {
            this.array = this.array.slice(0, this.maxSize);
        }

        // Re-render after animation delay
        setTimeout(() => {
            this.renderArray();
            const newCell = document.querySelector(`[data-index="${index}"]`);
            if (newCell) {
                newCell.classList.add('inserting');
            }
        }, 100);
    }

    deleteAtIndex(index) {
        // Add animation to the cell being deleted
        const cells = document.querySelectorAll('.array-cell');
        if (cells[index]) {
            cells[index].classList.add('deleting');
        }

        // Add sliding animation to elements that will shift left
        for (let i = index + 1; i < cells.length; i++) {
            if (this.array[i] !== null) {
                cells[i].classList.add('sliding-left');
            }
        }

        // Remove the element
        this.array.splice(index, 1);

        // Add null to maintain array size
        this.array.push(null);

        // Re-render after animation delay
        setTimeout(() => {
            this.renderArray();
        }, 300);
    }

    async searchPattern(pattern) {
        const cleanArray = this.array.filter(x => x !== null);
        let found = false;
        let foundIndex = -1;

        this.showFeedback(`Searching for pattern [${pattern.join(', ')}]...`, 'warning');

        // Animate search process
        for (let i = 0; i <= cleanArray.length - pattern.length; i++) {
            // Highlight current search position
            this.highlightCells(i, pattern.length, 'searching');

            await this.delay(500);

            // Check if pattern matches
            let matches = true;
            for (let j = 0; j < pattern.length; j++) {
                if (cleanArray[i + j] !== pattern[j]) {
                    matches = false;
                    break;
                }
            }

            if (matches) {
                found = true;
                foundIndex = i;
                this.highlightCells(i, pattern.length, 'found');
                break;
            } else {
                this.clearHighlights();
            }
        }

        if (found) {
            this.showFeedback(`Pattern found at index ${foundIndex}!`, 'success');

            // Check if it's the target pattern
            if (this.arraysEqual(pattern, this.targetPattern)) {
                this.levelComplete();
            }
        } else {
            this.showFeedback('Pattern not found in the array.', 'warning');
            this.clearHighlights();
        }
    }

    highlightCells(startIndex, length, className) {
        this.clearHighlights();
        const cells = document.querySelectorAll('.array-cell');

        let actualIndex = 0;
        for (let i = 0; i < this.array.length; i++) {
            if (this.array[i] !== null) {
                if (actualIndex >= startIndex && actualIndex < startIndex + length) {
                    cells[i].classList.add(className);
                }
                actualIndex++;
            }
        }
    }

    clearHighlights() {
        const cells = document.querySelectorAll('.array-cell');
        cells.forEach(cell => {
            cell.classList.remove('highlight', 'found', 'searching');
        });
    }

    arraysEqual(arr1, arr2) {
        return arr1.length === arr2.length && arr1.every((val, i) => val === arr2[i]);
    }

    async levelComplete() {
        this.showFeedback(`🎉 Level ${this.level} Complete! Pattern [${this.targetPattern.join(', ')}] found!`, 'success');

        // Add victory effect
        document.querySelector('.array-display').classList.add('victory-effect');

        await this.delay(2000);

        // Advance to next level
        this.level++;
        if (this.level <= 3) {
            this.nextLevel();
        } else {
            this.gameWon();
        }
    }

    nextLevel() {
        this.timer = 60;
        this.generateTargetPattern();
        this.resetArray();
        this.showFeedback(`Level ${this.level} started! Find pattern [${this.targetPattern.join(', ')}]`, 'success');
        document.querySelector('.array-display').classList.remove('victory-effect');
        this.updateDisplay();
    }

    gameWon() {
        this.stopTimer();
        this.gameActive = false;
        const modal = document.getElementById('game-over-modal');
        document.getElementById('modal-title').textContent = '🏆 Congratulations!';
        document.getElementById('modal-message').textContent = 'You\'ve completed all levels! You are now a master code breaker!';
        modal.style.display = 'flex';
    }

    gameOver(won = false) {
        this.stopTimer();
        this.gameActive = false;
        const modal = document.getElementById('game-over-modal');

        if (won) {
            document.getElementById('modal-title').textContent = '🎉 Victory!';
            document.getElementById('modal-message').textContent = `You cracked the code in ${60 - this.timer} seconds!`;
        } else {
            document.getElementById('modal-title').textContent = '⏰ Time\'s Up!';
            document.getElementById('modal-message').textContent = 'The vault remains locked. Try again, hacker!';
        }

        modal.style.display = 'flex';
    }

    newGame() {
        this.stopTimer();
        this.level = 1;
        this.timer = 60;
        this.gameActive = true;
        this.array = [3, 1, 7, null, 2, 1, 4, 9];
        this.generateTargetPattern();
        this.renderArray();
        this.updateDisplay();
        this.showFeedback('New game started! Find the hidden pattern to crack the code!');
        document.getElementById('game-over-modal').style.display = 'none';
        document.querySelector('.array-display').classList.remove('victory-effect');
        this.startTimer();
    }

    resetArray() {
        this.array = [3, 1, 7, null, 2, 1, 4, 9];
        this.renderArray();
        this.clearHighlights();
        this.showFeedback('Array reset to initial state.', 'warning');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CodeBreakerGame();
});