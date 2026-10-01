import streamlit as st
import pandas as pd
import os

# Configuração da página
st.set_page_config(page_title="Dashboard de Vendas", layout="wide")

st.title("📊 Dashboard de Vendas (com Streamlit)")
st.markdown("Este aplicativo simula um banco de dados usando um arquivo **CSV** (Planilha) e exibe gráficos interativos.")

# Definindo o nome do nosso "Banco de Dados" (Arquivo Planilha)
ARQUIVO_CSV = 'vendas.csv'

# Criar o arquivo CSV base caso ainda não exista
if not os.path.exists(ARQUIVO_CSV):
    df_inicial = pd.DataFrame({
        "Mes": ["Janeiro", "Fevereiro", "Março", "Abril", "Maio"],
        "Vendas": [1200, 1900, 1500, 2200, 1800]
    })
    df_inicial.to_csv(ARQUIVO_CSV, index=False)

# Lendo o banco de dados
df = pd.read_csv(ARQUIVO_CSV)

# Dividindo a tela em duas colunas (Esquerda e Direita)
col1, col2 = st.columns(2)

with col1:
    st.subheader("📋 Planilha de Vendas (Banco de Dados)")
    st.write("Você pode editar os números diretamente na tabela ou adicionar novas linhas no final:")
    
    # O data_editor permite edição interativa igual ao Excel
    df_editado = st.data_editor(df, num_rows="dynamic", use_container_width=True)
    
    # Botão para salvar alterações
    if st.button("💾 Salvar Alterações no Banco de Dados"):
        df_editado.to_csv(ARQUIVO_CSV, index=False)
        st.success("Planilha atualizada e salva com sucesso no arquivo CSV!")

with col2:
    st.subheader("📈 Gráficos Visuais")
    
    st.write("**Gráfico de Barras**")
    # Gráfico de barras lendo o dataframe editado (atualiza na hora)
    st.bar_chart(data=df_editado, x="Mes", y="Vendas")
    
    st.write("**Gráfico de Linha (Evolução)**")
    st.line_chart(data=df_editado, x="Mes", y="Vendas", color="#ffaa00")
