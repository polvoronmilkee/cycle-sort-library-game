# The Cyclebriarian

This repository is the final project for `SE 2236: Algorithms`.

Submitted by (BSSE-2):
- `Danielle Anne Poral` 
- `Sophia Marielle Mendoza` 

## About the Project

The Cyclebriarian is a simple browser-based library sorting game. The player must arrange misplaced books into ascending order by following the logic of the `Cycle Sort` algorithm.

Our goal in this project is to turn an algorithm into an interactive system. Instead of only showing the final sorted output, the game lets the player experience how Cycle Sort works by moving each book to its correct position and completing one cycle at a time.

## How Cycle Sort is Used

Cycle Sort places an item in the index where it truly belongs, then continues with the displaced item until the cycle closes.

In our game:
- each book represents a value
- the shelf represents the array
- the player picks up a misplaced book
- the player places it in its correct index
- the displaced book is picked up next until the cycle is completed

The app also computes the `best` number of writes based on Cycle Sort, so players can compare their moves with the algorithm's efficient behavior.

## Levels

- `Level 1` introduces the basic Cycle Sort flow using simple values.
- `Level 2` adds more books and makes the arrangement more challenging.
- `Level 3` includes books that are already in the correct position, so unnecessary moves can waste mana.
- `Level 4` introduces duplicate values, so players must think carefully about valid correct positions.

## How to Open and Play

To run the project on a laptop:

1. Clone or download this repository.
2. Open the project folder in `Visual Studio Code`.
3. Install the `Live Server` extension if needed.
4. Right-click `index.html` and choose `Open with Live Server`.
5. When the browser opens, click `LET'S PLAY!` to start the game.

Alternative if `Python` is installed:

1. Open a terminal inside the project folder.
2. Run `python -m http.server 8000`
3. Open `http://localhost:8000` in a browser.

Note: We recommend using a local server instead of opening the file directly so all game features load properly.

## How to Play

- Click a book that is out of place.
- Find the index where that book should go in sorted order.
- Place it in the correct index.
- Continue moving displaced books until the cycle closes.
- Finish the level before running out of mana.

## Project Summary

This project demonstrates how `Cycle Sort` can be applied in an educational and interactive way. We designed the game so that players do not only see sorted numbers, but also understand the movement pattern, cycle closing process, and efficiency of the algorithm through gameplay.
