import "../../components/game-shelf.js";
import { CycleSort } from "../cycleSort.js";
import { ManaSystem } from "../mana-system.js";

class GameLevel1 {
  constructor() {
    this.level = 1;
    this.books = this.generateRandomBooks(5);   // Random order of numbers 1..5
    this.sortedBooks = [...this.books].sort((a, b) => a - b);
    this.hand = null;
    this.firstEmptyIndex = null;
    this.moves = 0;

    // Par score based on the minimal number of writes for the current permutation
    this.writes = CycleSort.sort([...this.books]).totalWrites;

    this.manaMax = 100;
    this.correctMoveCost = 5;
    this.wrongMoveCost = 20;
    this.gameActive = true;
    this.manaSystem = null;

    this.init();
  }

  // Creates a shuffled array of numbers from 1..n
  generateRandomBooks(n) {
    const arr = Array.from({ length: n }, (_, i) => i + 1);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
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
      scoreWrite: document.getElementById("score-write"),
      finalScore: document.getElementById("final-score"),
      resetBtn: document.getElementById("reset-btn"),
      hintBtn: document.getElementById("hint-btn"),
      nextLevelBtn: document.getElementById("next-level-btn"),
      homeBtn: document.getElementById("home-btn"),
      feedback: document.getElementById("feedback"),
      gameTitle: document.querySelector(".game-title"),
    };
  }

  updateManaUI() {
    const percentage = (this.manaSystem.currentMana / this.manaMax) * 100;
    this.elements.manaFill.style.width = `${percentage}%`;
    this.elements.manaLabel.textContent = `Mana: ${this.manaSystem.currentMana} / ${this.manaMax}`;
  }

  updateScoreDisplay() {
    this.elements.scoreDisplay.textContent = this.moves;
    if (this.elements.scoreWrite) {
      this.elements.scoreWrite.textContent = `Best: ${this.writes}`;
    }
  }

  getFinalStars() {
    if (this.moves <= this.writes) {
      return "⭐⭐⭐";
    }
    if (this.moves === this.writes + 1) {
      return "⭐⭐";
    }
    return "⭐";
  }

  showFinalScore() {
    if (!this.elements.finalScore) return;
    this.elements.finalScore.textContent = `Final Score: ${this.getFinalStars()}`;
    this.elements.finalScore.classList.remove("hidden");
  }

  renderBooks() {
    const display = this.elements.booksDisplay;
    display.innerHTML = this.books
      .map(
        (value, index) => `
        <div class="book ${value === null ? "placeholder" : ""}" data-index="${index}" data-value="${value}">
          <span class="book-value">${value === null ? "_" : value}</span>
          <span class="book-index">(${index})</span>
        </div>
      `,
      )
      .join("");

    display.querySelectorAll(".book").forEach((book) => {
      book.addEventListener("click", () => this.handleBookClick(book));
    });
  }

  calculateTrueIndex(bookValue) {
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
        this.showFeedback(
          `Book ${clickedValue} is correct. Find a misplaced one!`,
          "error",
        );
        return;
      }

      this.firstEmptyIndex = clickedIndex;
      this.hand = { value: clickedValue };
      this.books[clickedIndex] = null;
      this.renderBooks();
      this.updateHoldingSlot();
      this.showFeedback(
        `Picked up ${clickedValue}. It belongs at index ${pickedTrueIndex}.`,
        "info",
      );
    } else {
      const trueIndex = this.calculateTrueIndex(this.hand.value);

      if (clickedIndex !== trueIndex) {
        const stillHasMana = this.manaSystem.spendForWrongMove();
        this.updateManaUI();
        this.showFeedback(
          `Wrong spot! (-${this.wrongMoveCost} mana)`,
          "error",
        );
        if (!stillHasMana) this.checkWinCondition();
        return;
      }

      this.moves++;
      this.manaSystem.spendForCorrectMove();
      this.updateManaUI();
      this.updateScoreDisplay();

      if (trueIndex === this.firstEmptyIndex) {
        this.books[trueIndex] = this.hand.value;
        this.hand = null;
        this.firstEmptyIndex = null;
        this.renderBooks();
        this.updateHoldingSlot();
        this.showFeedback(`Cycle closed! Start the next one.`, "success");
      } else {
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
      slot.innerHTML = `<div class="book-in-hand"><span class="book-number">${this.hand.value}</span></div>`;
    } else {
      slot.classList.add("empty");
      slot.innerHTML = "";
    }
  }

  checkWinCondition() {
    const isSorted = this.books.every(
      (val, idx) => val === this.sortedBooks[idx],
    );
    if (isSorted) {
      this.gameActive = false;
      this.showFinalScore();
      this.showFeedback(`🎉 LEVEL 1 COMPLETE! Moves: ${this.moves}`, "success");
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
    this.elements.homeBtn.addEventListener(
      "click",
      () => (window.location.href = "../index.html"),
    );
    this.elements.nextLevelBtn?.addEventListener("click", () => {
      window.location.href = "./game-lvl-2.html";
    });
    this.elements.hintBtn.addEventListener("click", () => {
      this.showFeedback(
        "Pick a misplaced book, place it at its true index, pick displaced book, repeat until the chain returns to the starting hole.",
        "info",
      );
    });
  }
}

document.addEventListener("DOMContentLoaded", () => new GameLevel1());
