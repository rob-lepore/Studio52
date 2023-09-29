document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;

    fetch("/api/users/login", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email, password
        })
    }).then(res => {
        if(res.status == 200) {
            location.href = "/"
        }else 
            return res.json();
    }).then(data => {
        document.querySelector("#alert").classList.remove("d-none")
        document.querySelector("#alert").textContent = data.message;
    })
})
