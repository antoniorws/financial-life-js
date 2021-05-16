const btnCadastrar = document.querySelector("#cadastrarDespesa")
const btnCancelar = document.querySelector("#cancelaAtualizacao")
const tableDespesas = document.querySelector("#tableDespesas")
//Nova despesa
const divNovosDados = document.querySelector("#div-novos-dados")
const nomeNovaDespesa = document.querySelector("#nomeNovaDespesa")
const dateNovaDespesa = document.querySelector("#dateNovaDespesa")
const categoriaNovaDespesa = document.querySelector("#categoriaNovaDespesa")
const contaNovaDespesa = document.querySelector("#contaNovaDespesa")
const valorNovaDespesa = document.querySelector("#valorNovaDespesa")
const repetirDespesa = document.querySelector("#repetirDespesa")
const efetivadaNovaDespesa = document.querySelector("#efetivadaNovaDespesa")
//filtro
const categoriaFiltro = document.querySelector("#categoriaFiltro")
const contaFiltro = document.querySelector("#contaFiltro")
const dateFiltro = document.querySelector("#dateDespesaFiltro")
//
const previsaoSaldoMes = document.querySelector("#previsaoMes")
let totalDespesa = [];

/**
 * @description Verifica se existe usuário.
*/
function verificaUser(){
    firebase.auth().onAuthStateChanged( (user) => {
        if (user) {
            init()
        } else {
            console.log('Usuário não logado')
        }
    });
}

/**
 * @description Inicia os metódos para a página
 */
function init(){
    const dataHoje = new Date();
    const dia = formataDia(dataHoje)
    const mes = formataMes(dataHoje)
    const ano = dataHoje.getFullYear()
    document.querySelector("#nav-despesas").classList.add("principal")
    preencheComboCategorias()
    preencheComboContas()
    preencheDataAtual(dia, mes, ano)
    getAllDespesasMes(mes, ano, "", "")
}

function previsaoMes(){
    let banksAndValues = "";
    totalDespesa.forEach(bank => {
        const simbolo = simboloDaMoeda(bank.coin)
        banksAndValues += `${bank.bank}: ${simbolo} ${bank.expenseValue} \n`
    })
    previsaoSaldoMes.innerText = banksAndValues
}

/**
 * 
 * @param {string} moeda 
 * @returns Símbolo da moeda
 */
function simboloDaMoeda(moeda){
    let simboloMoeda = ""
    if(moeda === "BRL"){
        simboloMoeda = "R$ "
    }else if(moeda === "EUR"){
        simboloMoeda = "€ "
    }else if(moeda === "USD"){
        simboloMoeda = "$ "
    }
    return simboloMoeda
}

/**
 * 
 * @param {string} dia 
 * @param {string} mes 
 * @param {string} ano 
 * @description preenche data atual 
 */
function preencheDataAtual(dia, mes, ano){
    dateNovaDespesa.value = ano + "-" + mes + "-" + dia
    dateFiltro.value = ano + "-" + mes
}

/**
 * @description Preenche os combos de categorias
 */
function preencheComboCategorias(){
    const response = getCategoriasDeDespesa(firebase.auth().currentUser.uid)
    response.then(tiposDeDespesas => {
        tiposDeDespesas.forEach(tipoDespesa => {
            const option = document.createElement("option")
            option.value = tipoDespesa.data().nome
            option.innerText = tipoDespesa.data().nome
            categoriaNovaDespesa.appendChild(option)
            const optionFiltro = document.createElement("option")
            optionFiltro.innerText = tipoDespesa.data().nome
            categoriaFiltro.appendChild(optionFiltro)
        });
    }).catch(error =>{
        console.log(error.message);
    })
}

/**
 * @description Preeche os combos de contas
 */
function preencheComboContas(){
    const response = getContas(firebase.auth().currentUser.uid)
    response.then(contas => {
        contas.forEach(conta => {
            const option = document.createElement("option")
            option.value = conta.id + "--"+conta.data().moeda
            option.innerText = conta.data().nome
            contaNovaDespesa.appendChild(option)
            const optionFiltro = document.createElement("option")
            optionFiltro.innerText = conta.data().nome
            contaFiltro.appendChild(optionFiltro)
        });
    }).catch(error =>{
        console.log(error.message);
    })
}

