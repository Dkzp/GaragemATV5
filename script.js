// ==================================================
//                CLASSES
// ==================================================

// --- CLASSE MANUTENCAO ---
class Manutencao {
    constructor(data, tipo, custo, descricao = '') {
        this.data = data instanceof Date ? data : new Date(data);
        this.tipo = String(tipo || '').trim(); // Garante string e remove espaços
        this.custo = parseFloat(custo) || 0;
        this.descricao = String(descricao || '').trim();
    }

    formatar() {
        if (isNaN(this.data?.getTime())) return "Data inválida";
        const dataFmt = this.data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const custoFmt = this.custo > 0 ? ` - R$${this.custo.toFixed(2)}` : "";
        return `${this.tipo || '(Tipo não definido)'} em ${dataFmt}${custoFmt}${this.descricao ? ` (${this.descricao})` : ''}`;
    }

    formatarComHora() {
        if (isNaN(this.data?.getTime())) return "Data/Hora inválida";
        const dataHoraFmt = this.data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
        const custoFmt = this.custo > 0 ? ` - Custo Est.: R$${this.custo.toFixed(2)}` : "";
        return `${this.tipo || '(Tipo não definido)'} agendado para ${dataHoraFmt}${custoFmt}${this.descricao ? ` (Obs: ${this.descricao})` : ''}`;
    }

    validar() {
        const dataValida = this.data instanceof Date && !isNaN(this.data.getTime());
        const tipoValido = typeof this.tipo === 'string' && this.tipo !== ''; // Verifica se não é vazio após trim
        const custoValido = typeof this.custo === 'number' && this.custo >= 0;

        if (!dataValida) console.error("Manutencao.validar FALHA: Data inválida:", this.data);
        if (!tipoValido) console.error("Manutencao.validar FALHA: Tipo inválido:", `"${this.tipo}"`);
        if (!custoValido) console.error("Manutencao.validar FALHA: Custo inválido:", this.custo);

        return dataValida && tipoValido && custoValido;
    }

    toJSON() {
        if (isNaN(this.data?.getTime())) return null;
        return { data: this.data.toISOString(), tipo: this.tipo, custo: this.custo, descricao: this.descricao };
    }
}

// --- CLASSE CarroBase ---
class CarroBase {
    constructor(id, modelo, cor, imagemSrc = 'default.jpg') {
        if (!id || !modelo) throw new Error("ID e Modelo são obrigatórios para criar um veículo.");
        this.id = id; this.modelo = modelo; this.cor = cor || 'Não definida'; this.imagemSrc = imagemSrc;
        this.velocidade = 0; this.ligado = false; this.historicoManutencao = [];
    }

    ligar() { if (!this.ligado) { this.ligado = true; this.tocarSom('som-ligar'); this.atualizarInformacoes("Ligou"); } }
    desligar() { if (this.ligado) { this.ligado = false; if (this.velocidade > 0) { this.velocidade = 0; this.tocarSom('som-desligar'); } this.atualizarInformacoes("Desligou"); } }
    acelerar() { if (this.ligado) { this.velocidade += 10; this.tocarSom('som-acelerar'); this.atualizarInformacoes("Acelerou"); } else { alert(`Ligue ${this.modelo}!`); } }
    frear() { if (this.velocidade > 0) { this.velocidade -= 10; if (this.velocidade < 0) this.velocidade = 0; this.tocarSom('som-frear'); this.atualizarInformacoes("Freou"); } }
    buzinar() { this.tocarSom('som-buzinar'); console.log(`${this.id} buzinou`); }

    // --- Manutenção ---
    adicionarManutencao(manutencao) {
        console.log(`Tentando adicionar manutenção para ${this.id}:`, manutencao);
        if (!(manutencao instanceof Manutencao && manutencao.validar())) {
             console.error(`ADICIONAR MANUTENCAO FALHOU (Validação) para ${this.id}:`, manutencao);
             alert("Agendamento falhou: Verifique se Data e Tipo estão corretos.");
             return false;
        }
        if (!Array.isArray(this.historicoManutencao)) this.historicoManutencao = [];
        this.historicoManutencao.push(manutencao);
        this.historicoManutencao.sort((a, b) => (b.data?.getTime() || 0) - (a.data?.getTime() || 0));
        console.log(`Manutenção ADICIONADA com sucesso para ${this.id}. Salvando garagem...`);
        salvarGaragem(); // <-- SALVA A GARAGEM AQUI
        this.atualizarInformacoes("Manutenção Adicionada"); // Atualiza toda a UI do carro
        atualizarExibicaoAgendamentosFuturos(); // Atualiza lista global de futuros
        return true;
    }

