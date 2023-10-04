fetch("/api/users/is-logged-in").then(res => res.json()).then(data => {
    if (data.ok) {
        fetch("/api/users/infos").then(res => res.json()).then(user => {
            document.querySelector("#name").textContent = user.username;
            document.querySelector("#email").textContent = user.email;
            document.querySelector("#phone").textContent = user.phone;

            fetch("/api/events/by-user/" + user._id).then(res => res.json()).then(evs => {
                console.log(evs)
                evs.events.forEach(e => {
                    let date = new Date(e.start).getDay().toString().padStart(2,0) + "/" + (new Date(e.start).getMonth()+1).toString().padStart(2,0);
                    let start = new Date(e.start).getHours().toString().padStart(2, 0) + ":" + new Date(e.start).getMinutes().toString().padStart(2, 0);
                    let end = new Date(e.end).getHours().toString().padStart(2, 0) + ":" + new Date(e.end).getMinutes().toString().padStart(2, 0);

                    let li = document.createElement("li");
                    if(!e.allDay){
                        li.innerHTML = `<b class="mr-1">${e.title}</b><span>- ${date} - dalle ${start} alle ${end}</span>`
                    } else {
                        li.innerHTML = `<b class="mr-1">${e.title}</b><span>- ${date}</span>`
                    }
                    document.querySelector("ul").appendChild(li);
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