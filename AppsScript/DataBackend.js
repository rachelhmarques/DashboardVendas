/**
 * ============================================================================
 * PROJETO TCC: Módulo de Back-end (Google Apps Script)
 * ARQUIVO: DataBackend.js
 * AUTORIA: Rachel H. Marques
 * DESCRIÇÃO: Componente servidor responsável por regras de negócios, segurança,
 * injeção de dados ou integrações de IA.
 * ============================================================================
 */

// Função acionada após o Login bem sucedido para baixar os dados de vendas
function obterDadosPlanilhaSeguro(acessoLiberado) {
  var plan = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("vendas");
  if (!plan) return JSON.stringify({ erro: "Aba 'vendas' não encontrada na planilha." });
  
  var dados = plan.getDataRange().getValues();
  
  var cabecalhos = dados[0];
  var linhas = dados.slice(1);
  
  var jsonArray = [];
  
  linhas.forEach(function(linha) {
    var obj = {};
    cabecalhos.forEach(function(cabecalho, index) {
      if (cabecalho === "Data") { if (linha[index] instanceof Date) { obj[cabecalho] = linha[index].toISOString().split("T")[0]; } else { obj[cabecalho] = linha[index].toString().split("T")[0]; } } else { obj[cabecalho] = linha[index]; }
    });
    
    // 🔥 REGRA DE OURO DA SEGURANÇA (BACK-END)
    // Permite que o acesso tenha múltiplas regiões separadas por vírgula (Ex: "Leste, Oeste")
    var listaAcessos = acessoLiberado.toString().toLowerCase().split(',').map(function(i) { return i.trim(); });
    var regiaoAtual = obj["Regiao"].toString().toLowerCase();

    // Se o acesso for "*", ou se a lista de acessos incluir a Região da linha atual
    if (listaAcessos.includes("*") || listaAcessos.includes(regiaoAtual)) {
      jsonArray.push(obj);
    }
  });
  
  return JSON.stringify(jsonArray);
}
