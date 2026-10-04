/**
 * ============================================================================
 * PROJETO TCC: Módulo de Back-end (Google Apps Script)
 * ARQUIVO: MassaDados.js
 * AUTORIA: Rachel H. Marques
 * DESCRIÇÃO: Componente servidor responsável por regras de negócios, segurança,
 * injeção de dados ou integrações de IA.
 * ============================================================================
 */

function gerarMassaDados2023_2026() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("vendas") || ss.getSheets()[0];
  if (!sheet) return;
  
  var lastRow = sheet.getLastRow();
  
  // 1. LIMPEZA TOTAL (Preserva apenas a linha 1 - Cabeçalho)
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 6).clearContent();
  }
  
  // 2. POSIÇÕES FIXAS DAS COLUNAS (A=0, B=1, C=2, D=3, E=4, F=5)
  // Data, Categoria, Região, Custo, Vendas, Lucro
  var regioes = ["Leste", "Oeste", "Norte", "Sul"];
  var categorias = ["Eletrônicos", "Móveis", "Alimentos", "Roupas"];
  
  var novasLinhas = [];
  var start = new Date(2023, 0, 1).getTime(); 
  var end = new Date(2026, 11, 31).getTime(); 
  
  // GERANDO OS 2000 DADOS ALEATÓRIOS
  for (var i = 0; i < 2000; i++) {
    var dtTime = new Date(start + Math.random() * (end - start));
    var ano = dtTime.getFullYear();
    var mes = ("0" + (dtTime.getMonth() + 1)).slice(-2);
    var dia = ("0" + dtTime.getDate()).slice(-2);
    var strDataOriginal = "'" + ano + "-" + mes + "-" + dia + "T00:00:00.000";
    
    var reg = regioes[Math.floor(Math.random() * regioes.length)];
    var cat = categorias[Math.floor(Math.random() * categorias.length)];
    
    var cst = (Math.random() * 500 + 10).toFixed(2); 
    var vds = (parseFloat(cst) * (1.1 + Math.random())).toFixed(2);
    var lcr = (parseFloat(vds) - parseFloat(cst)).toFixed(2);
    
    novasLinhas.push([strDataOriginal, cat, reg, "'" + cst, "'" + vds, "'" + lcr]);
  }
  
  if (novasLinhas.length > 0) {
    sheet.getRange(2, 1, novasLinhas.length, 6).setValues(novasLinhas);
    SpreadsheetApp.getUi().alert("Reconstrução Completa! Injetados " + novasLinhas.length + " registros (incluindo as anomalias do seu slide).");
  }
}

