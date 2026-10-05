// O token agora é lido de forma segura das Propriedades do Script
var TELEGRAM_TOKEN = PropertiesService.getScriptProperties().getProperty("TELEGRAM_TOKEN");
var TELEGRAM_URL = "https://api.telegram.org/bot" + TELEGRAM_TOKEN;

// Rode essa função UMA VEZ no editor do Apps Script para ligar o Telegram ao seu código
function LIGAR_TELEGRAM() {
  // COLE A URL DA SUA NOVA IMPLANTAÇÃO DENTRO DAS ASPAS ABAIXO:
  var urlDoAppsScript = "https://script.google.com/macros/s/AKfycbzAbjGppGKm4ccSMzROuEiA6h2WNIffduQe1ag0XD0aeBEzn4OYU8lo6LgK-RJKUGS76A/exec"; 
  
  if (urlDoAppsScript === "COLE_O_SEU_LINK_DO_PASSO_2_AQUI") {
    Logger.log("ERRO: Você esqueceu de colar o seu link (https://script.google.com/.../exec) dentro do código na linha 6!");
    return;
  }
  
  var response = UrlFetchApp.fetch(TELEGRAM_URL + "/setWebhook?url=" + urlDoAppsScript);
  Logger.log("Resposta do Telegram: " + response.getContentText());
}

// Essa função recebe automaticamente as mensagens que o usuário manda lá no Telegram
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return HtmlService.createHtmlOutput("OK");
    
    var update = JSON.parse(e.postData.contents);
    if (!update.message) return HtmlService.createHtmlOutput("OK");
    
    // ==========================================
    // BLINDAGEM ANTI-LOOP (Deduplicação de Webhook)
    // O Telegram reenvia a mesma mensagem se a IA demorar.
    // Guardamos o update_id no Cache e matamos as duplicatas instantaneamente.
    // ==========================================
    var updateId = update.update_id;
    if (updateId) {
      var cache = CacheService.getScriptCache();
      if (cache.get(updateId.toString())) {
        return HtmlService.createHtmlOutput("OK"); // Já estamos processando essa mensagem. Fuga!
      }
      cache.put(updateId.toString(), "processando", 21600); // Marca como em processamento por 6 horas
    }

    if (!update.message.text && !update.message.voice && !update.message.audio) return HtmlService.createHtmlOutput("OK");
    
    var chatId = update.message.chat.id;
    var voiceMessage = update.message.voice || update.message.audio;
    var textoDigitado = update.message.text || "";
    
    // Descobre quem é a pessoa no Telegram (username ou código numérico)
    var username = update.message.from.username;
    var idCredencial = username ? "@" + username.toLowerCase() : update.message.from.id.toString();
    
    if (voiceMessage) {
      enviarMensagemTelegram(chatId, "🎧 Ouvindo seu áudio... só um segundo!");
      
      try {
        textoDigitado = transcreverAudioNoGroq(voiceMessage.file_id);
      } catch(err) {
        enviarMensagemTelegram(chatId, "Erro na tradução do áudio: " + err.message);
        return HtmlService.createHtmlOutput("OK");
      }
      
      enviarMensagemTelegram(chatId, "🗣️ _" + textoDigitado + "_");
      enviarMensagemTelegram(chatId, "⏳ Analisando as planilhas...");
      
    } else {
      if (textoDigitado.trim() === "/start") {
        var msgBoasVindas = "Olá! 🤖\n\nPara que eu possa responder sobre as vendas com segurança, seu gestor precisa cadastrar você na aba *acessos* da planilha usando a exata credencial abaixo:\n\n`" + idCredencial + "`\n\nDepois que ele liberar sua região, basta me perguntar qualquer coisa!";
        enviarMensagemTelegram(chatId, msgBoasVindas);
        return HtmlService.createHtmlOutput("OK");
      }
      
      enviarMensagemTelegram(chatId, "⏳ Analisando suas planilhas de vendas... só um segundo!");
    }
    
    // 2. Chamar nossa IA passando o ID do Telegram (para o RLS da aba acessos)
    var respostaIA = consultarGroq(textoDigitado, idCredencial);
    
    // 3. Verificar se a IA retornou um gráfico escondido na resposta
    var graficoMatch = respostaIA.match(/\[GRAFICO_CHARTJS\](.*?)\[\/GRAFICO_CHARTJS\]/s);
    
    if (graficoMatch) {
      var jsonGrafico = graficoMatch[1].trim();
      respostaIA = respostaIA.replace(graficoMatch[0], "").trim(); // Remove a tag secreta do texto que o usuário vai ler
      
      if (respostaIA) {
        enviarMensagemTelegram(chatId, respostaIA);
      }
      
      // Cria o link da imagem usando o QuickChart
      var urlGrafico = "https://quickchart.io/chart?c=" + encodeURIComponent(jsonGrafico) + "&w=600&h=400&bkg=white";
      enviarFotoTelegram(chatId, urlGrafico);
      
    } else {
      // Devolver a resposta normal de texto
      enviarMensagemTelegram(chatId, respostaIA);
    }
    
  } catch (erro) {
    // Se der erro invisível, tentamos avisar no Telegram
    if (chatId) enviarMensagemTelegram(chatId, "Erro no bot: " + erro.message);
  }
  
  return HtmlService.createHtmlOutput("OK");
}

function enviarMensagemTelegram(chatId, texto) {
  var payload = {
    "chat_id": chatId,
    "text": texto,
    "parse_mode": "Markdown"
  };
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };
  UrlFetchApp.fetch(TELEGRAM_URL + "/sendMessage", options);
}

function enviarFotoTelegram(chatId, photoUrl) {
  var payload = {
    "chat_id": chatId,
    "photo": photoUrl
  };
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };
  UrlFetchApp.fetch(TELEGRAM_URL + "/sendPhoto", options);
}

function transcreverAudioNoGroq(fileId) {
    var chaveApi = PropertiesService.getScriptProperties().getProperty("GROQ_API_KEY");
    if (!chaveApi) throw new Error("Chave GROQ_API_KEY não encontrada nas Propriedades do Script.");
  
    // 1. Descobrir o path no Telegram
    var fileResp = UrlFetchApp.fetch(TELEGRAM_URL + "/getFile?file_id=" + fileId);
    var filePath = JSON.parse(fileResp.getContentText()).result.file_path;
    
    // 2. Baixar o arquivo de áudio (OGG Opus)
    var audioBlob = UrlFetchApp.fetch("https://api.telegram.org/file/bot" + TELEGRAM_TOKEN + "/" + filePath).getBlob();
    audioBlob.setName("audio.ogg"); // IMPORTANTE para o backend da API interpretar o mime type
    
    // 3. Montar chamada multipart para o endpoint de áudio da Groq
    var payload = {
      "file": audioBlob,
      "model": "whisper-large-v3" // Modelo Whisper na Groq
    };
    
    var options = {
      "method": "post",
      "headers": {
        "Authorization": "Bearer " + chaveApi
      },
      "payload": payload,
      "muteHttpExceptions": true
    };
    
    var response = UrlFetchApp.fetch("https://api.groq.com/openai/v1/audio/transcriptions", options);
    var code = response.getResponseCode();
    var body = response.getContentText();
    
    if (code !== 200) {
      throw new Error("Erro na Groq (" + code + "): " + body);
    }
    
    var resObj = JSON.parse(body);
    if (resObj.text) {
      return resObj.text;
    } else {
      throw new Error("Sem transcrição: " + body);
    }
}
