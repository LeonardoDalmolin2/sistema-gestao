const API_BASE = 'http://127.0.0.1:8000/api';

function rotuloStatusFatura(status) {
    const mapa = { pending: 'Pendente', paid: 'Paga', canceled: 'Cancelada' };
    return mapa[status] || status;
}

function formatarMoedaBR(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarDataBR(iso) {
    if (!iso) return '—';
    let d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString('pt-BR');
}

let faturasFiltroClienteId = null;
let faturasNomeClienteFiltro = null;
let paginaAtualFaturas = 1;

function formatarTelefone(valor) {
    let digitos = (valor || '').replace(/\D/g, '').slice(0, 11);
    if (digitos.length <= 2) return digitos;
    if (digitos.length <= 7) return `(${digitos.slice(0, 2)})${digitos.slice(2)}`;
    return `(${digitos.slice(0, 2)})${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

function atualizarCabecalhoFaturas() {
    if (faturasFiltroClienteId === null) {
        $('#titulo-faturas').text('Minhas Faturas');
        $('#contexto-faturas-cliente').addClass('d-none').text('');
        $('#btn-faturas-ver-todas').addClass('d-none');
        $('#btn-nova-fatura').addClass('d-none');
    } else {
        let nome = faturasNomeClienteFiltro || ('Cliente #' + faturasFiltroClienteId);
        $('#titulo-faturas').text('Faturas do cliente');
        $('#contexto-faturas-cliente').removeClass('d-none').text(nome);
        $('#btn-faturas-ver-todas').removeClass('d-none');
        $('#btn-nova-fatura').removeClass('d-none');
    }
}

function carregarFaturas(pagina = 1) {
    paginaAtualFaturas = pagina;
    let url = `${API_BASE}/invoices?page=${pagina}`;
    if (faturasFiltroClienteId !== null) {
        url += `&client_id=${encodeURIComponent(faturasFiltroClienteId)}`;
    }

    $('#tabela-faturas').html('<tr><td colspan="6" class="text-center text-muted py-3">Carregando faturas...</td></tr>');
    $('#paginacao-faturas').empty();

    $.ajax({
        url: url,
        method: 'GET',
        success: function(resposta) {
            $('#tabela-faturas').empty();
            let listaFaturas = resposta.data ? resposta.data : resposta;

            if (!Array.isArray(listaFaturas) || listaFaturas.length === 0) {
                $('#tabela-faturas').append('<tr><td colspan="6" class="text-center text-muted py-3">Nenhuma fatura encontrada.</td></tr>');
                return;
            }

            listaFaturas.forEach(function(f) {
                let nomeCliente = (f.client && f.client.name) ? f.client.name : `Cliente #${f.client_id}`;
                let linha = `
                    <tr>
                        <td>${f.id}</td>
                        <td>${nomeCliente}</td>
                        <td>${formatarMoedaBR(f.amount)}</td>
                        <td>${rotuloStatusFatura(f.status)}</td>
                        <td>${formatarDataBR(f.due_date)}</td>
                        <td class="text-end text-muted small">—</td>
                    </tr>
                `;
                $('#tabela-faturas').append(linha);
            });

            if (resposta.links && Array.isArray(resposta.links)) {
                let $paginacao = $('#paginacao-faturas');
                $paginacao.empty();

                resposta.links.forEach(function(link) {
                    if (link.url === null) {
                        $paginacao.append(`<li class="page-item disabled"><a class="page-link" href="#">${link.label}</a></li>`);
                    } else {
                        let ativo = link.active ? 'active' : '';
                        let numeroPagina = new URL(link.url).searchParams.get('page');
                        $paginacao.append(`
                            <li class="page-item ${ativo}">
                                <a class="page-link btn-mudar-pagina-faturas" href="#" data-page="${numeroPagina}">
                                    ${link.label}
                                </a>
                            </li>
                        `);
                    }
                });
            }

        },
        error: function(erro) {
            console.error('Erro ao buscar faturas:', erro);
            let msg = 'Erro ao carregar faturas.';
            if (erro.responseJSON && erro.responseJSON.message) {
                msg = erro.responseJSON.message;
            }
            $('#tabela-faturas').html(`<tr><td colspan="6" class="text-center text-danger py-3">${msg}</td></tr>`);
        }
    });
}

