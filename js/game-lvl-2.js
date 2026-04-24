import { CycleSort } from "./cycleSort.js";
import { ManaSystem } from "./mana-system.js";

class GameLevel2 {
  constructor() {
    this.level = 2;
    this.books = [3, 1, 2, 6, 4, 5]; 
    this.sortedBooks = [1, 2, 3, 4, 5, 6]; 
    this.hand = null;
    this.firstEmptyIndex = null;
    this.moves = 0;
    
    // Par Score will naturally be higher for more cycles
    this.parScore = CycleSort.sort([...this.books]).totalWrites;
    
    this.manaMax = 100;
    this.correctMoveCost = 5;
    this.wrongMoveCost = 20;
    this.gameActive = true;
    this.manaSystem = null;

    this.init();
  }

  init() {
    this.setupDOM();
    this.cacheElements();
    this.manaSystem = new ManaSystem({
      maxMana: this.manaMax,
      correctMoveCost: this.correctMoveCost,
      wrongMoveCost: this.wrongMoveCost,
    });
    this.updateManaUI(); 
    this.updateScoreDisplay();
    this.renderBooks();
    this.attachEventListeners();
  }

  setupDOM() {
    document.body.classList.add("game-view");
  }

  cacheElements() {
    this.elements = {
      booksDisplay: document.getElementById("books-display"),
      holdingSlot: document.getElementById("holding-slot"),
      manaLabel: document.getElementById("mana-label"),
      manaFill: document.getElementById("mana-fill"),
      scoreDisplay: document.getElementById("score-display"),
      resetBtn: document.getElementById("reset-btn"),
      hintBtn: document.getElementById("hint-btn"),
      nextLevelBtn: document.getElementById("next-level-btn"),
      homeBtn: document.getElementById("home-btn"),
      feedback: document.getElementById("feedback"),
    };
  }

  updateManaUI() {
    const percentage = (this.manaSystem.currentMana / this.manaMax) * 100;
    this.elements.manaFill.style.width = `${percentage}%`;
    this.elements.manaLabel.textContent = `Mana: ${this.manaSystem.currentMana} / ${this.manaMax}`;
  }

  updateScoreDisplay() {
    this.elements.scoreDisplay.textContent = this.parScore;
  }

  renderBooks() {
    const display = this.elements.booksDisplay;
    display.innerHTML = this.books
      .map((value, index) => `
        <div class="book ${value === null ? "placeholder" : ""}" data-index="${index}" data-value="${value}">
          ${value === null ? "_" : value}
        </div>
      `).join("");

    display.querySelectorAll(".book").forEach((book) => {
      book.addEventListener("click", () => this.handleBookClick(book));
    });
  }

  calculateTrueIndex(bookValue) {
    // index = count of items smaller than current
    return this.sortedBooks.indexOf(bookValue);
  }

  handleBookClick(bookElement) {
    if (!this.gameActive) return;

    const clickedIndex = parseInt(bookElement.dataset.index);
    const rawValue = bookElement.dataset.value;
    const clickedValue = rawValue === "null" ? null : parseInt(rawValue);

    if (clickedValue === null && this.hand === null) {
      this.showFeedback("Pick up a book first.", "error");
      return;
    }

    if (this.hand === null) {
      const pickedTrueIndex = this.calculateTrueIndex(clickedValue);
      if (pickedTrueIndex === clickedIndex) {
        this.showFeedback(`Book ${clickedValue} is correct. Find a misplaced one!`, "error");
        return;
      }

      this.firstEmptyIndex = clickedIndex;
      this.hand = { value: clickedValue };
      this.books[clickedIndex] = null;
      this.renderBooks();
      this.updateHoldingSlot();
      this.showFeedback(`Picked up ${clickedValue}. It belongs at index ${pickedTrueIndex}.`, "info");
    } else {
      const trueIndex = this.calculateTrueIndex(this.hand.value);

      if (clickedIndex !== trueIndex) {
        // WRONG INDEX - Deplete 20 Mana
        const stillHasMana = this.manaSystem.spendForWrongMove();
        this.updateManaUI();
        this.showFeedback(`Wrong spot! (-${this.wrongMoveCost} mana)`, "error");
        if (!stillHasMana) this.checkWinCondition();
        return;
      }

      // CORRECT INDEX - Deplete 5 Mana
      this.moves++;
      this.manaSystem.spendForCorrectMove();
      this.updateManaUI();

      if (trueIndex === this.firstEmptyIndex) {
        // Cycle finished
        this.books[trueIndex] = this.hand.value;
        this.hand = null;
        this.firstEmptyIndex = null;
        this.renderBooks();
        this.updateHoldingSlot();
        this.showFeedback(`Cycle closed! Start the next one.`, "success");
      } else {
        // Swap continue
        const displacedValue = this.books[clickedIndex];
        this.books[clickedIndex] = this.hand.value;
        this.hand = { value: displacedValue };
        this.renderBooks();
        this.updateHoldingSlot();
        this.showFeedback(`Correct! Now holding ${displacedValue}.`, "info");
      }
      this.checkWinCondition();
    }
  }

  updateHoldingSlot() {
    const slot = this.elements.holdingSlot;
    if (this.hand) {
      slot.classList.remove("empty");
      slot.innerHTML = `<div class="book-in-hand"><span>${this.hand.value}</span></div>`;
    } else {
      slot.classList.add("empty");
      slot.innerHTML = "";
    }
  }

  checkWinCondition() {
    const isSorted = this.books.every((val, idx) => val === this.sortedBooks[idx]);
    if (isSorted) {
      this.gameActive = false;
      this.showFeedback(`🎉 LEVEL 2 COMPLETE! Moves: ${this.moves}`, "success");
      this.elements.nextLevelBtn?.classList.remove("hidden");
    } else if (this.manaSystem.currentMana <= 0) {
      this.gameActive = false;
      this.showFeedback("Out of mana! Library collapsed.", "error");
    }
  }

  showFeedback(message, type = "info") {
    const feedback = this.elements.feedback;
    feedback.textContent = message;
    feedback.className = `feedback show ${type}`;
    setTimeout(() => feedback.classList.remove("show"), 3000);
  }

  attachEventListeners() {
    this.elements.resetBtn.addEventListener("click", () => location.reload());
    this.elements.homeBtn.addEventListener("click", () => window.location.href = "../index.html");
    this.elements.nextLevelBtn?.addEventListener("click", () => {
      window.location.href = "./game-lvl-3.html";
    });
    this.elements.hintBtn.addEventListener("click", () => {
        this.showFeedback("Finish the first cycle, then pick a book from the remaining messy section.", "info");
    });
  }
}

document.addEventListener("DOMContentLoaded", () => new GameLevel2());