    getHistoricoManutencaoFormatado() {
        const agora = new Date();
        const hist = (this.historicoManutencao || []).filter(m => m?.data instanceof Date && !isNaN(m.data.getTime()));
        const passadas = hist.filter(m => m.data <= agora).map(m => m.formatar());
        const futuras = hist.filter(m => m.data > agora).map(m => m.formatarComHora());
        return { passadas, futuras };
    }

    // --- UI ---
    atualizarExibicaoManutencao() {
        const listaDivId = `lista-historico-${this.id}`;
        const listaDiv = document.getElementById(listaDivId);
        if (!listaDiv) { console.warn(`Div ${listaDivId} não encontrada.`); return; }
        const { passadas } = this.getHistoricoManutencaoFormatado();
        listaDiv.innerHTML = (passadas.length > 0)
            ? `<ul>${passadas.map(item => `<li>${item}</li>`).join('')}</ul>`
            : '<p>Nenhuma manutenção registrada.</p>';
    }

    atualizarInformacoes(origem = "Desconhecida") {
        console.debug(`Atualizando Informações UI para ${this.id} (Origem: ${origem})`);
        const idsMap = { /* ... (mapa de IDs como na versão anterior) ... */
             'meuCarro': { s: 'status', v: 'velocidade', i: 'carro-imagem', b: 'barra-progresso-carro-base', p: 'ponteiro-carro-base', t: 'carro-base-titulo' },
             'ferrari': { s: 'status-esportivo', v: 'velocidade-esportivo', i: 'carro-esportivo-imagem', b: 'barra-progresso-carro-esportivo', p: 'ponteiro-carro-esportivo', t: 'carro-esportivo-titulo', turbo: 'turbo-status'},
             'scania': { s: 'status-caminhao', v: 'velocidade-caminhao', i: 'caminhao-imagem', b: 'barra-progresso-caminhao', p: 'ponteiro-caminhao', t: 'caminhao-titulo', carga: 'carga-status'}
        };
        const ids = idsMap[this.id]; if (!ids) { console.error(`IDs não encontrados para ${this.id}`); return; }

        const getEl = (id) => document.getElementById(id);
        const setTxt = (el, txt) => { if (el) el.textContent = txt; else console.warn(`Elemento não encontrado para setTxt: ${el}`); };
        const setCls = (el, cls) => { if (el) el.className = cls; else console.warn(`Elemento não encontrado para setCls: ${el}`); };
        const setImg = (el, src, alt) => { if (el) { el.src = src; el.alt = alt; } else console.warn(`Elemento não encontrado para setImg: ${el}`); };

        const statusEl = getEl(ids.s); const velEl = getEl(ids.v); const imgEl = getEl(ids.i); const tituloEl = getEl(ids.t);

        setTxt(statusEl, this.ligado ? "Ligado" : "Desligado"); setCls(statusEl, this.ligado ? "status-ligado" : "status-desligado"); setTxt(velEl, this.velocidade); setImg(imgEl, this.imagemSrc, `Imagem ${this.modelo}`); setTxt(tituloEl, this.modelo);
        this.atualizarBarraAceleracao(ids.b); this.atualizarVelocimetro(ids.p);

        if (this instanceof CarroEsportivo && ids.turbo) setTxt(getEl(ids.turbo), `Turbo: ${this.turboAtivado ? 'Ativado' : 'Desativado'}`);
        else if (this instanceof Caminhao && ids.carga) setTxt(getEl(ids.carga), `Carga: ${this.cargaAtual}/${this.capacidadeCarga} kg`);

        this.atualizarExibicaoManutencao(); // Sempre atualiza o histórico junto
    }
    atualizarBarraAceleracao(id) { const e=document.getElementById(id); if(e){const max=180,p=Math.min((this.velocidade/max)*100,100);e.style.width=`${p}%`;}}
    atualizarVelocimetro(id) { const e=document.getElementById(id); if(e){const maxV=200,maxA=180,a=Math.min((this.velocidade/maxV)*maxA,maxA);e.style.transform=`translateX(-50%) rotate(${a-90}deg)`;}}
    tocarSom(id) { const a=document.getElementById(id); if(a){a.currentTime=0; a.play().catch(e=>console.warn("Audio:",e));}}

