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
    var erroFinal = "";
    
    // ==========================================
    // TENTATIVA 1: GOOGLE AI STUDIO (Gemini nativo - 1M Tokens)
    // ==========================================
    var chaveGemini = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
    if (!chaveGemini) return "Erro: Chave GEMINI_API_KEY não configurada nas Propriedades do Script.";
    var urlGemini = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + chaveGemini;
    var payloadGemini = {
      "systemInstruction": {"parts": [{"text": promptSistema}]},
      "contents": [{"parts": [{"text": pergunta}]}],
      "generationConfig": {"temperature": 0.2}
    };
    var optionsGemini = {
      "method": "post",
      "headers": {"Content-Type": "application/json"},
      "payload": JSON.stringify(payloadGemini),
      "muteHttpExceptions": true
    };
    
    try {
      var response = UrlFetchApp.fetch(urlGemini, optionsGemini);
      var codigo = response.getResponseCode();
      var corpo = JSON.parse(response.getContentText());
      if (codigo === 200 && corpo.candidates && corpo.candidates.length > 0) {
        return corpo.candidates[0].content.parts[0].text;
      }
      erroFinal += "AI Studio Erro " + codigo + " | ";
    } catch (e) {
      erroFinal += "AI Studio Exception: " + e.message + " | ";
    }

    // ==========================================
    // TENTATIVA 2: FALLBACK OPENROUTER
    // ==========================================
    var chaveOpenRouter = PropertiesService.getScriptProperties().getProperty("OPENROUTER_API_KEY");
    if (!chaveOpenRouter) return "Erros: " + erroFinal + " E a chave OPENROUTER_API_KEY não foi encontrada para fallback.";

    var mensagensOR = [
      {"role": "system", "content": promptSistema},
      {"role": "user", "content": pergunta}
    ];
    var urlOR = "https://openrouter.ai/api/v1/chat/completions";
    var listaModelos = [
      "openai/gpt-oss-20b",
      "deepseek/deepseek-chat"
    ];

    for (var m = 0; m < listaModelos.length; m++) {
      var payloadOR = {"model": listaModelos[m], "messages": mensagensOR, "temperature": 0.2};
      var optionsOR = {"method": "post", "headers": {"Authorization": "Bearer " + chaveOpenRouter, "HTTP-Referer": "https://script.google.com/", "X-Title": "DashboardVendas", "Content-Type": "application/json"}, "payload": JSON.stringify(payloadOR), "muteHttpExceptions": true};
      try {
        var resOR = UrlFetchApp.fetch(urlOR, optionsOR);
        var codOR = resOR.getResponseCode();
        var corpOR = JSON.parse(resOR.getContentText());
        if (codOR === 200 && corpOR.choices && corpOR.choices.length > 0) {
          return corpOR.choices[0].message.content + "\n\n*(Debug: Respondido via Fallback OpenRouter. Erro original: " + erroFinal + ")*";
        } else {
          erroFinal += listaModelos[m] + " Erro " + codOR + " | ";
        }
      } catch(e) {
        erroFinal += listaModelos[m] + " Exception: " + e.message + " | ";
      }
    }
    
    return "Todos os modelos falharam. Erros: " + erroFinal;
  } catch (e) {
    return "Falha interna no Assistente IA: " + e.message;
  }
}

function AUTORIZAR_SERVICOS() {
  UrlFetchApp.fetch("https://google.com");
  Logger.log("Serviços autorizados com sucesso!");
}