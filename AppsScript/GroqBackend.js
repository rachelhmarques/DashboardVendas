function consultarGroq(pergunta, usuarioAtivo) {
  try {
    // 1. Pegar acesso do usuário
    var planAcessos = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("acessos");
    var dadosAcessos = planAcessos.getDataRange().getValues();
    var acessoLiberado = "";
    
    for (var i = 1; i < dadosAcessos.length; i++) {
      var loginWeb = dadosAcessos[i][0] ? dadosAcessos[i][0].toString().toLowerCase() : "";
      var loginTelegram = dadosAcessos[i][5] ? dadosAcessos[i][5].toString().toLowerCase() : ""; // Coluna F
      var usuarioBuscado = usuarioAtivo.toString().toLowerCase();
      
      if (loginWeb === usuarioBuscado || loginTelegram === usuarioBuscado) {
        acessoLiberado = dadosAcessos[i][1];
        break;
      }
    }
    
    if (!acessoLiberado) return "Usuário sem permissão.";
    var listaAcessos = acessoLiberado.toString().toLowerCase().split(',').map(function(i){return i.trim()});
    
    // 2. Pegar os dados de Vendas e Filtrar
    var planVendas = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("vendas");
    var dadosVendas = planVendas.getDataRange().getValues();
    var cabecalho = dadosVendas[0];
    
    var idxRegiao = cabecalho.indexOf("Regiao");
    var csvLinhas = [];
    csvLinhas.push(cabecalho.join(";"));
    
    for (var j = 1; j < dadosVendas.length; j++) {
      var regiaoLinha = dadosVendas[j][idxRegiao] ? dadosVendas[j][idxRegiao].toString().toLowerCase() : "";
      if (listaAcessos.includes("*") || listaAcessos.includes(regiaoLinha)) {
        var linhaCopy = dadosVendas[j].slice();
        var dt = linhaCopy[cabecalho.indexOf("Data")];
        if (dt) {
          var dataFormatada = new Date(dt);
          dataFormatada.setMinutes(dataFormatada.getMinutes() + dataFormatada.getTimezoneOffset());
          if (!isNaN(dataFormatada.getTime())) {
            linhaCopy[cabecalho.indexOf("Data")] = dataFormatada.toLocaleDateString("pt-BR");
          }
        }
        csvLinhas.push(linhaCopy.join(";"));
      }
    }
    
    var csvPronto = csvLinhas.join("\n");
    
    // 3. Prompt Base
    var dataAtual = new Date().toLocaleDateString("pt-BR");
    var promptSistema = "Você é um Analista de BI sênior de uma empresa. O usuário está vendo um Dashboard de Vendas.\n";
    promptSistema += "ATENÇÃO: A moeda OFICIAL da empresa é o Real Brasileiro (R$). NUNCA use Euros ou Dólares.\n";
    promptSistema += "A data de hoje é: " + dataAtual + ".\n";
    promptSistema += "Abaixo estão os dados reais da base (formato CSV separado por ';'), já filtrados pela regra de acesso dele (RLS).\n";
    promptSistema += "ATENÇÃO: Todas as datas na coluna 'Data' do CSV estão no formato brasileiro (DD/MM/AAAA).\n";
    promptSistema += "Baseado ESTRITAMENTE nesses dados, responda a pergunta do usuário de forma amigável, direta e curta. Destaque os números importantes.\n";
    promptSistema += "Se o usuário pedir um GRÁFICO (chart, visualização), você deve incluir no final da sua resposta um bloco JSON válido do Chart.js V2 dentro da tag [GRAFICO_CHARTJS] e [/GRAFICO_CHARTJS]. Exemplo:\n";
    promptSistema += "[GRAFICO_CHARTJS]{\"type\":\"bar\",\"data\":{\"labels\":[\"A\",\"B\"],\"datasets\":[{\"label\":\"Vendas\",\"data\":[10,20]}]}}[/GRAFICO_CHARTJS]\n";
    promptSistema += "Importante: Apenas o JSON puro e estrito (sem quebras de linha ou bloco de markdown) entre as tags.\n";
    promptSistema += "Se ele perguntar algo que não está nos dados, diga que não sabe. Evite falar em jargões técnicos sobre CSV.\n\n";
    promptSistema += "DADOS:\n" + csvPronto;

    if (pergunta.trim() === "/debugcsv") {
      var debugStr = "DEBUG - DADOS:\n" + csvPronto;
      return debugStr.length > 3500 ? debugStr.substring(0, 3500) + "\n...(cortado devido ao limite do Telegram)" : debugStr;
    }
        var chaveGroq = PropertiesService.getScriptProperties().getProperty("GROQ_API_KEY");
    if (!chaveGroq) return "Erro: Chave GROQ_API_KEY não foi encontrada nas Propriedades do Script.";

    var mensagensGroq = [
      {"role": "system", "content": promptSistema},
      {"role": "user", "content": pergunta}
    ];
    var urlGroq = "https://api.groq.com/openai/v1/chat/completions";
    var listaModelos = [
      "llama3-70b-8192",
      "mixtral-8x7b-32768",
      "gemma2-9b-it"
    ];

    var erroFinal = "";
    for (var m = 0; m < listaModelos.length; m++) {
      var payloadGroq = {"model": listaModelos[m], "messages": mensagensGroq, "temperature": 0.2};
      var optionsGroq = {"method": "post", "headers": {"Authorization": "Bearer " + chaveGroq, "Content-Type": "application/json"}, "payload": JSON.stringify(payloadGroq), "muteHttpExceptions": true};
      try {
        var resGroq = UrlFetchApp.fetch(urlGroq, optionsGroq);
        var codGroq = resGroq.getResponseCode();
        var corpGroq = JSON.parse(resGroq.getContentText());
        if (codGroq === 200 && corpGroq.choices && corpGroq.choices.length > 0) {
          return corpGroq.choices[0].message.content;
        } else {
          erroFinal += listaModelos[m] + " Erro " + codGroq + " | ";
        }
      } catch(e) {
        erroFinal += listaModelos[m] + " Exception: " + e.message + " | ";
      }
    }
    
    return "Todos os modelos falharam na Groq. Erros: " + erroFinal;
  } catch (e) {
    return "Falha interna no Assistente IA: " + e.message;
  }
}

function AUTORIZAR_SERVICOS() {
  UrlFetchApp.fetch("https://google.com");
  Logger.log("Serviços autorizados com sucesso!");
}