function mostrarTelaFaturas(clienteId, nomeCliente) {
    $('#tela-clientes').addClass('d-none');
    $('#tela-faturas').removeClass('d-none');
    $('#menu-faturas').addClass('active');
    $('#menu-clientes').removeClass('active');

    faturasFiltroClienteId = clienteId === undefined || clienteId === null ? null : Number(clienteId);
    faturasNomeClienteFiltro = nomeCliente || null;

    atualizarCabecalhoFaturas();
    carregarFaturas(1);
}

function carregarClientes(pagina = 1) {
        let termoBusca = $('#filtro-busca').val();
        let dataBusca = $('#filtro-data').val();
        let urlApi = `${API_BASE}/clients?page=${pagina}`;

        if (termoBusca) {
            urlApi += `&search=${encodeURIComponent(termoBusca)}`;
        }
        if (dataBusca) {
            urlApi += `&date=${dataBusca}`;
        }

        $('#tabela-clientes').html('<tr><td colspan="6" class="text-center text-muted py-3">Buscando clientes...</td></tr>');
        $.ajax({
            url: urlApi, 
            method: 'GET',
            success: function(resposta) {
                $('#tabela-clientes').empty();

                let clientes = resposta.data;

                if (clientes.length === 0) {
                    $('#tabela-clientes').append('<tr><td colspan="5" class="text-center text-muted py-3">Nenhum cliente encontrado.</td></tr>');
                    return;
                }

                clientes.forEach(function(cliente) {
                    let linha = `
                        <tr>
                            <td>${cliente.id}</td>
                            <td class="fw-bold">${cliente.name}</td>
                            <td>${cliente.email}</td>
                            <td>${cliente.phone || 'Sem telefone'}</td>
                            <td class="text-end">
                                <button class="btn btn-sm btn-outline-info btn-ver-faturas" data-id="${cliente.id}" data-name="${encodeURIComponent(cliente.name || '')}">Faturas</button>
                                <button class="btn btn-sm btn-outline-primary btn-editar-cliente" data-id="${cliente.id}">Editar</button>
                                <button class="btn btn-sm btn-outline-danger btn-excluir-cliente" data-id="${cliente.id}">Excluir</button>
                            </td>
                        </tr>
                    `;
                    $('#tabela-clientes').append(linha);
                });

                let $paginacao = $('#paginacao-clientes');
                $paginacao.empty(); 

                resposta.links.forEach(function(link) {
                    if (link.url === null) {
                        $paginacao.append(`<li class="page-item disabled"><a class="page-link" href="#">${link.label}</a></li>`);
                    } else {
                        let ativo = link.active ? 'active' : '';
                        let numeroPagina = new URL(link.url).searchParams.get("page");
                        
                        $paginacao.append(`
                            <li class="page-item ${ativo}">
                                <a class="page-link btn-mudar-pagina" href="#" data-page="${numeroPagina}">
                                    ${link.label}
                                </a>
                            </li>
                        `);
                    }
                });
            },
            error: function(erro) {
                console.error("Erro ao buscar clientes:", erro);
                $('#tabela-clientes').html('<tr><td colspan="5" class="text-center text-danger py-3">Erro ao carregar dados.</td></tr>');
            }
        });
    }

