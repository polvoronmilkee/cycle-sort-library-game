const modalRoot = document.getElementById("modal-root");
const playButton = document.getElementById("instructions-btn");

const loadModal = async () => {
  if (!modalRoot || !playButton) {
    return;
  }

  const response = await fetch(new URL("../components/modal.html", import.meta.url));

  if (!response.ok) {
    throw new Error(`Unable to load modal.html: ${response.status}`);
  }

  modalRoot.innerHTML = await response.text();

  const modalOverlay = document.getElementById("modal-overlay");
  const closeButton = document.getElementById("close-modal");

  const closeModal = () => {
    modalOverlay.classList.add("hidden");
    modalOverlay.setAttribute("aria-hidden", "true");
  };

  const openModal = () => {
    modalOverlay.classList.remove("hidden");
    modalOverlay.setAttribute("aria-hidden", "false");
  };

  playButton.addEventListener("click", openModal);
  closeButton.addEventListener("click", closeModal);

  modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modalOverlay.classList.contains("hidden")) {
      closeModal();
    }
  });
};

loadModal().catch((error) => {
  console.error("Failed to load modal markup:", error);
});
