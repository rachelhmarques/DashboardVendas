/**
 * ============================================================================
 * PROJETO TCC: Módulo de Back-end (Google Apps Script)
 * ARQUIVO: RotinasPDF.js
 * AUTORIA: Rachel H. Marques
 * DESCRIÇÃO: Componente servidor responsável por regras de negócios, segurança,
 * injeção de dados ou integrações de IA.
 * ============================================================================
 */

// Esta função deve ser agendada no Apps Script (Gatilhos) para rodar a cada 1 hora
function verificarEnvioPDFs() {
  var planAcessos = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("acessos");
  if (!planAcessos) return;
  
  var dados = planAcessos.getDataRange().getValues();
  var horaAtual = new Date().getHours();
  
  // Começamos em 1 para pular o cabeçalho
  for (var i = 1; i < dados.length; i++) {
    var usuario = dados[i][0];
    var acesso  = dados[i][1];
    var email   = dados[i][2];
    var horario = dados[i][3]; // Ex: 23
    var enviarManual = dados[i][4]; // "Sim"
    
    // Verifica se devemos enviar (se o email estiver preenchido)
    if (email && email.toString().trim() !== "") {
      
      var deveEnviar = false;
      
      // Checa envio manual
      if (enviarManual && enviarManual.toString().toLowerCase() === "sim") {
        deveEnviar = true;
      }
      
      // Checa envio agendado
      if (horario !== "" && parseInt(horario) === horaAtual) {
        deveEnviar = true;
      }
      
      if (deveEnviar) {
        // Envia o PDF!
        construirEEnviarPDF(usuario, acesso, email);
        
        // Se foi enviado manual, limpamos o "Sim" da coluna E para não enviar de novo repetidamente
        if (enviarManual && enviarManual.toString().toLowerCase() === "sim") {
          planAcessos.getRange(i + 1, 5).setValue(""); // Limpa a célula de "Enviar PDF manual"
        }
      }
    }
  }
}

// Função acionada pelo botão no painel web (Front-End)
function enviarPDFPersonalizado(usuarioDigitado, emailCustomizado, ccCustomizado) {
  var planAcessos = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("acessos");
  if (!planAcessos) return "Erro: Aba acessos não encontrada.";
  
  var dados = planAcessos.getDataRange().getValues();
  for (var i = 1; i < dados.length; i++) {
    var usuario = dados[i][0];
    if (usuario.toString().toLowerCase() === usuarioDigitado.toString().toLowerCase()) {
      var acesso = dados[i][1];
      
      // Usa o e-mail customizado se preenchido, senão cai pro da planilha
      var emailDestino = (emailCustomizado && emailCustomizado.trim() !== "") ? emailCustomizado : dados[i][2];
      
      if (emailDestino && emailDestino.toString().trim() !== "") {
        construirEEnviarPDF(usuario, acesso, emailDestino, ccCustomizado);
        return "Tudo certo! PDF enviado com sucesso para: " + emailDestino + (ccCustomizado ? (" com cópia para " + ccCustomizado) : "");
      } else {
        return "Erro: Você precisa digitar um e-mail válido para envio.";
      }
    }
  }
  return "Erro: Usuário não localizado para enviar o e-mail.";
}

