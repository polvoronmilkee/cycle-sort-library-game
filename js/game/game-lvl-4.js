import "../../components/game-shelf.js";
import { CycleSort } from "../cycleSort.js";
import { ManaSystem } from "../mana-system.js";

class GameLevel4 {
  constructor() {
    this.level = 4;
    this.books = this.generatePlayableBooks(7);
    this.sortedBooks = [...this.books].sort((a, b) => a - b);
    this.hand = null;
    this.firstEmptyIndex = null;
    this.moves = 0;

    this.writes = CycleSort.sort([...this.books]).totalWrites;

    this.manaMax = 100;
    this.correctMoveCost = 5;
    this.wrongMoveCost = 20;
    this.lockedPenalty = 15;
    this.gameActive = true;
    this.manaSystem = null;

    this.init();
  }

  generateDuplicateBooks(size) {
    const baseValues = [];
    while (baseValues.length < size - 2) {
      const candidate = Math.floor(Math.random() * 20) + 1;
      if (!baseValues.includes(candidate)) {
        baseValues.push(candidate);
      }
    }

    const values = [...baseValues];
    const firstDuplicate = baseValues[Math.floor(Math.random() * baseValues.length)];
    let secondDuplicate = baseValues[Math.floor(Math.random() * baseValues.length)];

    while (secondDuplicate === firstDuplicate) {
      secondDuplicate = baseValues[Math.floor(Math.random() * baseValues.length)];
    }

    values.push(firstDuplicate, secondDuplicate);

    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }

    return values;
  }

  generatePlayableBooks(size) {
    let books = this.generateDuplicateBooks(size);
    while (CycleSort.isSorted(books)) {
      books = this.generateDuplicateBooks(size);
    }
    return books;
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

  getTargetIndices(bookValue) {
    return this.sortedBooks
      .map((value, index) => (value === bookValue ? index : null))
      .filter((index) => index !== null);
  }

  formatIndices(indices) {
    if (indices.length === 1) {
      return `index ${indices[0]}`;
    }
    return `indices ${indices.join(" or ")}`;
  }

  isCorrectSlot(bookValue, index) {
    return this.sortedBooks[index] === bookValue;
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
      const targetIndices = this.getTargetIndices(clickedValue);

      if (this.isCorrectSlot(clickedValue, clickedIndex)) {
        this.manaSystem.currentMana -= this.lockedPenalty;
        this.updateManaUI();

        if (this.manaSystem.currentMana <= 0) {
          this.gameActive = false;
          this.showFeedback(
            `Mana depleted! Moving a correct book cost you the last of your energy.`,
            "error",
          );
          this.checkWinCondition();
          return;
        }

        this.firstEmptyIndex = clickedIndex;
        this.hand = { value: clickedValue };
        this.books[clickedIndex] = null;
        this.renderBooks();
        this.updateHoldingSlot();
        this.showFeedback(
          `This book is already in the right place! Picked up ${clickedValue}. Goes to ${this.formatIndices(targetIndices)}. (-${this.lockedPenalty} mana)`,
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
        `Picked up ${clickedValue}. It belongs at ${this.formatIndices(targetIndices)}.`,
        "info",
      );
    } else {
      const targetIndices = this.getTargetIndices(this.hand.value);

      if (!this.isCorrectSlot(this.hand.value, clickedIndex)) {
        const stillHasMana = this.manaSystem.spendForWrongMove();
        this.updateManaUI();
        this.showFeedback(`Wrong spot! (-${this.wrongMoveCost} mana)`, "error");
        if (!stillHasMana) this.checkWinCondition();
        return;
      }

      if (
        clickedIndex !== this.firstEmptyIndex &&
        this.books[clickedIndex] === this.hand.value
      ) {
        this.showFeedback(
          `That slot already has ${this.hand.value}. Use the empty slot or another matching index: ${this.formatIndices(targetIndices)}.`,
          "error",
        );
        return;
      }

      this.moves++;
      this.manaSystem.spendForCorrectMove();
      this.updateManaUI();
      this.updateScoreDisplay();

      if (clickedIndex === this.firstEmptyIndex) {
        this.books[clickedIndex] = this.hand.value;
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
      (value, index) => value === this.sortedBooks[index],
    );

    if (isSorted) {
      this.gameActive = false;
      this.showFinalScore();
      this.showFeedback(`LEVEL 4 COMPLETE! Moves: ${this.moves}`, "success");
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
      window.location.href = "../index.html";
    });
    this.elements.hintBtn.addEventListener("click", () => {
      this.showFeedback(
        "Duplicate values can belong in more than one sorted slot. Follow the matching indices and avoid swapping a number into an identical number.",
        "info",
      );
    });
  }
}

document.addEventListener("DOMContentLoaded", () => new GameLevel4());
