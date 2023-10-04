const eventTypeSelect = document.getElementById('eventType');

// Aggiungi un ascoltatore per l'evento "change"
eventTypeSelect.addEventListener('change', function() {
    // Ottieni il valore selezionato
    const selectedValue = eventTypeSelect.value;
    if(selectedValue != "Live") {
        document.querySelector("#only-promo").className = "";
    } else {
        document.querySelector("#only-promo").className = "d-none";
    }
});


document.querySelector("form").addEventListener("submit", e => {
    e.preventDefault();
    const selectedValue = eventTypeSelect.value;

    let newEvent = {
        title: document.querySelector("#title").value,
        description: document.querySelector("#description").value
    };

    if(selectedValue === "Live"){
        newEvent.classNames = "live-event";
        newEvent.start = document.querySelector("#day").value;
        newEvent.allDay = true;
    }else {
        newEvent.start = document.querySelector("#day").value + "T" + document.querySelector("#start").value + ":00.000+02:00";
        newEvent.end = document.querySelector("#day").value + "T" + document.querySelector("#end").value  + ":00.000+02:00";
        newEvent.allDay = false;
        switch(selectedValue) {
            case "Produzione": newEvent.classNames = "prod-event"; break;
            case "Coworking": newEvent.classNames = "work-event"; break;
            case "Video": newEvent.classNames = "video-event"; break;
        }

        if(document.querySelector("#start").value === "" || document.querySelector("#end").value === "") {
            alert("Inserire gli orari dell'evento");
            return;
        }
    }
    
    

    fetch("/api/events/create", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEvent)
    }).then(res => {
        return res.json();
    }).then(data => {
        alert("Evento aggiunto");
        location.reload();
    })



    
})