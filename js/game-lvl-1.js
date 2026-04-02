import { CycleSort } from "./cycleSort.js";
import { ManaSystem } from "./mana-system.js";

class GameLevel1 {
  constructor() {
    this.level = 1;
    this.sortedBooks = ["A", "B", "C", "D", "E"];
    this.books = this.createShuffledBooks(this.sortedBooks);
    this.bookArtMap = {
      A: "../assets/books/book-zero.png",
      B: "../assets/books/book-one.png",
      C: "../assets/books/book-two.png",
      D: "../assets/books/book-three.png",
      E: "../assets/books/book-four.png",
    };
    this.hand = null;
    this.firstEmptyIndex = null;
    this.moves = 0;
    this.parScore = CycleSort.sort(this.books).totalWrites;
    this.manaMax = 100;
    this.correctMoveCost = 5;
    this.wrongMoveCost = 20;
    this.gameActive = true;
    this.manaSystem = null;
    this.handbookModal = null;

    this.init();
  }

  createShuffledBooks(sourceBooks) {
    const shuffled = [...sourceBooks];

    // Keep shuffling until the starting state is not already solved.
    do {
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    } while (shuffled.every((value, index) => value === sourceBooks[index]));

    return shuffled;
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
    this.updateMoveCounter();
    this.renderBooks();
    this.attachEventListeners();
  }

  setupDOM() {
    document.body.classList.add("game-view");
  }

  async ensureHandbookModalLoaded() {
    if (this.handbookModal) {
      return true;
    }

    try {
      const response = await fetch(
        new URL("../components/modal.html", import.meta.url),
      );

      if (!response.ok) {
        throw new Error(`Unable to load handbook modal: ${response.status}`);
      }

      const wrapper = document.createElement("div");
      wrapper.innerHTML = await response.text();

      const overlay = wrapper.querySelector("#modal-overlay");
      const closeButton = wrapper.querySelector("#close-modal");

      if (!overlay || !closeButton) {
        throw new Error("Handbook modal markup is missing required elements.");
      }

      document.body.appendChild(overlay);

      const closeModal = () => {
        overlay.classList.add("hidden");
        overlay.setAttribute("aria-hidden", "true");
      };

      closeButton.addEventListener("click", closeModal);
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
          closeModal();
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !overlay.classList.contains("hidden")) {
          closeModal();
        }
      });

      this.handbookModal = { overlay, closeModal };
      return true;
    } catch (error) {
      console.error("Failed to load handbook modal:", error);
      this.showFeedback("Could not open handbook right now.", "error");
      return false;
    }
  }

  openHandbookModal() {
    if (!this.handbookModal) {
      return;
    }

    this.handbookModal.overlay.classList.remove("hidden");
    this.handbookModal.overlay.setAttribute("aria-hidden", "false");
  }

  cacheElements() {
    this.elements = {
      booksDisplay: document.getElementById("books-display"),
      holdingSlot: document.getElementById("holding-slot"),
      manaLabel: document.getElementById("mana-label"),
      manaFill: document.getElementById("mana-fill"),
      scorePar: document.getElementById("score-par"),
      moveDisplay: document.getElementById("move-display"),
      parIndicator: document.getElementById("par-indicator"),
      resetBtn: document.getElementById("reset-btn"),
      hintBtn: document.getElementById("hint-btn"),
      homeBtn: document.getElementById("home-btn"),
      feedback: document.getElementById("feedback"),
    };
  }

  updateManaLabel() {
    this.elements.manaLabel.textContent = `Mana: ${this.manaSystem.currentMana} / ${this.manaMax}`;
  }

  updateScoreDisplay() {
    this.elements.scorePar.textContent = `Best: ${this.parScore}`;
    this.updateParIndicator();
  }

  updateMoveCounter() {
    this.elements.moveDisplay.textContent = this.moves;
    this.updateParIndicator();
  }

  updateParIndicator() {
    const delta = this.moves - this.parScore;
    const indicator = this.elements.parIndicator;
    indicator.classList.remove("under", "on", "over");

    if (delta < 0) {
      indicator.textContent = `${Math.abs(delta)} Under Par`;
      indicator.classList.add("under");
      return;
    }

    if (delta === 0) {
      indicator.textContent = "On Par";
      indicator.classList.add("on");
      return;
    }

    indicator.textContent = `${delta} Over Par`;
    indicator.classList.add("over");
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
        <div class="book-slot" data-slot-index="${index}">
          <div
            class="book ${value === null ? "placeholder" : ""}"
            data-index="${index}"
            data-value="${value}"
            style="--book-art: ${value === null ? "none" : `url('${this.bookArtMap[value]}')`};"
          >
            <span class="book-letter">${value === null ? "_" : value}</span>
          </div>
          <div class="book-index" aria-hidden="true">${index}</div>
        </div>
      `,
      )
      .join("");

    display.querySelectorAll(".book").forEach((book) => {
      book.addEventListener("click", () => this.handleBookClick(book));
    });
  }

  calculateTrueIndex(bookValue) {
    return this.books.filter((value) => value !== null && value < bookValue)
      .length;
  }

  handleBookClick(bookElement) {
    if (!this.gameActive) return;

    const clickedIndex = Number.parseInt(bookElement.dataset.index, 10);
    const rawValue = bookElement.dataset.value;
    const clickedValue = rawValue === "null" ? null : rawValue;

    if (clickedValue === null && this.hand === null) {
      this.showFeedback("Pick up a book first.", "error");
      return;
    }

    if (this.hand === null) {
      const pickedTrueIndex = this.calculateTrueIndex(clickedValue);
      if (pickedTrueIndex === clickedIndex) {
        this.showFeedback(
          `Book ${clickedValue} is already in the correct spot. Pick a misplaced book.`,
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
        `Picked up ${clickedValue}. Its true index is ${pickedTrueIndex}. Click that slot to continue the chain.`,
        "info",
      );
      return;
    }

    const trueIndex = this.calculateTrueIndex(this.hand.value);

    if (clickedIndex !== trueIndex) {
      this.moves++;
      this.updateMoveCounter();
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

    this.moves++;
    this.manaSystem.spendForCorrectMove();
    this.updateManaUI();
    this.updateMoveCounter();

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
      return;
    }

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

    this.elements.hintBtn.addEventListener("click", async () => {
      const loaded = await this.ensureHandbookModalLoaded();
      if (loaded) {
        this.openHandbookModal();
      }
    });

    this.elements.homeBtn.addEventListener("click", () => {
      window.location.href = "../index.html";
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new GameLevel1();
});
