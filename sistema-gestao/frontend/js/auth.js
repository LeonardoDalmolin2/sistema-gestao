$(document).ready(function() {
    
    const token = localStorage.getItem('meu_token_vip');
    console.log(token);
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    $.ajaxSetup({
        headers: {
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/json'
        }
    });

    $('#btn-logout').on('click', function() {
        if (confirm("Tem certeza que deseja sair?")) {
            localStorage.removeItem('meu_token_vip');
            
            window.location.href = 'login.html';
        }
    });

});