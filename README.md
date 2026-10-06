# 📊 Sistema Integrado de Dashboard de Vendas (Cloud Analytics)

**Autor:** Rachel H. Marques

Este repositório contém a base de código integral de um ecossistema completo de captação, tratamento e visualização de dados operacionais e financeiros em nuvem.

## 🏗️ Arquitetura do Sistema

O projeto adota uma arquitetura em microsserviços (Serverless) baseada em eventos, distribuída nos seguintes pilares:

### 1. Ingestão de Dados e Automação (`/n8n`)
- Formulário Web atuando como porta de entrada de dados.
- Servidor local/nuvem (n8n) recebendo *webhooks* via nó de validação.
- Auditoria de dados utilizando scripts Node.js nativos.
- Envio síncrono para o Google Sheets (Banco de Dados Servidor).
- Monitoramento de anomalias (ex: lucro negativo) e alertas disparados instantaneamente por robôs do Telegram.

### 2. Backend & Segurança (`/AppsScript`)
- **API RESTful:** Funções em JavaScript hospedadas nativamente no Google Cloud (Apps Script), atuando como ponte segura para os clientes consumirem os dados da planilha.
- **RLS (Row Level Security):** Algoritmos de segurança (`AuthBackend.js`) protegem os dados por nível de região geográfica (Norte, Sul, Leste, Oeste), garantindo que os usuários só visualizem o que têm permissão.
- **Inteligência Artificial (Gemini & OpenRouter):** Conexão assíncrona com o LLM do Google via API AI Studio (Gemini 2.5 Flash nativo) com fallback programado para a API OpenRouter, respondendo a análises financeiras complexas diretamente pelo Telegram (TelegramBackend.js) ou pelo Web App. (Obtenha sua chave gratuita do AI Studio em: [Google AI Studio](https://aistudio.google.com/prompts/new_chat))
- **Prompt de exemplo:** Use o [modelo de prompt para solicitar automações no Google Apps Script](prompts/prompt-google-apps-script.md) como guia. Substitua os campos entre colchetes pelos detalhes da sua planilha e da tarefa.

### 3. Frontend Analítico Principal (`app_vendas.py`)
- Desenvolvido inteiramente em Python (`Streamlit`).
- Consome a API do Apps Script, carregando os JSONs seguros diretamente para o ecossistema do `Pandas`.
- Utiliza a engine `Plotly Express` para gerar gráficos reativos: barras, linhas com regressão/média móvel, pizza, dispersão e caixa (outliers).
- Oculta todas as chaves e credenciais sensíveis via `.env` (ignorado no versionamento) e `st.secrets` para publicação transparente no **Streamlit Community Cloud**.

## 🚀 Como Rodar o Dashboard (Python)

1. Instale os requisitos na sua máquina:
   ```bash
   pip install -r requirements.txt
   ```
2. Crie um arquivo local `.env` contendo:
   ```env
   URL_API="Sua URL do Apps Script"
   API_TOKEN="Seu Token do Apps Script"
   ```
3. Execute o servidor Streamlit:
   ```bash
   streamlit run app_vendas.py
   ```

---
*Este código não contém chaves de API vivas ou segredos (`.env` está ignorado). Todo o sistema pode ser replicado mediante a configuração do banco de dados na aba `n8n` e implantação no Apps Script.*

## 📥 Como Baixar o Projeto (Para Avaliadores e Colegas)

Para inspecionar os arquivos ou rodar o projeto na sua máquina, você pode clonar este repositório de três formas fáceis:

### Opção 1: Usando o VS Code (Visual Studio Code)
1. Abra o **VS Code**.
2. Pressione `Ctrl + Shift + P` para abrir a Paleta de Comandos.
3. Digite **Git: Clone** e pressione `Enter`.
4. Cole a URL do projeto:
   `https://github.com/rachelhmarques/DashboardVendas.git`
5. Escolha a pasta onde deseja salvar e abra o projeto.
6. Use o terminal do VS Code (`Ctrl + '`) para instalar as dependências.

### Opção 2: Pelo Jupyter Notebook / Google Colab
Se você quiser analisar os dados ou brincar com o código Python de forma interativa:
1. Abra o **Jupyter Notebook** no seu computador (ou o Google Colab no navegador).
2. Em uma célula vazia, digite e execute o seguinte comando:
   ```python
   !git clone https://github.com/rachelhmarques/DashboardVendas.git
   ```
3. Todos os arquivos e as pastas do projeto (como `/AppsScript`) vão aparecer imediatamente na sua aba lateral de arquivos para você explorar.

### Opção 3: Download Direto (Sem Instalar Nada)
1. Vá no topo da página deste repositório no GitHub.
2. Clique no botão verde **"<> Code"**.
3. Escolha **"Download ZIP"**.
4. Extraia a pasta no seu computador e abra com qualquer editor.
