
let logged = false;
let admin = false;
fetch("/api/users/is-logged-in").then(res => res.json()).then(data => {
    if (data.ok) {
        fetch("/api/users/infos").then(res => res.json()).then(user => {
            admin = user.isAdmin;
            if (admin) document.querySelector("#new-event-a").classList.remove("d-none")
        })
    }
    logged = data.ok;
})

function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) {
            return decodeURIComponent(cookieValue);
        }
    }
    return null; // Il cookie non è stato trovato
}

document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');

    var calendar = new FullCalendar.Calendar(calendarEl, {
        themeSystem: "bootstrap5",
        height: "70vh",
        locale: "it",
        initialView: 'dayGridMonth',
        multiMonthMaxColumns: 1, // force a single column
        editable: false,
        slotEventOverlap: true,
        headerToolbar: {
            center: "timeGridWeek,dayGridMonth",
            left: "title,prev",
            right: "next"
        },
        buttonText: {
            month: "mese",
            week: "settimana",
        },
        
        validRange: {
            start: new Date(), // Imposta l'inizio dell'intervallo valido alla data odierna
            end: '9999-12-31'  // Imposta la fine dell'intervallo valido a una data futura molto lontana
        },
        
        events: "/api/events/all",
        eventClick: (info) => {
            document.querySelector("#promo-name").value = "";
            document.querySelector("#live-name").value = "";
            document.querySelector("#promo-start").value = "";
            document.querySelector("#promo-end").value = "";

            if (admin) {
                if (info.event.classNames.includes("live-event"))
                    location.href = "/gestisci-live?id=" + info.event.extendedProps._id;
                else
                    location.href = "/gestisci-promo?id=" + info.event.extendedProps._id;
                return;
            }
            if (!logged) {
                const myModal = new bootstrap.Modal('#login-modal')
                myModal.toggle();
            }
            else if (info.event.classNames.includes("live-event")) {
                const artists = info.event.extendedProps.artists.filter(a => a.chosen)
                const myModal = new bootstrap.Modal('#live-modal')

                const date = new Date(info.event.startStr);
                const day = date.getDate().toString().padStart(2, "0") + "/" + (date.getMonth() + 1).toString().padStart(2, "0")

                document.querySelector("#live-modal-title").textContent = info.event.title + " -- " + day;
                document.querySelector("#live-modal-desc").textContent = info.event.extendedProps.description;
                if (artists.length > 0)
                    document.querySelector("#live-chosen").innerHTML = "Artista scelto: <b>" + artists[0].name + "</b>";
                else
                    document.querySelector("#live-chosen").innerHTML = "";
                document.querySelector("#live-modal-id").textContent = info.event.extendedProps._id;

                let userId = getCookie("user_id")
                let dispList = document.querySelector("#disp-list")
                dispList.innerHTML = ""
                info.event.extendedProps.artists.forEach(artist => {
                    if (artist.userId === userId) {
                        let li = document.createElement("li");
                        li.innerHTML = artist.name + ` <a class='text-danger' onclick="deleteDispo('${artist._id}', '${info.event.extendedProps._id}')">(elimina)</a>`;
                        dispList.appendChild(li);
                    }
                });

                myModal.toggle();
            } else if (info.event.extendedProps.available) {
                const myModal = new bootstrap.Modal('#promo-modal')
                const date = new Date(info.event.startStr);
                const dateEnd = new Date(info.event.endStr);
                const day = date.getDate().toString().padStart(2, "0") + "/" + (date.getMonth() + 1).toString().padStart(2, "0")
                const timeStart = date.getHours().toString().padStart(2, "0") + ":" + date.getMinutes().toString().padStart(2, "0")
                const timeEnd = dateEnd.getHours().toString().padStart(2, "0") + ":" + dateEnd.getMinutes().toString().padStart(2, "0")

                document.querySelector("#promo-modal-title").textContent = info.event.title + " -- " + day;
                document.querySelector("#promo-modal-disp").textContent = "Dalle " + timeStart + " alle " + timeEnd;
                document.querySelector("#promo-modal-desc").textContent = info.event.extendedProps.description;
                document.querySelector("#promo-modal-id").textContent = info.event.extendedProps._id;
                document.querySelector("#promo-start").min = timeStart;
                document.querySelector("#promo-start").max = timeEnd;
                document.querySelector("#promo-end").min = timeStart;
                document.querySelector("#promo-end").max = timeEnd;

                myModal.toggle();
            } else {
                const myModal = new bootstrap.Modal('#res-modal');
                const date = new Date(info.event.startStr);
                const dateEnd = new Date(info.event.endStr);
                const day = date.getDate().toString().padStart(2, "0") + "/" + (date.getMonth() + 1).toString().padStart(2, "0")
                const timeStart = date.getHours().toString().padStart(2, "0") + ":" + date.getMinutes().toString().padStart(2, "0")
                const timeEnd = dateEnd.getHours().toString().padStart(2, "0") + ":" + dateEnd.getMinutes().toString().padStart(2, "0")
                document.querySelector("#res-modal-day").textContent = day;
                document.querySelector("#res-modal-start").textContent = timeStart;
                document.querySelector("#res-modal-end").textContent = timeEnd;
                document.querySelector("#res-modal-title").textContent = info.event.title;
                document.querySelector("#res-modal-desc").textContent = info.event.extendedProps.description || "Descrizione non disponibile";

                document.querySelector("#res-modal-id").textContent = info.event.extendedProps._id;


                myModal.toggle();

            }

        },
        businessHours: {
            // days of week. an array of zero-based day of week integers (0=Sunday)
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Monday - Thursday

            startTime: '09:00', // a start time (10am in this example)
            endTime: '24:00', // an end time (6pm in this example)
        }
    });

    calendar.render();

    function updateTitle() {
        document.querySelector("#cal-title").textContent = document.querySelector("#fc-dom-1").textContent
    }
    updateTitle();

    document.querySelector("button.fc-next-button").addEventListener("click", updateTitle);
    document.querySelector("button.fc-prev-button").addEventListener("click", updateTitle);
    document.querySelector("button.fc-timeGridWeek-button").addEventListener("click", updateTitle);
    document.querySelector("button.fc-dayGridMonth-button").addEventListener("click", updateTitle);

});



