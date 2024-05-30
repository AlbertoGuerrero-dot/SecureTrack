const scanner = new Html5QrcodeScanner('reader', { 
    qrbox: {
        width: 250,
        height: 250,
    }, 
    fps: 20,
});

scanner.render(success, error);

function success(result) {
    document.getElementById('result').innerHTML = `
    <h2>Success!</h2>
    <p><a href="${result}">${result}</a></p>
    `;

    scanner.clear();
    document.getElementById('reader').remove();

    // Enviar el QR escaneado al servidor
    fetch('/inspeccion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ qr: result })
    })
    .then(response => {
        if (response.ok) {
            // Redirigir a /createInspection si la respuesta es exitosa
            window.location.href = '/createInspection';
        } else {
            return response.json().then(data => {
                throw new Error(data.message);
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('result').innerHTML = `
        <h2>Error!</h2>
        <p>${error.message}</p>
        `;
    });
}

function error(err) {
    console.error(err);
}
