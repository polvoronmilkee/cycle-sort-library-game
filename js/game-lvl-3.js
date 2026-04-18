import { CycleSort } from "./cycleSort.js";
import { ManaSystem } from "./mana-system.js";

class GameLevel3 {
  constructor() {
    this.level = 3;

    this.books = this.generateRandomBooks(8);
    this.sortedBooks = [...this.books].sort((a, b) => a - b);
    this.hand = null;
    this.firstEmptyIndex = null;
    this.moves = 0;
    this.lockedIndices = this.books
      .map((val, idx) => (val === this.sortedBooks[idx] ? idx : null))
      .filter((idx) => idx !== null);

    while (this.lockedIndices.length < 2) {
      this.books = this.generateRandomBooks(8);
      this.sortedBooks = [...this.books].sort((a, b) => a - b);
      this.lockedIndices = this.books
        .map((val, idx) => (val === this.sortedBooks[idx] ? idx : null))
        .filter((idx) => idx !== null);
    }

    this.parScore = CycleSort.sort([...this.books]).totalWrites;

    this.manaMax = 100;
    this.correctMoveCost = 5;
    this.wrongMoveCost = 20;
    this.lockedPenalty = 15;

    this.gameActive = true;
    this.manaSystem = null;

    this.init();
  }

  
  generateRandomBooks(size) {
    const numbers = new Set();

    // generate random numbers
    while (numbers.size < size) {
      numbers.add(Math.floor(Math.random() * 99) + 1);
    }
    return Array.from(numbers);
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
    if (this.elements.scoreDisplay) {
      this.elements.scoreDisplay.textContent = this.parScore;
    }
  }


  renderBooks() {
    const display = this.elements.booksDisplay;

    display.innerHTML = this.books
      .map((value, index) => {
        const isLocked = this.lockedIndices.includes(index);

        return `
        <div class="book 
          ${value === null ? "placeholder" : ""} 
          ${isLocked ? "locked" : ""}" 
          data-index="${index}" 
          data-value="${value}">
          ${value === null ? "_" : value}
        </div>
      `;
      })
      .join("");

    display.querySelectorAll(".book").forEach((book) => {
      book.addEventListener("click", () => this.handleBookClick(book));
    });
  }

  calculateTrueIndex(value) {
    return this.sortedBooks.indexOf(value);
  }

  handleBookClick(bookElement) {
    if (!this.gameActive) return;

    const clickedIndex = parseInt(bookElement.dataset.index);
    const rawValue = bookElement.dataset.value;
    const clickedValue = rawValue === "null" ? null : parseInt(rawValue);

    const isLocked = this.lockedIndices.includes(clickedIndex);

    // if player picks up correct book
    if (isLocked && this.hand === null) {
      this.manaSystem.currentMana -= this.lockedPenalty;
      this.updateManaUI();

      // remove from locked list
      this.lockedIndices = this.lockedIndices.filter((i) => i !== clickedIndex);

      this.showFeedback(
        `You moved a correct book! (-${this.lockedPenalty} mana)`,
        "error",
      );
    }

    if (clickedValue === null && this.hand === null) {
      this.showFeedback("Pick up a book first.", "error");
      return;
    }

    // PICK UP
    if (this.hand === null) {
      this.firstEmptyIndex = clickedIndex;
      this.hand = { value: clickedValue };
      this.books[clickedIndex] = null;

      this.renderBooks();
      this.updateHoldingSlot();

      const trueIndex = this.calculateTrueIndex(clickedValue);
      this.showFeedback(
        `Picked up ${clickedValue}. Goes to index ${trueIndex}.`,
        "info",
      );
    }
    // PLACE
    else {
      const trueIndex = this.calculateTrueIndex(this.hand.value);

      if (clickedIndex !== trueIndex) {
        const stillHasMana = this.manaSystem.spendForWrongMove();
        this.updateManaUI();
        this.showFeedback(`Wrong spot! (-${this.wrongMoveCost} mana)`, "error");
        if (!stillHasMana) this.checkWinCondition();
        return;
      }

      // correct move
      this.moves++;
      this.manaSystem.spendForCorrectMove();
      this.updateManaUI();

      if (trueIndex === this.firstEmptyIndex) {
        // cycle closed
        this.books[trueIndex] = this.hand.value;

        // lock correct position
        if (!this.lockedIndices.includes(trueIndex)) {
          this.lockedIndices.push(trueIndex);
        }

        this.hand = null;
        this.firstEmptyIndex = null;

        this.renderBooks();
        this.updateHoldingSlot();
        this.showFeedback("Cycle closed!", "success");
      } else {
        const displaced = this.books[clickedIndex];
        this.books[clickedIndex] = this.hand.value;
        this.hand = { value: displaced };

        this.renderBooks();
        this.updateHoldingSlot();
        this.showFeedback(`Now holding ${displaced}`, "info");
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
    const isSorted = this.books.every((v, i) => v === this.sortedBooks[i]);

    if (isSorted) {
      this.gameActive = false;
      this.showFeedback(`🎉 LEVEL 3 COMPLETE! Moves: ${this.moves}`, "success");
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
    this.elements.homeBtn.addEventListener(
      "click",
      () => (window.location.href = "../index.html"),
    );
    this.elements.hintBtn.addEventListener("click", () => {
      this.showFeedback(
        "Some books are already correct—moving them will cost mana!",
        "info",
      );
    });
  }
}

document.addEventListener("DOMContentLoaded", () => new GameLevel3());
