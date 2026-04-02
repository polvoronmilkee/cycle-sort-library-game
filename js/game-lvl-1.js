import { CycleSort } from "./cycleSort.js";
import { ManaSystem } from "./mana-system.js";

class GameLevel1 {
  constructor() {
    this.level = 1;
    this.books = [3, 1, 4, 2]; // Out of order - forms cycles
    this.sortedBooks = [1, 2, 3, 4]; // Target
    this.hand = null;
    this.firstEmptyIndex = null; // Start of the active cycle chain
    this.moves = 0;
    this.parScore = CycleSort.sort(this.books).totalWrites;
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
      homeBtn: document.getElementById("home-btn"),
      feedback: document.getElementById("feedback"),
      gameTitle: document.querySelector(".game-title"),
    };
  }

  updateManaLabel() {
    this.elements.manaLabel.textContent = `Mana: ${this.manaSystem.currentMana} / ${this.manaMax}`;
  }

  updateScoreDisplay() {
    this.elements.scoreDisplay.textContent = this.parScore;
  }

  updateManaUI() {
    const percentage = (this.manaSystem.currentMana / this.manaMax) * 100;
    this.elements.manaFill.style.width = `${percentage}%`;
    this.elements.manaFill.classList.toggle(
      "low",
      percentage <= 45 && percentage > 20,
    );
    this.elements.manaFill.classList.toggle("critical", percentage <= 20);
    this.updateManaLabel();
  }

  renderBooks() {
    const display = this.elements.booksDisplay;
    display.innerHTML = this.books
      .map(
        (value, index) => `
        <div class="book ${value === null ? "placeholder" : ""}" data-index="${index}" data-value="${value}">
          ${value === null ? "_" : value}
        </div>
      `,
      )
      .join("");

    // Add click handlers to books
    display.querySelectorAll(".book").forEach((book) => {
      book.addEventListener("click", () => this.handleBookClick(book));
    });
  }

  /**
   * Calculate where a book should go based on cycle sort logic
   * Book goes to position = count of books smaller than it
   */
  calculateTrueIndex(bookValue) {
    return this.books.filter((value) => value !== null && value < bookValue)
      .length;
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
      // Start a chain only from a misplaced book.
      const pickedTrueIndex = this.calculateTrueIndex(clickedValue);
      if (pickedTrueIndex === clickedIndex) {
        this.showFeedback(
          `Book ${clickedValue} is already in the correct spot. Pick a misplaced book.`,
          "error",
        );
        return;
      }

      this.firstEmptyIndex = clickedIndex; // Remember the first hole created
      this.hand = { value: clickedValue };
      this.books[clickedIndex] = null;
      this.renderBooks();
      this.updateHoldingSlot();

      this.showFeedback(
        `Picked up ${clickedValue}. Its true index is ${pickedTrueIndex}. Click that slot to continue the chain.`,
        "info",
      );
    } else {
      // Player must place held book into its true index.
      const trueIndex = this.calculateTrueIndex(this.hand.value);

      if (clickedIndex !== trueIndex) {
        const stillHasMana = this.manaSystem.spendForWrongMove();
        this.updateManaUI();
        this.showFeedback(
          `Wrong spot. Book ${this.hand.value} belongs at index ${trueIndex}. (-${this.wrongMoveCost} mana)`,
          "error",
        );
        if (!stillHasMana) {
          this.checkWinCondition();
        }
        return;
      }

      // Place held book and spend mana for a correct move.
      this.moves++;
      this.manaSystem.spendForCorrectMove();
      this.updateManaUI();
      this.updateMoveCounter();

      // Closing step: held book belongs to the original empty hole.
      if (trueIndex === this.firstEmptyIndex) {
        this.books[trueIndex] = this.hand.value;
        this.hand = null;
        this.firstEmptyIndex = null;
        this.renderBooks();
        this.updateHoldingSlot();
        this.showFeedback(
          `Cycle closed. Continue by picking another misplaced book.`,
          "info",
        );
        this.checkWinCondition();
      } else {
        const displacedValue = this.books[clickedIndex];
        this.books[clickedIndex] = this.hand.value;
        this.hand = { value: displacedValue };
        this.renderBooks();
        this.updateHoldingSlot();

        const nextIndex = this.calculateTrueIndex(displacedValue);
        this.showFeedback(
          `Correct move (-${this.correctMoveCost} mana). Now holding ${displacedValue}. Next true index: ${nextIndex}.`,
          "info",
        );
        this.checkWinCondition();
      }
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

  updateMoveCounter() {
    // Move counter display is optional - implement if needed
  }

  checkWinCondition() {
    const isSorted = this.books.every(
      (val, idx) => val === this.sortedBooks[idx],
    );

    if (isSorted) {
      this.gameActive = false;
      const message =
        this.moves <= this.parScore
          ? `🎉 PERFECT! Sorted in ${this.moves} moves!`
          : `✓ Level Complete! ${this.moves} moves (par: ${this.parScore})`;
      this.showFeedback(message, "success");
    } else if (this.manaSystem.currentMana <= 0) {
      this.gameActive = false;
      this.showFeedback("Out of mana. Click Reset to try again.", "error");
    }
  }

  showFeedback(message, type = "info") {
    const feedback = this.elements.feedback;
    feedback.textContent = message;
    feedback.classList.remove("error", "success");
    if (type !== "info") {
      feedback.classList.add(type);
    }
    feedback.classList.add("show");
    setTimeout(() => {
      feedback.classList.remove("show");
    }, 3500);
  }

  attachEventListeners() {
    this.elements.resetBtn.addEventListener("click", () => {
      location.reload();
    });

    this.elements.hintBtn.addEventListener("click", () => {
      this.showFeedback(
        "Pick a misplaced book, place it at its true index, pick displaced book, repeat until the chain returns to the starting hole.",
        "info",
      );
    });

    this.elements.homeBtn.addEventListener("click", () => {
      window.location.href = "../index.html";
    });
  }
}

// Start the game when page loads
document.addEventListener("DOMContentLoaded", () => {
  new GameLevel1();
});
