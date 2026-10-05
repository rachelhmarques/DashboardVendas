# 📊 Sistema Integrado de Dashboard de Vendas (Cloud Analytics)

**Autor:** Rachel H. Marques

Este repositório contém a base de código integral de um ecossistema completo de captação, tratamento e visualização de dados operacionais e financeiros em nuvem, construído como Trabalho de Conclusão de Curso.

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
- **Inteligência Artificial (Llama 3):** Conexão assíncrona com o LLM da Meta via API `Groq`, respondendo a análises financeiras complexas diretamente pelo Telegram (`TelegramBackend.js`) ou pelo Web App.

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