/**
 * @description Carrega todas as despesas do usuário na table de despesas
 */
 function getAllDespesasMes(mes, ano, categoria, conta){
    totalDespesa = []
    while(tableDespesas.childNodes.length > 2){
        tableDespesas.removeChild(tableDespesas.lastChild);
    }
    const dataStart = ano + "-" + mes
    const mesEnd = parseInt(mes) === 12 ? "01" : "0" + (parseInt(mes) + 1)
    const dataEnd = ano + "-" + mesEnd
    const response = getDespesasMes(firebase.auth().currentUser.uid, dataStart, dataEnd, categoria, conta)
    response.then((despesas) => {
        despesas.forEach(despesa => {
            const despesaJSON = despesa.data()
            despesaJSON.id = despesa.id
            
            let bankAlreadyExist = false;
            
            totalDespesa.forEach(despesaBank => {
                if(despesaBank.bank === despesaJSON.conta.nome){
                    despesaBank.expenseValue += parseFloat(despesaJSON.valor)
                    bankAlreadyExist = true
                }
            })

            if(!bankAlreadyExist){
                totalDespesa.push({
                    "bank": despesaJSON.conta.nome,
                    "expenseValue": parseFloat(despesaJSON.valor),
                    "coin": despesaJSON.conta.moeda
                })
            }
            
            updateTable(despesaJSON)
        });
        previsaoMes()
    }).catch(error =>{
        console.log(error.message);
    })
}

/**
 * @description Filtro por mês de acordo com o dateFiltro
 */
dateFiltro.addEventListener("change", () => {
    filtroPesquisa()
})

/**
 * @description Filtro por categoria
 */
categoriaFiltro.addEventListener("change", () => {
    filtroPesquisa()
})

/**
 * @description Filtro por conta
 */
contaFiltro.addEventListener("change", () => {
    filtroPesquisa()
})

/**
 * @description Filtrar
 */
function filtroPesquisa(){
    const dateFiltroSplit = dateFiltro.value.split("-")
    getAllDespesasMes(dateFiltroSplit[1], dateFiltroSplit[0], categoriaFiltro.value, contaFiltro.value)
}

/**
 * 
 * @param {JSON} despesa 
 * @description Carrega a table
 */
 function updateTable(despesa){
    const tr = document.createElement("TR")
    const tdNome = document.createElement("TD")
    const tdData = document.createElement("TD")
    const tdCategoria = document.createElement("TD")
    const tdConta = document.createElement("TD")
    const tdValor = document.createElement("TD")
    const tdEfetivada = document.createElement("TD")
    const btnExcluir = document.createElement("BUTTON")
    const btnAtualizar = document.createElement("BUTTON")
    
    btnExcluir.innerText = "Exluir"
    btnExcluir.classList.add("btn-table")
    btnAtualizar.innerText = "Alterar"
    btnAtualizar.classList.add("btn-table")

    tdNome.innerText = despesa.nome 
    tdData.innerText = despesa.data
    tdCategoria.innerText = despesa.categoria
    tdConta.innerText = typeof despesa.conta === "string" ? despesa.conta : despesa.conta.nome
    tdValor.innerText = simboloDaMoeda(despesa.conta.moeda) + despesa.valor
    tr.appendChild(tdNome)
    tr.appendChild(tdData)
    tr.appendChild(tdCategoria)
    tr.appendChild(tdConta)
    tr.appendChild(tdValor)
    tr.appendChild(tdEfetivada)
    tr.appendChild(btnAtualizar)
    tr.appendChild(btnExcluir)
    
    if(despesa.efetivada === "N"){
        btnPagar(tdEfetivada, despesa)
    }else{
        btnEfetivada(tdEfetivada, despesa)
    }

    tableDespesas.appendChild(tr)

    btnAtualizar.addEventListener("click", () => {
        const tableButtons = document.querySelectorAll("table button")
        for(var i = 0; i < tableButtons.length; i++){
            tableButtons[i].classList.add("disabled-button")
        }
        efetivadaNovaDespesa.classList.add("hidden-class")
        btnCadastrar.classList.add("hidden-class")
        repetirDespesa.classList.add("hidden-class")
        btnCancelar.classList.remove("hidden-class")
        nomeNovaDespesa.value = despesa.nome
        dateNovaDespesa.value = despesa.data
        categoriaNovaDespesa.value = despesa.categoria
        contaNovaDespesa.value = despesa.conta.id + "--" + despesa.conta.moeda
        valorNovaDespesa.value = despesa.valor
        efetivadaNovaDespesa.value = despesa.efetivada
        nomeNovaDespesa.focus()

        const btnAtualizarDespesas = document.createElement("BUTTON")
        btnAtualizarDespesas.innerText = "Atualizar"
        divNovosDados.appendChild(btnAtualizarDespesas)
        
        btnAtualizarDespesas.addEventListener("click", () => {
            despesa = getDespesaJson(despesa.id)
            
            getDespesa(firebase.auth().currentUser.uid, despesa.id)
            .then(despesaDB => {

                if(despesa.conta.nome != despesaDB.data().conta.nome && 
                    despesaDB.data().efetivada === "S"){

                    alert("Não possível alterar a conta de uma despesa já paga.\n Devolva a despesa para alterar a conta!")
                }else{
                    atualizaDespesa(firebase.auth().currentUser.uid, despesa.id, despesa)
                    tdNome.innerText = despesa.nome 
                    tdData.innerText = despesa.data
                    tdCategoria.innerText = despesa.categoria
                    tdConta.innerText = despesa.conta.nome     
                    tdValor.innerText = simboloDaMoeda(despesa.conta.moeda) + despesa.valor
                    
                    cancelar(btnAtualizarDespesas)
                }
            }).catch(error => {
                alert(error.mesage)
            })
        })

        btnCancelar.addEventListener("click", () => {
            cancelar(btnAtualizarDespesas)
        })
    })

    btnExcluir.addEventListener("click", () => {
        if(despesa.efetivada === "S"){
            creditarDespesa(despesa)
        }
        excluirDespesa(firebase.auth().currentUser.uid, despesa.id)
        tr.remove()
    })

}

