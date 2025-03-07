document.addEventListener("DOMContentLoaded", function () {
  const pollsContainer = document.querySelector(".bottom");
  const addPollBtn = document.getElementById("add-incident");
  const popup = document.getElementById("popup-1");
  const closePopup = document.querySelector(".close-btn");
  const submitVoteBtn = document.getElementById("submit-vote");
  const deletePollBtn = document.getElementById("delete-poll");

  let polls = [
      {
          id: 1,
          title: "Do you support the new policy?",
          description: "Vote for or against the new policy"
      },
      {
          id: 2,
          title: "Should remote work be permanent?",
          description: "Vote on the future of work flexibility"
      }
  ];

  function renderPolls() {
      pollsContainer.innerHTML = "";
      polls.forEach(poll => {
          const pollCard = document.createElement("div");
          pollCard.classList.add("card");
          pollCard.id = poll.id;
          pollCard.innerHTML = `
              <div class="top-text">
                  <img class="floating" src="https://cdn.pixabay.com/photo/2018/03/04/23/37/child-3199624_640.jpg" alt="user-avatar">
                  <section>
                      <p class="title">${poll.title}</p>
                  </section>
              </div>
              <div class="bottom-text">
                  <section class="description">
                      <label>${poll.description}</label>
                      <p><span>vote</span></p>
                  </section>
              </div>
          `;
          pollsContainer.appendChild(pollCard);
      });
  }

  addPollBtn.addEventListener("click", function () {
      popup.style.display = "block";
  });

  closePopup.addEventListener("click", function () {
      popup.style.display = "none";
  });

  submitVoteBtn.addEventListener("click", function () {
      alert("Vote submitted successfully!");
  });

  deletePollBtn.addEventListener("click", function () {
      alert("Poll deleted successfully!");
  });

  renderPolls();
});
