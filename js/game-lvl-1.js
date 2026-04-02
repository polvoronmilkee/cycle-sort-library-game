import { CycleSort } from "./cycleSort.js";

class GameLevel1 {
  constructor() {
    this.level = 1;
    this.books = [3, 1, 4, 2]; // Out of order
    this.sortedBooks = [1, 2, 3, 4]; // Target
    this.hand = null;
    this.moves = 0;
    this.parScore = 5; // Perfect score for this level
    this.maxMoves = 8; // Allowed moves
    this.gameActive = true;

    this.init();
  }

  init() {
    this.setupDOM();
    this.renderBooks();
    this.attachEventListeners();
  }

  setupDOM() {
    document.body.classList.add("game-view");
    const main = document.querySelector("main") || document.body;
    main.innerHTML = `
      <div class="game-container">
        <div class="game-header">
          <h1 class="game-title">LEVEL ${this.level}: THE ARCHIVE</h1>
          <div class="level-info">Moves: <span id="move-counter">0</span> / ${this.maxMoves}</div>
        </div>

        <div class="game-main">
          <!-- Left: Holding Slot -->
          <div class="sidebar">
            <div class="sidebar-label">Holding Slot</div>
            <div id="holding-slot" class="holding-slot empty"></div>
            <div class="sidebar-label" style="margin-top: 20px;">Mana Bar</div>
            <div id="mana-bar" class="mana-bar">
              ${Array(this.maxMoves)
                .fill(0)
                .map((_, i) => `<div class="mana-slot" id="mana-${i}"></div>`)
                .join("")}
            </div>
          </div>

          <!-- Center: Shelf -->
          <div class="shelf-area">
            <div class="shelf-container">
              <div id="books-display" class="books-display"></div>
            </div>
          </div>

          <!-- Right: Par Score -->
          <div class="par-score">
            <div class="score-display">
              <div class="score-label">Par Score</div>
              <div class="score-value" id="score-display">5</div>
              <div class="score-par">Best: ${this.parScore}</div>
            </div>
          </div>
        </div>

        <div class="game-footer">
          <button class="btn-game secondary" id="reset-btn">Reset</button>
          <button class="btn-game secondary" id="hint-btn">How To Play</button>
          <button class="btn-game" id="home-btn">Back to Menu</button>
        </div>
      </div>

      <div id="feedback" class="feedback"></div>
    `;
  }

  renderBooks() {
    const display = document.getElementById("books-display");
    display.innerHTML = this.books
      .map(
        (value, index) => `
        <div class="book" data-index="${index}" data-value="${value}">
          ${value}
        </div>
      `,
      )
      .join("");

    // Add click handlers to books
    document.querySelectorAll(".book").forEach((book) => {
      book.addEventListener("click", () => this.handleBookClick(book));
    });
  }

  handleBookClick(bookElement) {
    if (!this.gameActive) return;

    const index = parseInt(bookElement.dataset.index);
    const value = parseInt(bookElement.dataset.value);

    if (this.hand === null) {
      // Pick up a book
      this.hand = { value, index };
      bookElement.classList.add("selected");
      this.updateHoldingSlot();
      this.showFeedback(`Picked up: ${value}`, "info");
    } else {
      // Swap with another book
      this.swapBooks(this.hand.index, index);
      this.hand = { value: parseInt(bookElement.dataset.value), index };
      this.moves++;
      this.updateManaBar();
      this.updateMoveCounter();
      this.renderBooks();
      this.checkWinCondition();
    }
  }

  swapBooks(fromIndex, toIndex) {
    const temp = this.books[fromIndex];
    this.books[fromIndex] = this.books[toIndex];
    this.books[toIndex] = temp;
  }

  updateHoldingSlot() {
    const slot = document.getElementById("holding-slot");
    if (this.hand) {
      slot.classList.remove("empty");
      slot.innerHTML = `<div class="book-in-hand">${this.hand.value}</div>`;
    } else {
      slot.classList.add("empty");
      slot.innerHTML = "";
    }
  }

  updateManaBar() {
    for (let i = 0; i < this.moves && i < this.maxMoves; i++) {
      document.getElementById(`mana-${i}`).classList.add("used");
    }
  }

  updateMoveCounter() {
    document.getElementById("move-counter").textContent = this.moves;
  }

  checkWinCondition() {
    const isSorted = this.books.every(
      (val, idx) => val === this.sortedBooks[idx],
    );

    if (isSorted) {
      this.gameActive = false;
      const message =
        this.moves <= this.parScore
          ? `🎉 PERFECT! You sorted in ${this.moves} moves!`
          : `✓ Level Complete! You used ${this.moves} moves (par: ${this.parScore})`;
      this.showFeedback(message, "success");
    } else if (this.moves >= this.maxMoves) {
      this.gameActive = false;
      this.showFeedback("❌ Out of moves! Click Reset to try again.", "error");
    }
  }

  showFeedback(message, type = "info") {
    const feedback = document.getElementById("feedback");
    feedback.textContent = message;
    feedback.classList.remove("error", "success");
    if (type !== "info") {
      feedback.classList.add(type);
    }
    feedback.classList.add("show");
    setTimeout(() => {
      feedback.classList.remove("show");
    }, 2500);
  }

  attachEventListeners() {
    document.getElementById("reset-btn").addEventListener("click", () => {
      location.reload();
    });

    document.getElementById("hint-btn").addEventListener("click", () => {
      this.showFeedback(
        "Count smaller books. Swap them into their true position.",
        "info",
      );
    });

    document.getElementById("home-btn").addEventListener("click", () => {
      window.location.href = "../index.html";
    });
  }
}

// Start the game when page loads
document.addEventListener("DOMContentLoaded", () => {
  new GameLevel1();
});