    toJSON() {
        const histValido = (this.historicoManutencao || []).filter(m => m instanceof Manutencao && !isNaN(m.data?.getTime()));
        let tipo = 'CarroBase'; if (this instanceof CarroEsportivo) tipo = 'CarroEsportivo'; else if (this instanceof Caminhao) tipo = 'Caminhao';
        const data = { id: this.id, modelo: this.modelo, cor: this.cor, velocidade: this.velocidade, ligado: this.ligado, imagemSrc: this.imagemSrc, tipoVeiculo: tipo, historicoManutencao: histValido };
        if (tipo === 'CarroEsportivo') data.turboAtivado = this.turboAtivado; else if (tipo === 'Caminhao') { data.capacidadeCarga = this.capacidadeCarga; data.cargaAtual = this.cargaAtual; }
        return data;
    }
}

// --- CLASSE CarroEsportivo ---
class CarroEsportivo extends CarroBase {
    constructor(id, m, c, i){super(id,m,c,i||'default_esportivo.jpg');this.turboAtivado=false;}
    ativarTurbo(){if(this.ligado){this.turboAtivado=!this.turboAtivado;this.atualizarInformacoes("Turbo Toggled");}else{alert(`Ligue ${this.modelo}!`);}}
    acelerar(){if(this.ligado){const inc=this.turboAtivado?20:10;this.velocidade+=inc;this.tocarSom('som-acelerar');this.atualizarInformacoes("Acelerou Esportivo");}else{alert(`Ligue ${this.modelo}!`);}}
}

// --- CLASSE Caminhao ---
class Caminhao extends CarroBase {
    constructor(id,m,c,cap,i){super(id,m,c,i||'default_caminhao.jpg');this.capacidadeCarga=cap||0;this.cargaAtual=0;}
    carregar(p){const n=parseInt(p);if(isNaN(n)||n<=0)return alert("Peso inválido.");if(this.cargaAtual+n<=this.capacidadeCarga){this.cargaAtual+=n;this.atualizarInformacoes("Carregou");}else{alert(`Carga excedida.`);}}
    acelerar(){if(this.ligado){const f=1-(this.cargaAtual/(this.capacidadeCarga*2||1)),inc=Math.max(1,Math.round(10*f));this.velocidade+=inc;this.tocarSom('som-acelerar');this.atualizarInformacoes("Acelerou Caminhão");}else{alert(`Ligue ${this.modelo}!`);}}
}

// ==================================================
//      GERENCIAMENTO DA GARAGEM & PERSISTÊNCIA
// ==================================================
let garagem = {};
const GARAGEM_KEY = 'garagemData_v2'; // Nova chave para evitar conflito com dados antigos inválidos

function salvarGaragem() {
    try {
        // Usar toJSON garante que só dados válidos são stringificados
        localStorage.setItem(GARAGEM_KEY, JSON.stringify(garagem));
        console.log(`Garagem salva em ${GARAGEM_KEY}.`);
    } catch (e) {
        console.error("ERRO FATAL AO SALVAR GARAGEM:", e);
        alert("ERRO CRÍTICO: Não foi possível salvar os dados da garagem. Verifique o console.");
    }
}