document.querySelector("#live-send").addEventListener("click", (e) => {
    e.preventDefault();
    const name = document.querySelector("#live-name").value;
    const eventId = document.querySelector("#live-modal-id").textContent;
    fetch(`/api/events/${eventId}/add-artist?name=${name}`).then(res => res.json()).then(data => {
        document.querySelector("#live-name").value = "";
        alert(data.message);
        location.reload();
    })

})


function deleteDispo(artistId, eventId) {
    fetch(`/api/events/${eventId}/artists/${artistId}`, {
        method: 'DELETE',
    }).then((response) => {
        if (!response.ok) {
            throw new Error('Errore durante la richiesta di eliminazione dell\'artista dall\'evento');
        }
        return response.json();
    }).then((data) => {
        // Gestisci la risposta del server (es. mostra un messaggio di successo)
        alert("Disponibilità eliminata")
        location.reload();
    })

}


document.querySelector("#promo-send").addEventListener("click", (e) => {
    console.log(e)
    e.preventDefault();
    const name = document.querySelector("#promo-name").value;
    const eventId = document.querySelector("#promo-modal-id").textContent
    const start = document.querySelector("#promo-start").value;
    const end = document.querySelector("#promo-end").value;

    console.log({ name, eventId, start, end })
    if (!document.querySelector("#promo-start").validity.valid ||
        !document.querySelector("#promo-end").validity.valid ||
        end <= start || name == "") {
        alert("Valori incompleti o non validi")
        return;
    } else {
        console.log("ok")
    }

    fetch(`/api/events/${eventId}/add-reservation`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
            start,
            end
        }),
    }).then(res => res.json()).then(data => {
        alert(data.message);
        location.reload();
    })
})

document.querySelector("#res-send").addEventListener("click", (e) => {
    e.preventDefault();
    let eventId = document.querySelector("#res-modal-id").textContent;
    fetch(`/api/events/${eventId}/remove-reservation`, {
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

})