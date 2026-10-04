/**
 * ============================================================================
 * PROJETO TCC: Módulo de Back-end (Google Apps Script)
 * ARQUIVO: Backend.js
 * AUTORIA: Rachel H. Marques
 * DESCRIÇÃO: Componente servidor responsável por regras de negócios, segurança,
 * injeção de dados ou integrações de IA.
 * ============================================================================
 */

function doGet(e) {
  // 1. MODO API REST (Para o Streamlit em Python)
  // Se a URL for acessada com ?api=true&token=...
  if (e && e.parameter && e.parameter.api === "true") {
    var TOKEN_SECRETO = "senha_super_secreta_123"; // Uma segurança simples tipo startup
    
    if (e.parameter.token !== TOKEN_SECRETO) {
      return ContentService.createTextOutput(JSON.stringify({ erro: "Acesso Negado: Token Invalido" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Puxa a base completa do backend ignorando filtros regionais ("*")
    var baseDeDadosJson = obterDadosPlanilhaSeguro("*");
    
    return ContentService.createTextOutput(baseDeDadosJson)
                         .setMimeType(ContentService.MimeType.JSON);
  }

  // 2. MODO WEB APP NORMAL (Para os navegadores humanos)
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Dashboard de Vendas - Acesso Restrito')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Função nativa necessária para modularizar o HTML no Apps Script
// Ela permite pegar o conteúdo de um arquivo (como 'Login.html') e injetar dentro de outro
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
