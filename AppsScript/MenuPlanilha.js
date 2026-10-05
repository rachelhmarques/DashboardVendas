function FORCAR_CRIACAO_DO_MENU() {
  // Limpa qualquer gatilho antigo para evitar menus duplicados
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "meuMenuSeguro") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Cria um gatilho FORTE que tem todas as permissões para injetar na planilha
  ScriptApp.newTrigger('meuMenuSeguro')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onOpen()
    .create();
    
  // Tenta já injetar o menu agora, se não der, ao menos o gatilho está criado
  try {
    meuMenuSeguro();
  } catch(e) {}
}

function meuMenuSeguro() {
  var ui = SpreadsheetApp.getUi();
  
  ui.createMenu('🤖 Automação PDF')
      .addItem('▶️ Ligar Robô de Horários', 'LIGAR_ROBO_AUTOMATICO')
      .addItem('⏸️ Desligar Robô de Horários', 'DESLIGAR_ROBO_AUTOMATICO')
      .addSeparator()
      .addItem('📩 Processar Envios Manuais Agora', 'verificarEnvioPDFs')
      .addSeparator()
      .addItem('🎲 Gerar Massa de Dados (2024-2026)', 'gerarMassaDados2024_2026')
      .addToUi();
}
