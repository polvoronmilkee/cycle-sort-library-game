import { CycleSort } from "./cycleSort";
import { ManaSystem } from "./mana-system";

class GameLevel3 {

    generateRandomBooks(size) {
        const numbers= new Set();

        // generate random numbers
        while (numbers.size < size) {
            numbers.add(Math.floor(Math.random() * 99) + 1);
        }
        return Array.from(numbers);
    }
    constructor() {
        this.level =3;

        this.books= this.generateNumberBooks(12);
        this.sortedBooks = [...this.books].sort((a,b) => a-b);
    }
}