/**
 * @description Pagar despesa
 * @param {String} tdEfetivada 
 * @param {JSON} despesa 
 */
function btnPagar(tdEfetivada, despesa){
    const btnPagar = document.createElement("BUTTON")
    btnPagar.classList.add("btn-table")
    btnPagar.classList.add("btn-pagar")
    btnPagar.innerText = "Pagar"
    for (child of tdEfetivada.children){
        child.remove();
    }
    tdEfetivada.appendChild(btnPagar)
    btnPagar.addEventListener("click", () => {
        despesa.efetivada = "S"
        debitarDespesa(despesa)
        receberDevolverDespesa(firebase.auth().currentUser.uid, despesa.id, despesa.efetivada)
        btnEfetivada(tdEfetivada, despesa)
    })
}

/**
 * @description Reembolsar despesa paga
 * @param {String} tdEfetivada 
 * @param {Json} despesa 
 */
function btnEfetivada(tdEfetivada, despesa){
    const btnEfetivada = document.createElement("BUTTON")
    btnEfetivada.classList.add("btn-table")
    btnEfetivada.innerText = "Efetivada"
    for (child of tdEfetivada.children){
        child.remove();
    }
    tdEfetivada.appendChild(btnEfetivada)
    btnEfetivada.addEventListener("click", () => {
        despesa.efetivada = "N"
        creditarDespesa(despesa)
        receberDevolverDespesa(firebase.auth().currentUser.uid, despesa.id, despesa.efetivada)
        btnPagar(tdEfetivada, despesa)
    })
}

/**
 * 
 * @param {String} id 
 * @returns Json de Despesa
 */
function getDespesaJson(id){
    const contaValue = contaNovaDespesa.value.split("--")
    const despesaJson = {"nome": nomeNovaDespesa.value,
                        "data": dateNovaDespesa.value,
                        "categoria": categoriaNovaDespesa.value,
                        "conta": {
                            "id": contaValue[0],
                            "nome": contaNovaDespesa.selectedOptions[0].innerText,
                            "moeda": contaValue[1]
                        },
                        "valor": valorNovaDespesa.value,
                        "efetivada": efetivadaNovaDespesa.value
                    }

    if(id !== undefined){
        despesaJson.id = id
        return despesaJson
    }
    return despesaJson
        
 }

/**
 * @description Click do botão para cadastrar despesa
 */
btnCadastrar.addEventListener("click", () => {
    cadastrarDespesa()
})

/**
 * 
 * @param {string} dataDespesa 
 * @returns dia formatado
 */
function formataDia(dataDespesa){
    return dataDespesa.getDate().toString().length === 2 ? dataDespesa.getDate() : "0" + dataDespesa.getDate()
}

/**
 * 
 * @param {string} dataDespesa 
 * @returns Mês formatado
 */
function formataMes(dataDespesa){
    return (dataDespesa.getMonth() + 1).toString().length === 2 ? (dataDespesa.getMonth() + 1) : "0" + (dataDespesa.getMonth() + 1)
}

/**
 * @description Cadastrar despesa
 */