function carregarGaragem() {
    const data = localStorage.getItem(GARAGEM_KEY);
    garagem = {}; // Limpa sempre
    if (data) {
        try {
            const garagemData = JSON.parse(data);
            console.log("Dados crus carregados:", garagemData);
            for (const id in garagemData) {
                const d = garagemData[id];
                if (!d || !d.id || !d.modelo) { // Validação mínima dos dados crus
                    console.warn("Registro de veículo inválido ignorado no carregamento:", d);
                    continue;
                }
                let v;
                // Recria histórico JÁ filtrado pelo toJSON
                const hist = (d.historicoManutencao || [])
                    .map(m => new Manutencao(m.data, m.tipo, m.custo, m.descricao))
                    .filter(m => m.validar()); // Valida novamente ao carregar

                switch (d.tipoVeiculo) {
                    case 'CarroEsportivo': v = new CarroEsportivo(d.id,d.modelo,d.cor,d.imagemSrc); v.turboAtivado=d.turboAtivado||false; break;
                    case 'Caminhao': v = new Caminhao(d.id,d.modelo,d.cor,d.capacidadeCarga||0,d.imagemSrc); v.cargaAtual=d.cargaAtual||0; break;
                    default: v = new CarroBase(d.id,d.modelo,d.cor,d.imagemSrc);
                }
                v.velocidade=d.velocidade||0; v.ligado=d.ligado||false; v.historicoManutencao=hist;
                garagem[id] = v;
                console.log(`Veículo ${id} (${v.modelo}) recriado.`);
            }
            console.log("Garagem carregada com sucesso.");
        } catch (e) {
            console.error("ERRO FATAL AO CARREGAR/PARSEAR GARAGEM:", e);
            alert("ERRO CRÍTICO ao carregar dados salvos. Iniciando com garagem padrão. Verifique o console.");
            localStorage.removeItem(GARAGEM_KEY); // Remove dados corrompidos
            inicializarVeiculosPadrao();
        }
    } else {
        console.log("Nenhuma garagem salva encontrada. Inicializando padrão.");
        inicializarVeiculosPadrao();
    }
    atualizarInterfaceCompleta(); // Atualiza UI após carregar ou inicializar
}

function inicializarVeiculosPadrao() {
    // garagem já deve estar vazia
    try {
        garagem['meuCarro'] = new CarroBase("meuCarro", "Pagani Zonda R", "Preto", "pagani R.jpg");
        garagem['ferrari'] = new CarroEsportivo("ferrari", "Ferrari F40", "Vermelha", "fcr.webp");
        garagem['scania'] = new Caminhao("scania", "Scania R450", "Azul", 10000, "Scania-30-G.webp");
        console.log("Veículos padrão criados.");
        salvarGaragem(); // Salva a garagem padrão inicial
    } catch (e) {
        console.error("ERRO AO INICIALIZAR VEÍCULOS PADRÃO:", e);
        alert("Erro crítico ao criar veículos padrão.");
        garagem = {}; // Garante que a garagem fique vazia se a criação falhar
    }
}

function atualizarInterfaceCompleta() {
     console.log("Atualizando interface completa...");
     const mapa = {'meuCarro': 'carro-base', 'ferrari': 'carro-esportivo', 'scania': 'caminhao'};
     const veiculoIds = Object.keys(garagem);
     let primeiroId = veiculoIds.length > 0 ? veiculoIds[0] : null;

     // Atualiza a informação de cada veículo existente
     veiculoIds.forEach(id => {
         if (garagem[id] && typeof garagem[id].atualizarInformacoes === 'function') {
             garagem[id].atualizarInformacoes("Atualização Completa");
         } else {
             console.warn(`Veículo inválido ou sem método atualizarInformacoes encontrado na garagem: ${id}`);
         }
     });

     atualizarExibicaoAgendamentosFuturos(); // Atualiza lista global de futuros

     // Garante que todos os containers estejam ocultos inicialmente
     document.querySelectorAll('.veiculo-container').forEach(c => c.classList.remove('ativo'));

     // Exibe o primeiro veículo, se houver
     if (primeiroId && mapa[primeiroId]) {
         const containerId = mapa[primeiroId];
         const el = document.getElementById(containerId);
         if (el) {
             el.classList.add('ativo');
             console.log(`Exibindo container ativo: ${containerId}`);
             atualizarFormularioEdicao(primeiroId);
         } else {
             console.error(`Container ${containerId} não encontrado para exibir.`);
             atualizarFormularioEdicao(null); // Limpa form se container não existe
         }
     } else {
         console.log("Nenhum veículo para exibir ou mapear.");
         atualizarFormularioEdicao(null); // Limpa form se garagem vazia
     }
     verificarAgendamentosProximos();
     console.log("Atualização completa da interface finalizada.");
}

// ==================================================
//             LÓGICA DE INTERAÇÃO E UI
// ==================================================
const mapaContainerVeiculo = {'carro-base': 'meuCarro', 'carro-esportivo': 'ferrari', 'caminhao': 'scania'};

