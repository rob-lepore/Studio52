fetch("/api/users/is-logged-in").then(res => res.json()).then(data => {
    if(data.ok) {
        fetch("/api/users/infos").then(res=>res.json()).then(user => {
            document.querySelector("#name").textContent = user.username;
            document.querySelector("#email").textContent = user.email;
            document.querySelector("#phone").textContent = user.phone;
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