function cadastrarDespesa(){
    const despesaJSON = getDespesaJson()
    let qtdRepetirDespesa = parseInt(repetirDespesa.value);
    cadastrarDespesaDB(despesaJSON, qtdRepetirDespesa, dateFiltro.value, null)
}

/**
 * 
 * @param {JSON} despesaJSON 
 * @param {int} repeticao 
 * @param {string} mesFiltro 
 */
function cadastrarDespesaDB(despesaJSON, repeticao, mesFiltro, numero){
    const nome = despesaJSON.nome
    if(numero === null && repeticao > 1){
        numero = repeticao;
        despesaJSON.nome += ` 1/${numero}`
    }else if(repeticao >= 1 && numero != null){
        const qtd = (numero - repeticao + 1).toString()
        despesaJSON.nome += ` ${qtd}/${numero}`
    }

    criarDespesa(firebase.auth().currentUser.uid, despesaJSON)
    .then((despesa) => {
        despesaJSON.id = despesa.id
        if(despesaJSON.efetivada === "S"){
            debitarDespesa(despesaJSON)
        }
        if(despesaJSON.data.includes(mesFiltro)){
            updateTable(despesaJSON)
        }
        repeticao--
        if(repeticao > 0){
            despesaJSON.data = validaDataRepetição(despesaJSON.data)
            despesaJSON.nome = nome
            cadastrarDespesaDB(despesaJSON, repeticao, mesFiltro, numero)
        }else{
            limparCadastro()
        }
    }).catch(error => {
        console.log(error.message)
    })
}

/**
 * 
 * @param {int} i 
 * @param {string} ano 
 * @param {string} mes 
 * @param {string} dia 
 * @returns data validada
 */
function validaDataRepetição(dataJson){
    const dataDespesa = new Date(dataJson);
    let dia = formataDia(dataDespesa)
    dia = (parseInt(dia) + 1).toString().length === 2 ? (parseInt(dia) + 1).toString() : "0" + (parseInt(dia) + 1).toString()
    let mes = formataMes(dataDespesa)
    let ano = dataDespesa.getFullYear()

    if(mes === "12"){
        mes = "01"
        ano = (parseInt(ano) + 1).toString()
    }else{
        mes = (parseInt(mes) + 1).toString().length === 2 ? (parseInt(mes) + 1) : "0" + (parseInt(mes) + 1)
    }

    if(mes === "02" && parseInt(dia) > 28){
        dia = "28"
    }
    return `${ano}-${mes}-${dia}`
}

/**
 * @description Debita o valor da despesa do total da conta
 * @param {Json} despesaJSON 
 */
function debitarDespesa(despesaJSON){
    getConta(firebase.auth().currentUser.uid, despesaJSON.conta.id)
    .then(conta => {
        const novoSaldo = conta.data().saldo - despesaJSON.valor
        atualizaSaldoConta(firebase.auth().currentUser.uid, conta.id, novoSaldo)
    }).catch(error =>{
        console.log(error.message)
    })
}

/**
 * @description Credita o valor da despesa do total da conta
 * @param {Json} despesaJSON 
 */
 function creditarDespesa(despesaJSON){
    getConta(firebase.auth().currentUser.uid, despesaJSON.conta.id)
    .then(conta => {
        const novoSaldo = parseFloat(conta.data().saldo) + parseFloat(despesaJSON.valor)
        atualizaSaldoConta(firebase.auth().currentUser.uid, conta.id, novoSaldo)
    }).catch(error =>{
        console.log(error.message)
    })
}

/**
 * @description limpa os valores da parte de cadastro
 */
function limparCadastro(){
    nomeNovaDespesa.value = ""
    dateNovaDespesa.innerText = ""
    categoriaNovaDespesa.value = ""
    contaNovaDespesa.value = ""
    valorNovaDespesa.value = ""
    efetivadaNovaDespesa.value = "N"
    repetirDespesa.value = "1"
}

/**
 * @description Cancela operação
 * @param {BUTTON} btnAtualizarDespesas 
 */
function cancelar(btnAtualizarDespesas){
    efetivadaNovaDespesa.classList.remove("hidden-class")
    const tableButtons = document.querySelectorAll("table button")
    btnCadastrar.classList.remove("hidden-class")
    repetirDespesa.classList.remove("hidden-class")
    btnAtualizarDespesas.remove()
    btnCancelar.classList.add("hidden-class")
    for(var i = 0; i < tableButtons.length; i++){
        tableButtons[i].classList.remove("disabled-button")
    }
    limparCadastro()
}

//MAIN

verificaUser()