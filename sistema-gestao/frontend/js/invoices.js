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

function obterFiltrosFaturas() {
    return {
        search: ($('#filtro-busca-faturas').val() || '').trim(),
        date: $('#filtro-data-faturas').val() || ''
    };
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
    let filtros = obterFiltrosFaturas();

    if (faturasFiltroClienteId !== null) {
        url += `&client_id=${encodeURIComponent(faturasFiltroClienteId)}`;
    }
    if (filtros.search) {
        url += `&search=${encodeURIComponent(filtros.search)}`;
    }
    if (filtros.date) {
        url += `&date=${encodeURIComponent(filtros.date)}`;
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
                        <td class="text-end">
                            <button type="button" class="btn btn-sm btn-outline-primary btn-editar-fatura" data-id="${f.id}">Editar</button>
                            <button type="button" class="btn btn-sm btn-outline-danger btn-excluir-fatura" data-id="${f.id}">Excluir</button>
                        </td>
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

$(document).ready(function() {
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





    $('#paginacao-faturas').on('click', '.btn-mudar-pagina-faturas', function(evento) {
        evento.preventDefault();
        let paginaClicada = Number($(this).data('page')) || 1;
        carregarFaturas(paginaClicada);
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

    $('#tabela-faturas').on('click', '.btn-excluir-fatura', function() {
        let idFatura = $(this).data('id');
        if (!confirm(`Excluir a fatura #${idFatura}? Esta ação não pode ser desfeita.`)) {
            return;
        }
        let $botao = $(this);
        $botao.prop('disabled', true).text('...');
        $.ajax({
            url: `${API_BASE}/invoices/${idFatura}`,
            method: 'DELETE',
            success: function() {
                carregarFaturas(paginaAtualFaturas);
            },
            error: function(erro) {
                let msg = 'Erro ao excluir fatura.';
                if (erro.responseJSON && erro.responseJSON.message) {
                    msg = erro.responseJSON.message;
                }
                alert(msg);
                console.error(erro);
                $botao.prop('disabled', false).text('Excluir');
            }
        });
    });

    $('#tabela-faturas').on('click', '.btn-editar-fatura', function() {
        let idFatura = $(this).data('id');
        $.ajax({
            url: `${API_BASE}/invoices/${idFatura}`,
            method: 'GET',
            success: function(resposta) {
                let f = resposta.data ? resposta.data : resposta;
                $('#edit-fatura-id').val(f.id);
                $('#edit-fatura-client-id').val(f.client_id);
                let nomeCliente = (f.client && f.client.name) ? f.client.name : `Cliente #${f.client_id}`;
                $('#edit-fatura-client-name').val(nomeCliente);
                $('#edit-fatura-amount').val(f.amount);
                $('#edit-fatura-status').val(f.status);
                let venc = f.due_date || '';
                if (venc.length > 10) {
                    venc = venc.slice(0, 10);
                }
                $('#edit-fatura-due-date').val(venc);
                let modalEl = document.getElementById('modalEditarFatura');
                let modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.show();
            },
            error: function(erro) {
                alert('Erro ao carregar fatura.');
                console.error(erro);
            }
        });
    });

    $('#formEditarFatura').on('submit', function(evento) {
        evento.preventDefault();
        let idFatura = $('#edit-fatura-id').val();
        let payload = {
            client_id: Number($('#edit-fatura-client-id').val()),
            amount: Number($('#edit-fatura-amount').val()),
            status: $('#edit-fatura-status').val(),
            due_date: $('#edit-fatura-due-date').val()
        };
        $.ajax({
            url: `${API_BASE}/invoices/${idFatura}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function() {
                let modalEl = document.getElementById('modalEditarFatura');
                let modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
                carregarFaturas(paginaAtualFaturas);
            },
            error: function(erro) {
                if (erro.status === 422 && erro.responseJSON && erro.responseJSON.errors) {
                    let erros = erro.responseJSON.errors;
                    let mensagem = 'Verifique os campos:\n';
                    for (let campo in erros) {
                        mensagem += `- ${erros[campo][0]}\n`;
                    }
                    alert(mensagem);
                    return;
                }
                if (erro.responseJSON && erro.responseJSON.message) {
                    alert(erro.responseJSON.message);
                } else {
                    alert('Erro ao atualizar fatura.');
                }
                console.error(erro);
            }
        });
    });

});