document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.querySelector("#username").value;
    const phone = document.querySelector("#phone").value;
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;

    fetch("/api/users/create", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username, phone, email, password
        })
    }).then(res => {
        if(res.status == 200) {
            location.href = "/profilo"
        }else 
            return res.json();
    }).then(data => {
        document.querySelector("#alert").classList.remove("d-none")
        document.querySelector("#alert").textContent = data.message;
    })

})