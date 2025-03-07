let incidents = [
  {
      id: 1,
      title: "Fire in Downtown",
      description: "A massive fire broke out in the city center.",
      imageUrl: "https://via.placeholder.com/150",
      authorPic: "https://cdn.pixabay.com/photo/2021/11/05/12/25/woman-6771278_640.jpg",
  },
];

let role = "citizen";

function renderIncidents() {
  const incidentList = document.getElementById("incident-list");
  incidentList.innerHTML = "";

  incidents.forEach((incident) => {
      let card = document.createElement("div");
      card.classList.add("card");
      card.setAttribute("id", incident.id);

      card.innerHTML = `
          <div class="top-image">
              <img src="${incident.imageUrl}" alt="header-image">
              <img class="floating" src="${incident.authorPic}" alt="user-avatar">
          </div>
          <div class="bottom-text">
              <p class="heading">
                  <label>${incident.title}</label>
                  <span>New</span>
              </p>
              <p class="description">
                  <label>${incident.description}</label>
                  <span> Created ${incident.createdAt}</span>
              </p>
          </div>
      `;

      card.addEventListener("click", () => viewIncident(incident));
      incidentList.appendChild(card);
  });
}

function viewIncident(incident) {
  document.getElementById("brief").style.display = "none";
  document.getElementById("detailed").style.display = "block";

  document.getElementById("incident-title").textContent = incident.title;
  document.getElementById("incident-description").textContent = incident.description;
  document.getElementById("incident-author").textContent = `By ${incident.author}`;
  document.getElementById("incident-author-pic").src = incident.authorPic;


  document.getElementById("privileges").style.display = role === "citizen" || role === "govt official" ? "flex" : "none";
  document.getElementById("official-actions").style.display = role === "official" ? "block" : "none";
}

function addIncident() {
  togglePopup("popup-1");
}

function submitIncident() {
  let newIncident = {
      id: incidents.length + 1,
      title: document.getElementById("title").value,
      description: document.getElementById("description").value,
      createdAt: "Just now",
      imageUrl: document.getElementById("imageUrl").value || "https://via.placeholder.com/150",
      author: "Anonymous",
      authorPic: "https://cdn.pixabay.com/photo/2021/11/05/12/25/woman-6771278_640.jpg",
  };

  incidents.push(newIncident);
  renderIncidents();
  togglePopup("popup-1");
}

function getSummary() {
  togglePopup("popup-2");
}

function togglePopup(id) {
  let popup = document.getElementById(id);
  popup.style.display = popup.style.display === "none" || popup.style.display === "" ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", renderIncidents);
