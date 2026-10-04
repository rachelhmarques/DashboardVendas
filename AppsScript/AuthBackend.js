/**
 * ============================================================================
 * PROJETO TCC: Módulo de Back-end (Google Apps Script)
 * ARQUIVO: AuthBackend.js
 * AUTORIA: Rachel H. Marques
 * DESCRIÇÃO: Componente servidor responsável por regras de negócios, segurança,
 * injeção de dados ou integrações de IA.
 * ============================================================================
 */

// Função acionada pela tela de Login. 
// Ela vai até a aba "acessos", verifica se o usuário existe, e retorna qual região ele tem direito.
function validarUsuario(usuarioDigitado) {
  var plan = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("acessos");
  
  if (!plan) return { erro: "Aba 'acessos' não encontrada na planilha." };
  
  var dados = plan.getDataRange().getValues();
  
  // O loop começa em 1 para pular o cabeçalho
  for (var i = 1; i < dados.length; i++) { 
    var usuarioPlanilha = dados[i][0]; // Coluna A
    var acessoPlanilha = dados[i][1];  // Coluna B
    
    // Se bater o usuário (ignorando maiúsculas e minúsculas)
    if (usuarioPlanilha.toString().toLowerCase() === usuarioDigitado.toString().toLowerCase()) {
      return { 
        regiaoLiberada: acessoPlanilha,
        usuarioNome: usuarioPlanilha // Para o front-end saber quem logou
      }; 
    }
  }
  
  return { erro: "Usuário não encontrado." };
}
