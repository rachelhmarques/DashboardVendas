import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import os

st.set_page_config(page_title="Dashboard de Vendas", layout="wide", page_icon="📈")

st.title("📈 Dashboard Analítico de Vendas")
st.markdown("Visualização interativa da base de dados com os gráficos mais utilizados no dia a dia.")

ARQUIVO_CSV = 'vendas_avancado.csv'

# Se o arquivo não existir, vamos criar um com muitos dados legais (100 registros)
if not os.path.exists(ARQUIVO_CSV):
    np.random.seed(42)
    datas = pd.date_range(start='2023-01-01', periods=100)
    categorias = np.random.choice(['Eletrônicos', 'Móveis', 'Roupas', 'Alimentos'], size=100)
    regioes = np.random.choice(['Norte', 'Sul', 'Leste', 'Oeste'], size=100)
    
    custo = np.random.uniform(50, 500, size=100)
    vendas = custo * np.random.uniform(1.2, 2.5, size=100) 
    lucro = vendas - custo
    
    df_inicial = pd.DataFrame({
        'Data': datas,
        'Categoria': categorias,
        'Regiao': regioes,
        'Custo': custo.round(2),
        'Vendas': vendas.round(2),
        'Lucro': lucro.round(2)
    })
    df_inicial.to_csv(ARQUIVO_CSV, index=False)

# Carregando o banco de dados
df = pd.read_csv(ARQUIVO_CSV)
df['Data'] = pd.to_datetime(df['Data']) # Garantindo que a coluna Data é reconhecida como data

st.subheader("📋 Banco de Dados (Editável)")
st.write("Altere os valores na tabela abaixo e clique em Salvar para ver os gráficos se atualizarem.")
df_editado = st.data_editor(df, num_rows="dynamic", use_container_width=True, height=200)

if st.button("💾 Salvar Alterações"):
    df_editado.to_csv(ARQUIVO_CSV, index=False)
    st.success("Dados salvos com sucesso!")

st.divider()
st.subheader("📊 Gráficos Clássicos e Habituais")

# Criando ABAS incluindo os mais habituais (Colunas e Linhas)
aba1, aba2, aba3, aba4 = st.tabs(["📊 Colunas (Barras)", "📈 Linhas (Tempo)", "🍕 Pizza", "🌌 Dispersão"])

with aba1:
    st.write("### Vendas Totais por Região")
    st.write("O **Gráfico de Colunas** é o padrão de ouro para comparar volumes entre diferentes grupos.")
    # Agrupando para o gráfico de barras ficar limpo
    df_barras = df_editado.groupby('Regiao', as_index=False)['Vendas'].sum()
    
    fig_bar = px.bar(df_barras, x='Regiao', y='Vendas', color='Regiao', text_auto='.2f', 
                     color_discrete_sequence=px.colors.qualitative.Set2)
    st.plotly_chart(fig_bar, use_container_width=True)

with aba2:
    st.write("### Evolução das Vendas ao Longo do Tempo")
    st.write("O **Gráfico de Linhas** é a melhor opção para ver tendências, picos e quedas no decorrer dos dias/meses.")
    # Agrupando as vendas por data
    df_linhas = df_editado.groupby('Data', as_index=False)['Vendas'].sum()
    
    fig_line = px.line(df_linhas, x='Data', y='Vendas', markers=True, line_shape="spline")
    st.plotly_chart(fig_line, use_container_width=True)

with aba3:
    st.write("### Participação de Vendas por Categoria")
    st.write("O **Gráfico de Pizza** mostra rapidamente quem tem a maior fatia do faturamento geral.")
    fig_pie = px.pie(df_editado, values='Vendas', names='Categoria', hole=0.3, 
                     color_discrete_sequence=px.colors.qualitative.Pastel)
    st.plotly_chart(fig_pie, use_container_width=True)

with aba4:
    st.write("### Relação entre Custo e Vendas")
    st.write("O **Gráfico de Dispersão** (Scatter) ajuda a descobrir se produtos com maior custo sempre geram maiores vendas.")
    fig_scatter = px.scatter(df_editado, x='Custo', y='Vendas', color='Categoria', size='Lucro', hover_data=['Regiao'])
    st.plotly_chart(fig_scatter, use_container_width=True)
