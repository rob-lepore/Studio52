const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});
const id = params.id;

function choose(artistIdToKeep) {
    fetch(`/api/events/${id}/set-chosen`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ artistIdToKeep }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Errore durante la richiesta di impostazione di chosen su false');
            }
            return response.json();
        })
        .then((data) => {
            location.reload();
        })
}

function deleteArtist(artistId) {
    fetch(`/api/events/${id}/artists/${artistId}`, {
        method: 'DELETE',
    }).then((response) => {
        if (!response.ok) {
            throw new Error('Errore durante la richiesta di eliminazione dell\'artista dall\'evento');
        }
        return response.json();
    }).then((data) => {
        // Gestisci la risposta del server (es. mostra un messaggio di successo)
        location.reload();
    })
}


document.querySelector("form").addEventListener("submit", e => {
    e.preventDefault();
    let updatedEventData = {
        title: document.querySelector("#title").value,
        start: document.querySelector("#day").value,
        description: document.querySelector("#description").value,
        allDay: true,
        classNames: "live-event",
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

function getEventInfos() {
    fetch(`/api/events/${id}`).then(res => res.json()).then(data => {
        document.querySelector("#title").value = data.title;
        document.querySelector("#day").value = data.start.substring(0, 10);
        document.querySelector("#description").value = data.description;

        const artistsList = document.getElementById('artistList');

        // Loop attraverso l'array di oggetti artisti e crea un elemento per ciascun artista
        data.artists.forEach((artist, index) => {
            if (artist.chosen) {
                document.querySelector("#chosen-artist").textContent = artist.name;
            }

            const artistItem = document.createElement('li');
            artistItem.classList.add('list-group-item');

            // Crea il contenuto dell'elemento artista
            artistItem.innerHTML = `
                <strong>Artista: ${artist.name}</strong><br>
                Utente: ${artist.username}<br>
                Email: ${artist.email}<br>
                Telefono: ${artist.phone}<br>
            `;
            let buttons = document.createElement("div"); 
            buttons.classList.add("d-flex", "mt-2", "align-items-center")

            if (!artist.chosen) buttons.innerHTML += `<button class="btn btn-primary mr-2" onclick="choose('${artist._id}')">Scegli</button>`
            else buttons.innerHTML += `<span class="text-success mr-2">Scelto</span>`

            buttons.innerHTML += `<a class="text-danger" onclick="deleteArtist('${artist._id}')">Elimina</a>`
            artistItem.appendChild(buttons);
            // Aggiungi l'elemento artista alla lista
            artistsList.appendChild(artistItem);
        });

        console.log(data);
    })
}
getEventInfos();