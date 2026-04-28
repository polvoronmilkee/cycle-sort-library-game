/**
 * Cycle Sort Algorithm
 *
 * The cycle sort algorithm minimizes the number of memory writes.
 * Each element is placed in its correct position, creating a cycle.
 */

export class CycleSort {
  /**
   * Perform cycle sort and track the steps
   * @param {number[]} array - The array to sort
   * @returns {Object} - Contains sorted array and movement history
   */
  static sort(array) {
    const arr = [...array];
    let writes = 0;

    // Loop through the array
    for (let cycleStart = 0; cycleStart < arr.length - 1; cycleStart++) {
      let item = arr[cycleStart];
      let pos = cycleStart;

      // Find position where we put the element
      for (let i = cycleStart + 1; i < arr.length; i++) {
        if (arr[i] < item) {
          pos++;
        }
      }

      // If item is already in correct position
      if (pos === cycleStart) {
        continue;
      }

      // Handle duplicates
      while (item === arr[pos]) {
        pos++;
      }

      // Put the item to its right position
      let temp = item;
      item = arr[pos];
      arr[pos] = temp;
      writes++;

      // Rotate rest of the cycle
      while (pos !== cycleStart) {
        pos = cycleStart;

        // Find position where we put the element
        for (let i = cycleStart + 1; i < arr.length; i++) {
          if (arr[i] < item) {
            pos++;
          }
        }

        // Handle duplicates
        while (item === arr[pos]) {
          pos++;
        }

        // Put the item to its right position
        temp = item;
        item = arr[pos];
        arr[pos] = temp;
        writes++;

      }
    }

    return {
      sorted: arr,
      totalWrites: writes,
    };
  }


  /**
   * Check if an array is sorted
   * @param {number[]} array - The array to check
   * @returns {boolean} - True if sorted in ascending order
   */
  static isSorted(array) {
    for (let i = 0; i < array.length - 1; i++) {
      if (array[i] > array[i + 1]) {
        return false;
      }
    }
    return true;
  }
}
