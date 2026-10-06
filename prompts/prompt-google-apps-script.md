# Prompt de exemplo: criar automação no Google Apps Script

Copie o prompt abaixo e preencha os campos entre colchetes com as informações da sua planilha antes de enviá-lo a um assistente de IA.

---

Atue como um desenvolvedor especialista em Google Apps Script. Preciso de um script para automatizar uma tarefa no Google Planilhas. Por favor, crie o código com base nas especificações abaixo e adicione comentários explicativos em cada etapa.

**1. Objetivo Geral:**
[Explique em 1 ou 2 frases o que o script deve fazer. Ex: Mover linhas para outra aba quando o status for alterado, enviar um alerta, calcular valores, etc.]

**2. Estrutura do Arquivo:**
- Nome da Aba de Origem: "[Nome exato da aba, ex: Base_Dados]"
- Nome da Aba de Destino (se houver): "[Nome exato da aba, ex: Historico]"
- A linha de cabeçalho está na linha: [Ex: 1]
- Os dados começam na linha: [Ex: 2]

**3. Estrutura das Colunas (Aba de Origem):**
A estrutura exata das colunas relevantes para o script é:
- Coluna A: [Nome da Coluna] - [Tipo de dado: Texto, Número, Data dd/mm/aaaa, etc.]
- Coluna B: [Nome da Coluna] - [Tipo de dado]
- Coluna [X]: [Nome da Coluna] - [Tipo de dado]

**4. Regras de Negócio e Lógica:**
[Liste o passo a passo do que o script deve executar. Seja sequencial e lógico.]
- Regra 1: [Ex: O script deve ser acionado automaticamente quando o usuário editar a coluna "Status" (OnEdit) OU rodar todos os dias às 8h.]
- Regra 2: [Ex: Se a coluna Status for alterada para "Concluído", a linha inteira deve ser copiada para a aba de Destino.]
- Regra 3: [Ex: Após copiar, exclua a linha da aba de Origem.]

**5. Restrições e Tratamento de Erros:**
- [Ex: O script só deve rodar se a edição for feita na aba "Base_Dados".]
- [Ex: Ignorar linhas onde a coluna de "Nome do Cliente" estiver vazia.]

**6. Formato de Saída e Entrega do Código:**
- Código 100% Completo: Escreva todo o código do início ao fim. É estritamente proibido usar marcadores como "// coloque o resto do código aqui" ou "// lógica anterior".
- Separação em Arquivos: Modularize o projeto o máximo possível para facilitar o meu entendimento. Divida o código em arquivos lógicos (ex: `Variaveis.gs`, `Gatilhos.gs`, `Utilitarios.gs`, `Principal.gs`).
- Instruções: Indique claramente o nome que devo dar a cada arquivo no editor do Apps Script e explique brevemente a função de cada um.
- Gatilhos: Se o código precisar de triggers específicos configurados manualmente, inclua o passo a passo de como fazer isso na interface.