function interagir(id, acao) { const v = garagem[id]; if (!v) return alert("Veículo não encontrado."); console.log(`Ação:${acao}, Veículo:${id}`); try { switch (acao) { case 'ligar': v.ligar(); break; case 'desligar': v.desligar(); break; case 'acelerar': v.acelerar(); break; case 'frear': v.frear(); break; case 'buzinar': v.buzinar(); break; case 'ativarTurbo': if(v instanceof CarroEsportivo)v.ativarTurbo();else alert("Só esportivos."); break; case 'carregar': if(v instanceof Caminhao){const i=document.getElementById(`carga-${id}`), vl=i?i.value:'0';v.carregar(vl);if(i)i.value='';}else alert("Só caminhões."); break; default: console.log("Ação ?"); } } catch (e) { console.error(`Erro durante ação ${acao} para ${id}:`, e); alert(`Ocorreu um erro ao ${acao}. Verifique o console.`); } }
function exibirVeiculo(contId) { console.log(`Tentando exibir ${contId}`); document.querySelectorAll('.veiculo-container').forEach(c=>c.classList.remove('ativo')); const d=document.getElementById(contId); if(d){d.classList.add('ativo'); const vId=mapaContainerVeiculo[contId]; if(vId){atualizarFormularioEdicao(vId); if(garagem[vId])garagem[vId].atualizarInformacoes("Exibindo Veículo"); else console.error(`Veículo ${vId} não encontrado na garagem ao exibir.`);} else console.error(`ID de veículo não mapeado para container ${contId}`);} else console.error(`Container ${contId} não encontrado.`); }
function atualizarFormularioEdicao(vId) { const mI=document.getElementById('modelo'), cI=document.getElementById('cor'), iI=document.getElementById('imagem'); const v=vId?garagem[vId]:null; mI.value=v?v.modelo:''; cI.value=v?v.cor:''; iI.value=''; console.log(`Formulário de edição atualizado para: ${vId || 'Nenhum'}`); }

// --- Event Listeners ---
function setupEventListeners() {
    console.log("Configurando Event Listeners...");
    // Ações dos veículos
    document.querySelectorAll('button[data-acao]').forEach(b => b.addEventListener('click', function(){ console.log(`Botão Ação Clicado: ${this.dataset.acao}, Veículo: ${this.dataset.veiculo}`); interagir(this.dataset.veiculo, this.dataset.acao); }));
    // Menu de seleção
    document.getElementById('menu-veiculos').querySelectorAll('button').forEach(b => b.addEventListener('click', function(){ console.log(`Botão Menu Clicado: ${this.dataset.veiculo}`); exibirVeiculo(this.dataset.veiculo); }));
    // Salvar Edição Veículo
    const btnSalvar = document.getElementById('salvar-veiculo');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', handleSalvarVeiculo);
    } else {
        console.error("Botão #salvar-veiculo não encontrado!");
    }
    // Agendar Manutenção
    document.querySelectorAll('.form-agendamento').forEach(form => form.addEventListener('submit', handleAgendarManutencao));
    // Limpar Histórico
    document.querySelectorAll('.btn-limpar-historico').forEach(b => b.addEventListener('click', handleLimparHistorico));
    console.log("Event Listeners configurados.");
}

// ==================================================
//          HANDLERS DE EVENTOS (Funções Separadas)
// ==================================================

