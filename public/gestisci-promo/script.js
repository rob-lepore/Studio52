const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});
const id = params.id;


function getEventInfos() {
    fetch(`/api/events/${id}`).then(res => res.json()).then(data => {
        document.querySelector("#title").value = data.title;
        document.querySelector("#day").value = data.start.substring(0, 10);
        document.querySelector("#start").value = new Date(data.start).getHours().toString().padStart(2,0) + ":" + new Date(data.start).getMinutes().toString().padStart(2,0);
        document.querySelector("#end").value = new Date(data.end).getHours().toString().padStart(2,0) + ":" + new Date(data.end).getMinutes().toString().padStart(2,0);

        document.querySelector("#description").value = data.description;

        const artistsList = document.getElementById('artistList');
        if(data.artists.length > 0){
            const artist = data.artists[0];
            const artistItem = document.createElement('li');
            artistItem.classList.add('list-group-item');

            // Crea il contenuto dell'elemento artista
            artistItem.innerHTML = `
                <strong>Nome: ${artist.name}</strong><br>
                Utente: ${artist.username}<br>
                Email: ${artist.email}<br>
                Telefono: ${artist.phone}<br>
            `;

            let buttons = document.createElement("div"); 
            buttons.classList.add("d-flex", "mt-2", "align-items-center")

            buttons.innerHTML = `<a class="text-danger" onclick="freeEvent()">Rimuovi</a>`
            artistItem.appendChild(buttons);
            // Aggiungi l'elemento artista alla lista
            artistsList.appendChild(artistItem);

        } else {
            document.querySelector("#available-title").classList.remove("d-none")
        }

        
        console.log(data);
    })
}
getEventInfos();



document.querySelector("form").addEventListener("submit", e => {
    e.preventDefault();
    const start = document.querySelector("#day").value + "T" + document.querySelector("#start").value + ":00.000+02:00";
    const end = document.querySelector("#day").value + "T" + document.querySelector("#end").value + ":00.000+02:00";
    
    let updatedEventData = {
        title: document.querySelector("#title").value,
        start,
        end,
        description: document.querySelector("#description").value,
        allDay: false,
    }
    fetch(`/api/events/${id}/update`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEventData),
    }).then(res => res.json()).then(data => {
        alert("Dati evento aggiornati");
    })
});

document.querySelector("#deleteButton").addEventListener("click", (e) => {
    e.preventDefault();
    fetch(`/api/events/${id}`, {
        method: "DELETE"
    }).then((response) => {
        if (!response.ok) {
            throw new Error('Errore durante la richiesta di eliminazione dell\'evento');
        }
        return response.json();
    }).then((data) => {
        alert(data.message);
        location.href = "/"
    })
})

function freeEvent() {
    fetch(`/api/events/${id}/remove-reservation`, {
        method: "DELETE"
    }).then((response) => {
        if (!response.ok) {
            throw new Error('Errore durante la richiesta di eliminazione dell\'evento');
        }
        return response.json();
    }).then((data) => {
        alert("Prenotazione rimossa");
        location.href = "/";
    })
}