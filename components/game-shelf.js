const SHELF_TAG_NAME = "game-shelf";

if (!customElements.get(SHELF_TAG_NAME)) {
  class GameShelf extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;

      const shadowRoot = this.attachShadow({ mode: "open" });

      shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100%;
            --shelf-bg: #b57a43;
            --shelf-dark: #7b4a24;
            --shelf-line: rgba(0, 0, 0, 0.18);
          }

          .cabinet {
            background: var(--shelf-bg);
            border: 4px solid var(--shelf-dark);
            box-shadow: 0 8px 18px rgba(0, 0, 0, 0.2);
            padding: 12px;
            min-height: 280px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            box-sizing: border-box;
          }

          .shelf-row {
            flex: 1;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.08);
            position: relative;
            display: flex;
            align-items: center;
            padding: 8px 10px;
            overflow: hidden;
          }

          .shelf-row::before {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            height: 10px;
            background: var(--shelf-dark);
          }

          .shelf-row::after {
            content: "";
            position: absolute;
            inset: 0;
            border: 1px solid var(--shelf-line);
            border-radius: 6px;
          }

          .books-row {
            display: flex;
            gap: 8px;
            align-items: flex-end;
            height: 100%;
            width: 100%;
          }

          .book {
            width: 22px;
            border-radius: 3px 3px 0 0;
            background: #d9b07a;
            box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.18);
            flex-shrink: 0;
          }

          .book.tall { 
            height: 72px; 
            background: #c88937; 
            box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.18), 
            inset 0 -8px 0 rgba(0, 0, 0, 0.1);    
            border: 1px solid #000000;
            }

          .book.dark { background: #9a5a2f; }
          .book.green { background: #6c8a4b; }
          .book.red { background: #b85b4e; }
          .book.light { background: #c88937; }

          .shelf-content {
            position: relative;
            z-index: 1;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            padding: 0.5rem 0;
            box-sizing: border-box;
          }

          .middle-shelf .shelf-content {
            justify-content: center;
          }

          ::slotted(.books-display) {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            padding: 0.5rem 0;
            box-sizing: border-box;
          }
        </style>

        <div class="cabinet" part="cabinet">
          <div class="shelf-row">
            <div class="shelf-content books-row">
              <div class="book tall"></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
            </div>
          </div>

          <div class="shelf-row middle-shelf">
            <div class="shelf-content">
              <slot></slot>
            </div>
          </div>

          <div class="shelf-row">
            <div class="shelf-content books-row">
              <div class="book tall"></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
              <div class="book tall "></div>
                                  
            </div>
          </div>
        </div>
      `;
    }
  }

  customElements.define(SHELF_TAG_NAME, GameShelf);
}
