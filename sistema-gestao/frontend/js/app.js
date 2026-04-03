const API_BASE = 'http://127.0.0.1:8000/api';

function bindFiltroLista(config) {
    let timerDebounce;
    let debounceMs = typeof config.debounceMs === 'number' ? config.debounceMs : 500;
    let $inputBusca = $(config.inputBusca);
    let $inputData = $(config.inputData);
    let $btnLimpar = $(config.btnLimpar);

    if (config.inputBusca) {
        $inputBusca.on('input', function() {
            clearTimeout(timerDebounce);
            timerDebounce = setTimeout(function() {
                config.onChange();
            }, debounceMs);
        });
    }

    if (config.inputData) {
        $inputData.on('change', function() {
            config.onChange();
        });
    }

    if (config.btnLimpar) {
        $btnLimpar.on('click', function() {
            if (config.inputBusca) {
                $inputBusca.val('');
            }
            if (config.inputData) {
                $inputData.val('');
            }
            config.onChange();
        });
    }
}

$(document).ready(function() {
    bindFiltroLista({
        inputBusca: '#filtro-busca',
        inputData: '#filtro-data',
        btnLimpar: '#btn-limpar-filtro',
        onChange: function() {
            carregarClientes(1);
        }
    });

    bindFiltroLista({
        inputBusca: '#filtro-busca-faturas',
        inputData: '#filtro-data-faturas',
        btnLimpar: '#btn-limpar-filtro-faturas',
        onChange: function() {
            carregarFaturas(1);
        }
    });
});