function handleSalvarVeiculo() {
    console.log("Botão Salvar Veículo clicado.");
    const contAtivo = document.querySelector('.veiculo-container.ativo');
    if (!contAtivo) return alert("Nenhum veículo selecionado para editar.");

    const vId = mapaContainerVeiculo[contAtivo.id];
    if (!vId) return alert("Erro interno: ID do container ativo não mapeado.");

    const veiculo = garagem[vId];
    if (!veiculo) return alert(`Erro interno: Veículo ${vId} não encontrado na garagem.`);

    console.log(`Salvando alterações para ${vId} (${veiculo.modelo})`);

    const modeloInput = document.getElementById('modelo');
    const corInput = document.getElementById('cor');
    const imagemInput = document.getElementById('imagem');

    // Verifica se os inputs existem antes de ler .value
    if (!modeloInput || !corInput || !imagemInput) {
        console.error("Erro: Inputs de edição não encontrados!");
        return alert("Erro interno: Campos de edição não encontrados.");
    }

    let mudouAlgo = false;
    const modeloNovo = modeloInput.value.trim();
    const corNova = corInput.value.trim();

    if (modeloNovo && veiculo.modelo !== modeloNovo) {
        veiculo.modelo = modeloNovo;
        mudouAlgo = true;
        console.log(`Modelo atualizado para: ${modeloNovo}`);
    }
    if (corNova && veiculo.cor !== corNova) {
        veiculo.cor = corNova;
        mudouAlgo = true;
        console.log(`Cor atualizada para: ${corNova}`);
    }

    const imagemFile = imagemInput.files[0];

    if (imagemFile) {
        console.log("Nova imagem selecionada:", imagemFile.name);
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                veiculo.imagemSrc = e.target.result;
                console.log("Imagem carregada no FileReader.");
                mudouAlgo = true; // Confirma que houve mudança
                veiculo.atualizarInformacoes("Imagem Salva"); // Atualiza UI com nova imagem
                salvarGaragem(); // Salva DEPOIS que a imagem foi processada
                alert("Veículo atualizado com sucesso (incluindo imagem)!");
            } catch (err) {
                console.error("Erro ao processar imagem no onload:", err);
                alert("Erro ao processar a imagem.");
            }
        }
        reader.onerror = function() {
            console.error("Erro no FileReader ao ler a imagem.");
            alert("Ocorreu um erro ao tentar ler o arquivo de imagem.");
        }
        reader.readAsDataURL(imagemFile);
        imagemInput.value = ''; // Limpa o input de arquivo
    } else {
        // Se não há nova imagem, mas modelo/cor mudaram, salva e atualiza
        if (mudouAlgo) {
            console.log("Salvando alterações de modelo/cor (sem nova imagem).");
            veiculo.atualizarInformacoes("Modelo/Cor Salvos");
            salvarGaragem();
            alert("Veículo atualizado com sucesso!");
        } else {
            console.log("Nenhuma alteração detectada para salvar.");
            // Opcional: alert("Nenhuma alteração feita.");
        }
    }
}

function handleAgendarManutencao(event) {
    event.preventDefault(); // Sempre previne o envio padrão
    console.log("Handler Agendar Manutenção iniciado.");

    const form = event.target; // O formulário que disparou o evento
    const veiculoId = form.dataset.veiculo;
    const veiculo = garagem[veiculoId];

    if (!veiculo) {
        console.error(`AGENDAR ERRO: Veículo ${veiculoId} não encontrado.`);
        return alert("Erro crítico: Veículo não encontrado.");
    }

    // Busca elementos DENTRO do formulário específico
    const dataI=form.querySelector('.agendamento-data'), horaI=form.querySelector('.agendamento-hora'), tipoI=form.querySelector('.agendamento-tipo'), custoI=form.querySelector('.agendamento-custo'), obsI=form.querySelector('.agendamento-obs');

    if (!dataI || !tipoI) { // Checa apenas os obrigatórios para dar erro cedo
        console.error("AGENDAR ERRO: Campo Data ou Tipo não encontrado no form:", form);
        return alert("Erro interno: Campos essenciais do formulário não encontrados.");
    }

    const dataStr = dataI.value, horaStr = horaI?.value || '00:00', tipoStr = tipoI.value.trim(), custoStr = custoI?.value, obsStr = obsI?.value.trim();
    console.log(`Dados do form ${veiculoId}:`, {dataStr, horaStr, tipoStr, custoStr, obsStr});

    if (!dataStr) return alert("Selecione a Data.") || dataI.focus();
    if (!tipoStr) return alert("Preencha o Tipo.") || tipoI.focus();

    const dt = new Date(`${dataStr}T${horaStr}:00`); // Cria data
    if (isNaN(dt.getTime())) { // Valida data
        console.error(`AGENDAR ERRO: Data/Hora inválida criada a partir de ${dataStr}T${horaStr}:00`);
        return alert("Data ou Hora fornecida é inválida.");
    }

    const manut = new Manutencao(dt, tipoStr, custoStr, obsStr); // Cria manutenção
    console.log("Objeto Manutencao criado:", manut);

    if (veiculo.adicionarManutencao(manut)) { // Tenta adicionar (já valida, salva, atualiza UI)
        console.log(`Agendamento para ${veiculoId} concluído com sucesso.`);
        alert(`Agendamento para ${veiculo.modelo} realizado!`);
        form.reset(); // Limpa o formulário específico
    }
    // Se adicionarManutencao falhou, ela mesma já deve ter dado um alerta/log.
}

