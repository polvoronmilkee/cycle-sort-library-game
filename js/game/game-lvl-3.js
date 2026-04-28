import "../../components/game-shelf.js";
import { CycleSort } from "../cycleSort.js";
import { ManaSystem } from "../mana-system.js";

class GameLevel3 {
  constructor() {
    this.level = 3;
    const { books, sortedBooks, lockedIndices } = this.generatePlayableSetup(8);
    this.books = books;
    this.sortedBooks = sortedBooks;
    this.hand = null;
    this.firstEmptyIndex = null;
    this.moves = 0;
    this.lockedIndices = lockedIndices;

    this.writes = CycleSort.sort([...this.books]).totalWrites;

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

  generatePlayableSetup(size) {
    let books;
    let sortedBooks;
    let lockedIndices;

    do {
      books = this.generateRandomBooks(size);
      sortedBooks = [...books].sort((a, b) => a - b);
      lockedIndices = books
        .map((value, index) => (value === sortedBooks[index] ? index : null))
        .filter((index) => index !== null);
    } while (CycleSort.isSorted(books) || lockedIndices.length < 2);

    return { books, sortedBooks, lockedIndices };
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
    if (this.elements.scoreDisplay) {
      this.elements.scoreDisplay.textContent = this.moves;
    }
    if (this.elements.scoreWrite) {
      this.elements.scoreWrite.textContent = `Best: ${this.writes}`;
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
          <span class="book-value">${value === null ? "_" : value}</span>
          <span class="book-index">(${index})</span>
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

    // PICK UP LOGIC
    if (this.hand === null) {
      if (clickedValue === null) {
        this.showFeedback("Pick up a book first.", "error");
        return;
      }

      // Calculate the true index immediately to use in feedback
      const trueIndex = this.calculateTrueIndex(clickedValue);

      // PENALTY LOGIC: If player picks up a book that was already correct
      if (isLocked) {
        this.manaSystem.currentMana -= this.lockedPenalty;
        this.updateManaUI();

        this.lockedIndices = this.lockedIndices.filter(
          (i) => i !== clickedIndex,
        );

        if (this.manaSystem.currentMana <= 0) {
          this.gameActive = false;
          this.showFeedback(
            `Mana depleted! Moving a correct book cost you the last of your energy.`,
            "error",
          );
          this.checkWinCondition();
          return;
        }

        // UPDATED FEEDBACK: Matches your required format even on penalty
        this.showFeedback(
          `This book is already in the right place! Picked up ${clickedValue}. Goes to index ${trueIndex}. (-${this.lockedPenalty} mana)`,
          "error",
        );
      } else {
        // STANDARD PICKUP FEEDBACK
        this.showFeedback(
          `Picked up ${clickedValue}. Goes to index ${trueIndex}.`,
          "info",
        );
      }

      this.firstEmptyIndex = clickedIndex;
      this.hand = { value: clickedValue };
      this.books[clickedIndex] = null;

      this.renderBooks();
      this.updateHoldingSlot();
    }
    // PLACE LOGIC
    else {
      const trueIndex = this.calculateTrueIndex(this.hand.value);

      if (clickedIndex !== trueIndex) {
        const stillHasMana = this.manaSystem.spendForWrongMove();
        this.updateManaUI();
        this.showFeedback(`Wrong spot! (-${this.wrongMoveCost} mana)`, "error");
        if (!stillHasMana) this.checkWinCondition();
        return;
      }

      // Correct placement logic
      this.moves++;
      this.manaSystem.spendForCorrectMove();
      this.updateManaUI();
      this.updateScoreDisplay();

      if (trueIndex === this.firstEmptyIndex) {
        // Cycle closed
        this.books[trueIndex] = this.hand.value;
        if (!this.lockedIndices.includes(trueIndex)) {
          this.lockedIndices.push(trueIndex);
        }
        this.hand = null;
        this.firstEmptyIndex = null;
        this.showFeedback("Cycle closed!", "success");
      } else {
        // Swapping books
        const displaced = this.books[clickedIndex];
        this.books[clickedIndex] = this.hand.value;
        // Mark the newly placed book as locked/correct
        if (!this.lockedIndices.includes(trueIndex)) {
          this.lockedIndices.push(trueIndex);
        }
        this.hand = { value: displaced };
        this.showFeedback(`Now holding ${displaced}`, "info");
      }

      this.renderBooks();
      this.updateHoldingSlot();
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
    const isSorted = this.books.every((v, i) => v === this.sortedBooks[i]);

    if (isSorted) {
      this.gameActive = false;
      this.showFeedback(`🎉 LEVEL 3 COMPLETE! Moves: ${this.moves}`, "success");
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
      window.location.href = "./game-lvl-4.html";
    });
    this.elements.hintBtn.addEventListener("click", () => {
      this.showFeedback(
        "Some books are already correct—moving them will cost mana!",
        "info",
      );
    });
  }
}

document.addEventListener("DOMContentLoaded", () => new GameLevel3());