// Constrói o PDF processando os dados e usando o Gerador NATIVO de gráficos do Google Servidor
function construirEEnviarPDF(usuario, acessoLiberado, emailDestino, emailCc) {
  var planVendas = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("vendas");
  if (!planVendas) return;
  
  var dadosVendas = planVendas.getDataRange().getValues();
  var cabecalhos = dadosVendas[0];
  var linhas = dadosVendas.slice(1);
  
  // 1. Filtrar Dados Baseados na Regra de Segurança (RLS)
  var listaAcessos = acessoLiberado.toString().toLowerCase().split(',').map(function(i) { return i.trim(); });
  var idxRegiao = cabecalhos.indexOf("Regiao");
  var idxVendas = cabecalhos.indexOf("Vendas");
  var idxLucro = cabecalhos.indexOf("Lucro");
  var idxCategoria = cabecalhos.indexOf("Categoria");
  var idxData = cabecalhos.indexOf("Data");
  
  var vTot = 0;
  var lTot = 0;
  var qtdVendas = 0;
  
  var somaRegiao = {};
  var somaCategoria = {};
  var somaMeses = {};
  var dadosDispersao = [];
  var regCatSoma = {}; // Para empilhadas
  var todasCategorias = new Set();
  
  linhas.forEach(function(linha) {
    var regiaoLinha = linha[idxRegiao] ? linha[idxRegiao].toString().toLowerCase() : "";
    
    if (listaAcessos.includes("*") || listaAcessos.includes(regiaoLinha)) {
      var venda = parseFloat(linha[idxVendas]) || 0;
      var lucro = parseFloat(linha[idxLucro]) || 0;
      var cat = linha[idxCategoria] || "Outros";
      var reg = linha[idxRegiao] || "Outros";
      
      var dataObj = new Date(linha[idxData]);
      var strAnoMes = dataObj.getFullYear() + "-" + ("0" + (dataObj.getMonth()+1)).slice(-2);
      
      vTot += venda;
      lTot += lucro;
      qtdVendas += 1;
      
      somaRegiao[reg] = (somaRegiao[reg] || 0) + venda;
      somaCategoria[cat] = (somaCategoria[cat] || 0) + venda;
      somaMeses[strAnoMes] = (somaMeses[strAnoMes] || 0) + venda;
      dadosDispersao.push([venda, lucro]);
      
      todasCategorias.add(cat);
      if(!regCatSoma[reg]) regCatSoma[reg] = {};
      regCatSoma[reg][cat] = (regCatSoma[reg][cat] || 0) + venda;
    }
  });
  
  if (qtdVendas === 0) return;
  
  var tMedio = vTot / qtdVendas;
  var fmtVTot = vTot.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
  var fmtLTot = lTot.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
  var fmtTMed = tMedio.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

  // 2. Gerar Gráficos Nativos do Google (Renderização no Servidor)
  // Gráfico 1: Região
  var dtRegiao = Charts.newDataTable().addColumn(Charts.ColumnType.STRING, "Região").addColumn(Charts.ColumnType.NUMBER, "Faturamento");
  for (var r in somaRegiao) { dtRegiao.addRow([r, somaRegiao[r]]); }
  var chartRegiao = Charts.newColumnChart().setDataTable(dtRegiao.build()).setDimensions(600, 350).setTitle("1. Faturamento Bruto por Região").setColors(["#1f77b4"]).build();
    
  // Gráfico 2: Categoria
  var dtCat = Charts.newDataTable().addColumn(Charts.ColumnType.STRING, "Categoria").addColumn(Charts.ColumnType.NUMBER, "Faturamento");
  for (var c in somaCategoria) { dtCat.addRow([c, somaCategoria[c]]); }
  var chartCat = Charts.newPieChart().setDataTable(dtCat.build()).setDimensions(600, 350).setTitle("2. Distribuição por Categoria").set3D().build();
  
  // Gráfico 3: Linha de Tendência Mensal
  var dtMeses = Charts.newDataTable().addColumn(Charts.ColumnType.STRING, "Mês").addColumn(Charts.ColumnType.NUMBER, "Vendas");
  var mesesOrder = Object.keys(somaMeses).sort();
  for(var i=0; i<mesesOrder.length; i++) { dtMeses.addRow([mesesOrder[i], somaMeses[mesesOrder[i]]]); }
  var chartLinha = Charts.newLineChart().setDataTable(dtMeses.build()).setDimensions(600, 300).setTitle("3. Tendência de Vendas Mensais").setColors(["#2ca02c"]).build();

  // 3. Montar o HTML para o PDF
  var htmlStr = "<html><head><style>" +
    "body { font-family: Arial, sans-serif; padding: 20px; color: #333; }" +
    ".header { text-align: center; border-bottom: 2px solid #0d6efd; padding-bottom: 10px; margin-bottom: 20px; }" +
    ".kpi-container { width: 100%; display: table; margin-bottom: 30px; }" +
    ".kpi-box { display: table-cell; text-align: center; background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #ddd; }" +
    ".kpi-title { font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; }" +
    ".kpi-val { font-size: 20px; color: #000; font-weight: bold; }" +
    ".chart-box { text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; page-break-inside: avoid; }" +
    ".chart-title { font-size: 16px; color: #333; font-weight: bold; margin-bottom: 10px; }" +
    "</style></head><body>";
    
  htmlStr += "<div class='header'><h2>Relatório de Vendas Consolidado</h2>";
  htmlStr += "<p>Filtro Ativo: <b>" + (acessoLiberado === "*" ? "Visão Global (Todas as Regiões)" : acessoLiberado) + "</b> | Data de Emissão: " + new Date().toLocaleDateString('pt-BR') + "</p></div>";
  
  // KPIs
  htmlStr += "<div class='kpi-container'>";
  htmlStr += "<div class='kpi-box'><div class='kpi-title'>Faturamento Bruto</div><div class='kpi-val'>" + fmtVTot + "</div></div>";
  htmlStr += "<div style='display:table-cell; width:20px;'></div>"; // Spacer
  htmlStr += "<div class='kpi-box'><div class='kpi-title'>Lucro Líquido Realizado</div><div class='kpi-val'>" + fmtLTot + "</div></div>";
  htmlStr += "<div style='display:table-cell; width:20px;'></div>"; // Spacer
  htmlStr += "<div class='kpi-box'><div class='kpi-title'>Ticket Médio por Venda</div><div class='kpi-val'>" + fmtTMed + "</div></div>";
  htmlStr += "</div>";
  
  // Inserir Gráficos
  var b64Regiao = Utilities.base64Encode(chartRegiao.getAs('image/png').getBytes());
  htmlStr += "<div class='chart-box'><div class='chart-title'>1. Faturamento Bruto por Região</div><img src='data:image/png;base64," + b64Regiao + "' /></div>";
  
  var b64Cat = Utilities.base64Encode(chartCat.getAs('image/png').getBytes());
  htmlStr += "<div class='chart-box'><div class='chart-title'>2. Distribuição por Categoria</div><img src='data:image/png;base64," + b64Cat + "' /></div>";

  var b64Linha = Utilities.base64Encode(chartLinha.getAs('image/png').getBytes());
  htmlStr += "<div class='chart-box'><div class='chart-title'>3. Tendência de Vendas Mensais</div><img src='data:image/png;base64," + b64Linha + "' /></div>";
  
  htmlStr += "</body></html>";
  
  // 4. Converter HTML para PDF
  var htmlOutput = HtmlService.createHtmlOutput(htmlStr);
  var pdfBlob = htmlOutput.getAs(MimeType.PDF).setName("Relatorio_Gerencial_Vendas_" + usuario + ".pdf");
  
  // 5. Enviar por E-mail
  var assunto = "📊 Seu Relatório Gerencial de Vendas - " + (acessoLiberado === "*" ? "Global" : acessoLiberado);
  var corpo = "Olá,\n\nSegue em anexo o relatório executivo em PDF com os resultados financeiros.\nFiltro aplicado: " + (acessoLiberado === "*" ? "Todas as Regiões" : acessoLiberado) + ".\n\nAtenciosamente,\nRobô de Automação Google Apps Script";
  
  var configs = {
    to: emailDestino,
    subject: assunto,
    body: corpo,
    attachments: [pdfBlob]
  };
  
  // Se veio com cópia (cc), adicionamos na configuração do MailApp
  if (emailCc && emailCc.trim() !== "") {
    configs.cc = emailCc;
  }
  
  MailApp.sendEmail(configs);
}