function handleLimparHistorico() {
    const veiculoId = this.dataset.veiculo; // 'this' é o botão clicado
    const veiculo = garagem[veiculoId];
    if (!veiculo) return alert("Erro: Veículo não encontrado.");

    console.log(`Limpar histórico solicitado para ${veiculoId}`);
    if (confirm(`Tem certeza que deseja apagar TODO o histórico de ${veiculo.modelo}?\n\nEsta ação não pode ser desfeita!`)) {
        veiculo.historicoManutencao = [];
        salvarGaragem();
        veiculo.atualizarInformacoes("Histórico Limpo"); // Atualiza UI do carro (inclui histórico)
        atualizarExibicaoAgendamentosFuturos(); // Atualiza lista global
        alert(`Histórico de ${veiculo.modelo} apagado.`);
        console.log(`Histórico de ${veiculoId} limpo.`);
    } else {
        console.log(`Limpeza de histórico cancelada para ${veiculoId}`);
    }
}

// ==================================================
//      ATUALIZAÇÃO LISTA GLOBAL AGENDAMENTOS
// ==================================================
function atualizarExibicaoAgendamentosFuturos() {
    const div = document.getElementById('agendamentos-futuros-lista');
    if (!div) { console.error("Div #agendamentos-futuros-lista não encontrada."); return; }
    div.innerHTML = ''; // Limpa antes de popular
    const agora = new Date(), todos = [];
    Object.values(garagem).forEach(v => {
        (v.historicoManutencao || []).forEach(m => {
            if (m?.data instanceof Date && !isNaN(m.data.getTime()) && m.data > agora) {
                todos.push({ manutencao: m, modeloVeiculo: v.modelo });
            }
        });
    });
    todos.sort((a, b) => a.manutencao.data.getTime() - b.manutencao.data.getTime());
    if (todos.length > 0) {
        const ul = document.createElement('ul');
        todos.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${item.modeloVeiculo}:</strong> ${item.manutencao.formatarComHora()}`;
            ul.appendChild(li);
        });
        div.appendChild(ul);
    } else {
        div.innerHTML = '<p>Nenhum agendamento futuro.</p>';
    }
    console.log(`Lista de agendamentos futuros atualizada (${todos.length} itens).`);
}

// ==================================================
//         ALERTAS DE AGENDAMENTOS PRÓXIMOS
// ==================================================
function verificarAgendamentosProximos() {
    const agora = new Date(), amanha = new Date(); amanha.setDate(agora.getDate() + 1); amanha.setHours(23, 59, 59, 999); let notifs = [];
    Object.values(garagem).forEach(v => { (v.historicoManutencao || []).forEach(m => { if (m?.data instanceof Date && !isNaN(m.data.getTime()) && m.data > agora && m.data <= amanha) { const hoje = m.data.toDateString()===agora.toDateString(), p=hoje?"HOJE":"Amanhã"; notifs.push(`ALERTA ${p}: ${v.modelo} - ${m.tipo} às ${m.data.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`); } }); });
    const area = document.getElementById('notificacoes-area'); if (area) { if (notifs.length > 0) { area.innerHTML = `<ul>${notifs.map(n => `<li>${n}</li>`).join('')}</ul>`; area.style.display = 'block'; } else { area.style.display = 'none'; } } else if (notifs.length > 0) { alert("--- Agendamentos Próximos ---\n\n" + notifs.join("\n")); }
    if(notifs.length > 0) console.log("Notificações de agendamentos próximos verificadas:", notifs);
}

// ==================================================
//                   INICIALIZAÇÃO
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Carregado. Iniciando Garagem Inteligente...");
    try {
        setupEventListeners(); // Configura os listeners primeiro
        carregarGaragem();    // Depois carrega os dados e atualiza a UI
        console.log("Inicialização concluída.");
    } catch (e) {
        console.error("ERRO CRÍTICO NA INICIALIZAÇÃO:", e);
        alert("Ocorreu um erro grave ao iniciar a aplicação. Verifique o console.");
        // Tenta limpar estado potencialmente ruim
        localStorage.removeItem(GARAGEM_KEY);
        document.body.innerHTML = "<h1>Erro Crítico</h1><p>A aplicação não pôde ser iniciada corretamente. Por favor, recarregue a página. Se o erro persistir, contate o suporte.</p>";
    }
});