export class ManaSystem {
  constructor({
    maxMana = 100,
    correctMoveCost = 5,
    wrongMoveCost = 20,
    fillElementId = "mana-fill",
    labelElementId = "mana-label",
  } = {}) {
    this.maxMana = maxMana;
    this.currentMana = maxMana;
    this.correctMoveCost = correctMoveCost;
    this.wrongMoveCost = wrongMoveCost;

    this.fillElement = document.getElementById(fillElementId);
    this.labelElement = document.getElementById(labelElementId);

    this.render();
  }

  spendForCorrectMove() {
    this.currentMana = Math.max(0, this.currentMana - this.correctMoveCost);
    this.render();
    return this.currentMana > 0;
  }

  spendForWrongMove() {
    this.currentMana = Math.max(0, this.currentMana - this.wrongMoveCost);
    this.render();
    return this.currentMana > 0;
  }

  render() {
    if (!this.fillElement || !this.labelElement) {
      return;
    }

    const manaPercent = (this.currentMana / this.maxMana) * 100;
    this.fillElement.style.width = `${manaPercent}%`;
    this.labelElement.textContent = `Mana: ${this.currentMana} / ${this.maxMana}`;

    this.fillElement.classList.remove("low", "critical");
    if (manaPercent <= 20) {
      this.fillElement.classList.add("critical");
    } else if (manaPercent <= 50) {
      this.fillElement.classList.add("low");
    }
  }
}
