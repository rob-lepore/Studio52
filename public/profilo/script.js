fetch("/api/users/is-logged-in").then(res => res.json()).then(data => {
    if (data.ok) {
        fetch("/api/users/infos").then(res => res.json()).then(user => {

            document.querySelector("#name").textContent = user.username;
            document.querySelector("#email").textContent = user.email;
            document.querySelector("#phone").textContent = user.phone;

            if(user.isAdmin){
                document.querySelector("#promo-card").style.display = "none"
                document.querySelector("#live-card").style.display = "none"
                document.querySelector("#dash-card").classList.remove("d-none")

                fetch("/api/events/all").then(res=> res.json()).then(events => {
                    document.querySelector("#n-events").textContent = events.length;
                    document.querySelector("#n-future").textContent = events.filter(e => new Date(e.start) > new Date()).length;
                    document.querySelector("#n-res").textContent = events.filter(e => !e.available).length;
                    let nDisp = 0;
                    for(let e of events.filter(e => e.allDay)) {
                        nDisp += e.artists.length;
                    }
                    document.querySelector("#n-disp").textContent = nDisp;
                    

                    fetch("/api/users").then(res => res.json()).then(data => {
                        document.querySelector("#n-users").textContent = data.n;
                    })
                })

                return;
            }


            fetch("/api/events/all/").then(res => res.json()).then(evs => {
                console.log(evs)
                // promo prenotate
                evs.filter(e => {
                    return !e.available && e.artists[0].userId == user._id && new Date(e.end) > new Date();
                }).forEach(e => {
                    let date = new Date(e.start).getDate().toString().padStart(2, 0) + "/" + (new Date(e.start).getMonth() + 1).toString().padStart(2, 0);
                    let start = new Date(e.start).getHours().toString().padStart(2, 0) + ":" + new Date(e.start).getMinutes().toString().padStart(2, 0);
                    let end = new Date(e.end).getHours().toString().padStart(2, 0) + ":" + new Date(e.end).getMinutes().toString().padStart(2, 0);

                    let li = document.createElement("li");
                    let eClass = "work-li"
                    if (e.classNames.split(" ")[0] == "video-event") eClass = "video-li"
                    if (e.classNames.split(" ")[0] == "prod-event") eClass = "prod-li"
                    
                    li.innerHTML = `<b class="mr-1 ${eClass}">${e.title}</b><span>- ${date}, dalle ${start} alle ${end}</span>`

                    document.querySelector("#events-list").appendChild(li);
                })

                // live assegnati
                evs.filter(e => {
                    return e.allDay && new Date(e.start) > new Date()
                }).forEach(e => {
                    let found = false;
                    for (let a of e.artists) {
                        if(a.userId == user._id && a.chosen) found = true;
                    }
                    if (found) {

                        let date = new Date(e.start).getDate().toString().padStart(2, 0) + "/" + (new Date(e.start).getMonth() + 1).toString().padStart(2, 0);
                        let start = new Date(e.start).getHours().toString().padStart(2, 0) + ":" + new Date(e.start).getMinutes().toString().padStart(2, 0);
                        let end = new Date(e.end).getHours().toString().padStart(2, 0) + ":" + new Date(e.end).getMinutes().toString().padStart(2, 0);

                        let li = document.createElement("li");

                        li.innerHTML = `<b class="mr-1 text-primary">${e.title}</b><span>- ${date}</span>`

                        document.querySelector("#live-list").appendChild(li);
                    }
                })
            })

        })
    } else {
        location.href = "/accedi"
    }
    logged = data.ok;
})

function logout() {
    document.cookie = 'user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    location.href = "/accedi";
}