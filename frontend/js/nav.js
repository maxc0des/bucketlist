const tabs = document.querySelectorAll(".tab");
const current = window.location.pathname.split("/").pop();

tabs.forEach(tab => {
  if (tab.getAttribute("href") === current) {
    tab.classList.add("active");
  }
});