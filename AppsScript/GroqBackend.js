/**
 * ============================================================================
 * PROJETO TCC: Módulo de Back-end (Google Apps Script)
 * ARQUIVO: GroqBackend.js
 * AUTORIA: Rachel H. Marques
 * DESCRIÇÃO: Componente servidor responsável por regras de negócios, segurança,
 * injeção de dados ou integrações de IA.
 * ============================================================================
 */

function consultarGroq(pergunta, usuarioAtivo) {
  try {
    var chaveApi = PropertiesService.getScriptProperties().getProperty("OPENROUTER_API_KEY");
    if (!chaveApi) {
      return "Erro: A chave OPENROUTER_API_KEY não foi encontrada nas configurações de script.";
    }

    // 1. Pegar acesso do usuário
    var planAcessos = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("acessos");
    var dadosAcessos = planAcessos.getDataRange().getValues();
    var acessoLiberado = "";
    
    for (var i = 1; i < dadosAcessos.length; i++) {
      var loginWeb = dadosAcessos[i][0] ? dadosAcessos[i][0].toString().toLowerCase() : "";
      var loginTelegram = dadosAcessos[i][5] ? dadosAcessos[i][5].toString().toLowerCase() : ""; // Coluna F
      var usuarioBuscado = usuarioAtivo.toString().toLowerCase();
      
      // Libera o acesso se o usuário digitado bater com a Coluna A ou com a Coluna F
      if (loginWeb === usuarioBuscado || loginTelegram === usuarioBuscado) {
        acessoLiberado = dadosAcessos[i][1];
        break;
      }
    }
    
    // Bypass de teste removido, pois agora usa a aba de acessos normal
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
        if(dt && dt instanceof Date) {
          linhaCopy[cabecalho.indexOf("Data")] = dt.toLocaleDateString("pt-BR");
        }
        csvLinhas.push(linhaCopy.join(";"));
      }
    }
    
    var csvPronto = csvLinhas.join("\n");
    
    // 3. Montar chamada para o OpenRouter
    var url = "https://openrouter.ai/api/v1/chat/completions";
    
    var promptSistema = "Você é um Analista de BI sênior de uma empresa. O usuário está vendo um Dashboard de Vendas.\n";
    promptSistema += "Abaixo estão os dados reais da base (formato CSV separado por ';'), já filtrados pela regra de acesso dele (RLS).\n";
    promptSistema += "Baseado ESTRITAMENTE nesses dados, responda a pergunta do usuário de forma amigável, direta e curta. Destaque os números importantes.\n";
    promptSistema += "Se o usuário pedir um GRÁFICO (chart, visualização), você deve incluir no final da sua resposta um bloco JSON válido do Chart.js V2 dentro da tag [GRAFICO_CHARTJS] e [/GRAFICO_CHARTJS]. Exemplo:\n";
    promptSistema += "[GRAFICO_CHARTJS]{\"type\":\"bar\",\"data\":{\"labels\":[\"A\",\"B\"],\"datasets\":[{\"label\":\"Vendas\",\"data\":[10,20]}]}}[/GRAFICO_CHARTJS]\n";
    promptSistema += "Importante: Apenas o JSON puro e estrito (sem quebras de linha ou bloco de markdown) entre as tags.\n";
    promptSistema += "Se ele perguntar algo que não está nos dados, diga que não sabe. Evite falar em jargões técnicos sobre CSV.\n\n";
    promptSistema += "DADOS:\n" + csvPronto;

    // Esquadrão de Elite da OpenRouter (Modelos Premium Pagos)
    // Janelas de contexto completas e sem as travas de servidor gratuito
    var listaModelos = [
      "meta-llama/llama-3.1-8b-instruct:free",
      "google/gemini-flash-1.5",
      "deepseek/deepseek-chat",
      "google/gemini-pro-1.5"
    ];

    var erroFinal = "";

    for (var m = 0; m < listaModelos.length; m++) {
      var payload = {
        "model": listaModelos[m],
        "messages": [
          {"role": "system", "content": promptSistema},
          {"role": "user", "content": pergunta}
        ],
        "temperature": 0.2
      };
      
      var options = {
        "method": "post",
        "headers": {
          "Authorization": "Bearer " + chaveApi,
          "HTTP-Referer": "https://script.google.com/",
          "X-Title": "DashboardVendas",
          "Content-Type": "application/json"
        },
        "payload": JSON.stringify(payload),
        "muteHttpExceptions": true
      };
      
      var response = UrlFetchApp.fetch(url, options);
      var codigo = response.getResponseCode();
      var corpo = JSON.parse(response.getContentText());
      
      if (codigo === 200 && corpo.choices && corpo.choices.length > 0) {
        return corpo.choices[0].message.content; // Sucesso, retorna a resposta!
      } else {
        // Armazena o erro e tenta o próximo modelo do loop
        erroFinal = corpo.error ? corpo.error.message : "Erro HTTP " + codigo;
      }
    }
    
    return "Todos os modelos da lista falharam. Último erro: " + erroFinal;
    
  } catch (e) {
    return "Falha interna no Assistente IA: " + e.message;
  }
}

// Essa função serve apenas para forçar o Google a pedir as permissões!
function AUTORIZAR_SERVICOS() {
  // Chamada externa boba só para forçar o pop-up de segurança
  UrlFetchApp.fetch("https://google.com");
  Logger.log("Serviços autorizados com sucesso!");
}
