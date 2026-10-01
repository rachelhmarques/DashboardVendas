import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import os

st.set_page_config(page_title="Dashboard de Vendas", layout="wide", page_icon="📈")

# --- BARRA LATERAL (FILTROS) ---
st.sidebar.image("https://cdn-icons-png.flaticon.com/512/3003/3003309.png", width=80)
st.sidebar.title("🔍 Filtros de Análise")
st.sidebar.markdown("Use as opções abaixo para interagir com os gráficos.")

ARQUIVO_CSV = 'vendas_avancado.csv'

# Se o arquivo não existir, criamos um
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
df['Data'] = pd.to_datetime(df['Data'])

# --- TELA PRINCIPAL ---
st.title("📈 Dashboard Completo de Vendas")

st.subheader("📋 Banco de Dados (Editável)")
st.write("Altere os valores na tabela abaixo e clique em Salvar. As mudanças afetam os gráficos em tempo real.")

# Mostrar o editor de dados (o banco completo)
df_editado = st.data_editor(df, num_rows="dynamic", use_container_width=True, height=200)

if st.button("💾 Salvar Alterações no Banco"):
    df_editado.to_csv(ARQUIVO_CSV, index=False)
    st.success("Dados salvos com sucesso!")

st.divider()

# --- FILTRANDO OS DADOS ---
# Garantir que a coluna 'Data' do df_editado seja do tipo datetime
df_editado['Data'] = pd.to_datetime(df_editado['Data'])

data_min = df_editado['Data'].min().date()
data_max = df_editado['Data'].max().date()

# Filtro de data na barra lateral
filtro_data = st.sidebar.date_input(
    "Selecione o Período",
    [data_min, data_max],
    min_value=data_min,
    max_value=data_max,
    format="DD/MM/YYYY"
)

# Verificação para evitar erros caso a pessoa esteja escolhendo apenas 1 data
if len(filtro_data) == 2:
    data_inicio, data_fim = filtro_data
    # Cortar o dataframe com base nas datas!
    df_filtrado = df_editado[(df_editado['Data'].dt.date >= data_inicio) & (df_editado['Data'].dt.date <= data_fim)]
else:
    df_filtrado = df_editado


# --- GRÁFICOS ---
st.subheader(f"📊 Painel de Gráficos ({len(df_filtrado)} registros encontrados)")

# Agora temos os 6 gráficos que você pediu!
aba1, aba2, aba3, aba4, aba5, aba6 = st.tabs([
    "📊 Colunas", "📈 Linhas", "🍕 Pizza", "🌌 Dispersão", "📦 Boxplot", "🔥 Heatmap"
])

# Importante: A partir daqui, todos os gráficos usarão o 'df_filtrado' para respeitar o filtro da lateral.

with aba1:
    st.write("### Vendas Totais por Região")
    df_barras = df_filtrado.groupby('Regiao', as_index=False)['Vendas'].sum()
    if not df_barras.empty:
        fig_bar = px.bar(df_barras, x='Regiao', y='Vendas', color='Regiao', text_auto='.2f', color_discrete_sequence=px.colors.qualitative.Set2)
        st.plotly_chart(fig_bar, use_container_width=True)
    else:
        st.warning("Nenhum dado encontrado nesse período.")

with aba2:
    st.write("### Evolução das Vendas no Período")
    df_linhas = df_filtrado.groupby('Data', as_index=False)['Vendas'].sum()
    if not df_linhas.empty:
        fig_line = px.line(df_linhas, x='Data', y='Vendas', markers=True, line_shape="spline")
        st.plotly_chart(fig_line, use_container_width=True)
    else:
        st.warning("Nenhum dado encontrado nesse período.")

with aba3:
    st.write("### Faturamento por Categoria")
    if not df_filtrado.empty:
        fig_pie = px.pie(df_filtrado, values='Vendas', names='Categoria', hole=0.3, color_discrete_sequence=px.colors.qualitative.Pastel)
        st.plotly_chart(fig_pie, use_container_width=True)

with aba4:
    st.write("### Relação: Custo x Vendas (Tamanho da bolha = Lucro)")
    if not df_filtrado.empty:
        fig_scatter = px.scatter(df_filtrado, x='Custo', y='Vendas', color='Categoria', size='Lucro', hover_data=['Regiao'])
        st.plotly_chart(fig_scatter, use_container_width=True)

with aba5:
    st.write("### Distribuição Estatística do Lucro (Boxplot)")
    st.write("Mostra a média, variação e os 'pontos fora da curva' dos lucros em cada região.")
    if not df_filtrado.empty:
        fig_box = px.box(df_filtrado, x='Regiao', y='Lucro', color='Categoria')
        st.plotly_chart(fig_box, use_container_width=True)

with aba6:
    st.write("### Correlação Financeira (Heatmap)")
    st.write("Cruzamento matemático entre custo, vendas e lucro no período selecionado.")
    if not df_filtrado.empty:
        colunas_numericas = df_filtrado.select_dtypes(include=[np.number]).columns
        if len(colunas_numericas) > 1:
            matriz = df_filtrado[colunas_numericas].corr()
            fig_heatmap = px.imshow(matriz, text_auto=True, aspect="auto", color_continuous_scale='RdBu_r')
            st.plotly_chart(fig_heatmap, use_container_width=True)
        else:
            st.warning("Poucos dados matemáticos para gerar a matriz.")