// ====================================================================
// FUNÇÃO PARA INSTALAR O GATILHO AUTOMATICAMENTE
// ====================================================================
function LIGAR_ROBO_AUTOMATICO() {
  // 1. Deletar robôs antigos para evitar envio duplicado
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "verificarEnvioPDFs") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  // 2. Criar um novo robô programado para rodar a cada 1 hora
  ScriptApp.newTrigger("verificarEnvioPDFs")
    .timeBased()
    .everyHours(1)
    .create();
    
  try {
    SpreadsheetApp.getUi().alert("▶️ Robô de PDFs ligado com sucesso!\nEle vai ler sua planilha de hora em hora e enviar os relatórios.");
  } catch(e) {}
}

function DESLIGAR_ROBO_AUTOMATICO() {
  var triggers = ScriptApp.getProjectTriggers();
  var excluidos = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "verificarEnvioPDFs") {
      ScriptApp.deleteTrigger(triggers[i]);
      excluidos++;
    }
  }
  
  try {
    if (excluidos > 0) {
      SpreadsheetApp.getUi().alert("⏸️ Robô de PDFs desligado.\nNenhum e-mail será enviado automaticamente nos horários.");
    } else {
      SpreadsheetApp.getUi().alert("O robô já estava desligado.");
    }
  } catch(e) {}
}