$(document).ready(function() {

    carregarClientes();

    // --- NAVEGAÇÃO DA SPA ---
    $('#menu-clientes').on('click', function(evento) {
        evento.preventDefault();
        $('#tela-faturas').addClass('d-none');
        $('#tela-clientes').removeClass('d-none');
        $('#menu-clientes').addClass('active');
        $('#menu-faturas').removeClass('active');
    });

    $('#menu-faturas').on('click', function(evento) {
        evento.preventDefault();
        mostrarTelaFaturas(null);
    });

    $('#btn-faturas-ver-todas').on('click', function() {
        mostrarTelaFaturas(null);
    });

    $('#btn-novo-cliente').on('click', function() {
        $('#formNovoCliente')[0].reset();
        let modalEl = document.getElementById('modalNovoCliente');
        let modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    });

    $('#btn-nova-fatura').on('click', function() {
        if (faturasFiltroClienteId === null) {
            return;
        }
        $('#formNovaFatura')[0].reset();
        $('#fatura-client-id').val(faturasFiltroClienteId);
        $('#fatura-client-name').val(faturasNomeClienteFiltro || (`Cliente #${faturasFiltroClienteId}`));
        let modalEl = document.getElementById('modalNovaFatura');
        let modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    });

    $('#novo-phone, #edit-phone').on('input', function() {
        $(this).val(formatarTelefone($(this).val()));
    });

    let timerDebounce;

    $('#filtro-busca').on('input', function() {
        
        clearTimeout(timerDebounce);

        timerDebounce = setTimeout(function() {
            carregarClientes(1); 
        }, 500); 
    });

    $('#filtro-data').on('change', function() {
        carregarClientes(1);
    });

    $('#btn-limpar-filtro').on('click', function() {
        $('#filtro-busca').val('');
        $('#filtro-data').val('');
        carregarClientes(1);
    });

    $('#paginacao-clientes').on('click', '.btn-mudar-pagina', function(evento) {
        evento.preventDefault();
        let paginaClicada = $(this).data('page');
        carregarClientes(paginaClicada);
    });

    $('#paginacao-faturas').on('click', '.btn-mudar-pagina-faturas', function(evento) {
        evento.preventDefault();
        let paginaClicada = Number($(this).data('page')) || 1;
        carregarFaturas(paginaClicada);
    });

    $('#tabela-clientes').on('click', '.btn-ver-faturas', function() {
        let idDoCliente = $(this).data('id');
        let nomeCodificado = $(this).attr('data-name') || '';
        let nome = '';
        try {
            nome = decodeURIComponent(nomeCodificado);
        } catch (e) {
            nome = nomeCodificado;
        }
        mostrarTelaFaturas(idDoCliente, nome || null);
    });

    $('#tabela-clientes').on('click', '.btn-excluir-cliente', function() {
        
        let idDoCliente = $(this).data('id');

        if (confirm(`Tem certeza que deseja apagar o cliente ID ${idDoCliente}? Esta ação não tem volta.`)) {
            
            let $botao = $(this);
            $botao.text('Excluindo...').prop('disabled', true);

            $.ajax({
                url: `${API_BASE}/clients/${idDoCliente}`,
                method: 'DELETE', 
                
                success: function() {
                    carregarClientes();
                },
                
                error: function(erro) {
                    console.error("Erro ao deletar:", erro);
                    alert("Deu ruim ao excluir. Olhe o console (F12).");
                    
                    $botao.text('Excluir').prop('disabled', false); 
                }
            });
        }
    });

    $('#tabela-clientes').on('click', '.btn-editar-cliente', function() {
        let idDoCliente = $(this).data('id');
        $('#edit-client-id').val(idDoCliente);
        $.ajax({
            url: `${API_BASE}/clients/${idDoCliente}`,
            method: 'GET',
            success: function(resposta) {
                let cliente = resposta.data ? resposta.data : resposta;
                $('#edit-name').val(cliente.name);
                $('#edit-email').val(cliente.email);
                $('#edit-phone').val(formatarTelefone(cliente.phone));

                let modalEl = document.getElementById('modalEditarCliente');
                let modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.show();
            },
            error: function(erro) {
                alert("Erro ao buscar dados do cliente.");
                console.error(erro);
            }
        });
    });

    $('#formEditarCliente').on('submit', function(evento) {
        evento.preventDefault(); 

        let idDoCliente = $('#edit-client-id').val();
        
        if (!idDoCliente) {
            console.error("O ID do cliente está vazio!");
            return;
        }

        let dadosAtualizados = {
            name: $('#edit-name').val(),
            email: $('#edit-email').val(),
            phone: $('#edit-phone').val()
        };

        if (!/^\(\d{2}\)\d{5}-\d{4}$/.test(dadosAtualizados.phone)) {
            alert('Telefone inválido. Use o formato (xx)xxxxx-xxxx.');
            return;
        }

        $.ajax({
            url: `${API_BASE}/clients/${idDoCliente}`,
            method: 'PUT',
            contentType: 'application/json', 
            data: JSON.stringify(dadosAtualizados),
            success: function(resposta) {
                let modalEl = document.getElementById('modalEditarCliente');
                let modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();

                carregarClientes();
            },
            error: function(erro) {
                if (erro.status === 422) {
                    let errosDeValidacao = erro.responseJSON.errors;
                    console.error("O Laravel rejeitou a edição! Motivo:", errosDeValidacao);
                    
                    let mensagem = "Verifique os campos:\n";
                    for (let campo in errosDeValidacao) {
                        mensagem += `- ${errosDeValidacao[campo][0]}\n`;
                    }
                    alert(mensagem);
                } else {
                    console.error("Erro desconhecido:", erro);
                    alert("Erro ao atualizar cliente. Olhe o F12.");
                }
            }
        });
    });

    $('#formNovoCliente').on('submit', function(evento) {
        evento.preventDefault();

        let payload = {
            name: $('#novo-name').val(),
            email: $('#novo-email').val(),
            phone: $('#novo-phone').val()
        };

        if (!/^\(\d{2}\)\d{5}-\d{4}$/.test(payload.phone)) {
            alert('Telefone inválido. Use o formato (xx)xxxxx-xxxx.');
            return;
        }

        $.ajax({
            url: `${API_BASE}/clients`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function() {
                let modalEl = document.getElementById('modalNovoCliente');
                let modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
                carregarClientes(1);
            },
            error: function(erro) {
                if (erro.status === 422 && erro.responseJSON && erro.responseJSON.errors) {
                    let erros = erro.responseJSON.errors;
                    let mensagem = "Verifique os campos:\n";
                    for (let campo in erros) {
                        mensagem += `- ${erros[campo][0]}\n`;
                    }
                    alert(mensagem);
                    return;
                }
                alert('Erro ao cadastrar cliente.');
                console.error(erro);
            }
        });
    });

    $('#formNovaFatura').on('submit', function(evento) {
        evento.preventDefault();

        let payload = {
            client_id: Number($('#fatura-client-id').val()),
            amount: Number($('#fatura-amount').val()),
            status: $('#fatura-status').val(),
            due_date: $('#fatura-due-date').val()
        };

        $.ajax({
            url: `${API_BASE}/invoices`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function() {
                let modalEl = document.getElementById('modalNovaFatura');
                let modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
                carregarFaturas(paginaAtualFaturas);
            },
            error: function(erro) {
                if (erro.status === 422 && erro.responseJSON && erro.responseJSON.errors) {
                    let erros = erro.responseJSON.errors;
                    let mensagem = "Verifique os campos:\n";
                    for (let campo in erros) {
                        mensagem += `- ${erros[campo][0]}\n`;
                    }
                    alert(mensagem);
                    return;
                }
                if (erro.responseJSON && erro.responseJSON.message) {
                    alert(erro.responseJSON.message);
                } else {
                    alert('Erro ao cadastrar fatura.');
                }
                console.error(erro);
            }
        });
    });

});