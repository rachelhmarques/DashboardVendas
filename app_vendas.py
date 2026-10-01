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

# Filtro de Região na barra lateral
regioes_disponiveis = df_editado['Regiao'].unique().tolist()
filtro_regiao = st.sidebar.multiselect(
    "Selecione as Regiões",
    options=regioes_disponiveis,
    default=regioes_disponiveis
)

# Cortar o dataframe com base nas datas e regiões selecionadas
if len(filtro_data) == 2:
    data_inicio, data_fim = filtro_data
    df_filtrado = df_editado[(df_editado['Data'].dt.date >= data_inicio) & 
                             (df_editado['Data'].dt.date <= data_fim) &
                             (df_editado['Regiao'].isin(filtro_regiao))]
else:
    df_filtrado = df_editado[df_editado['Regiao'].isin(filtro_regiao)]


# --- GRÁFICOS ---
st.subheader(f"📊 Painel de Gráficos ({len(df_filtrado)} registros encontrados)")

if not df_filtrado.empty:
    col_kpi1, col_kpi2, col_kpi3 = st.columns(3)
    col_kpi1.metric("Vendas Totais", f"R$ {df_filtrado['Vendas'].sum():,.2f}")
    col_kpi2.metric("Lucro Total", f"R$ {df_filtrado['Lucro'].sum():,.2f}")
    col_kpi3.metric("Ticket Médio (Venda)", f"R$ {df_filtrado['Vendas'].mean():,.2f}")
st.divider()

aba1, aba2, aba3, aba4, aba5, aba6, aba7, aba8 = st.tabs([
    "📊 Colunas", "📈 Linhas", "🍕 Pizza", "🌌 Dispersão", "📦 Boxplot", "🔥 Heatmap", "📏 Histograma", "📚 Empilhadas"
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
    st.write("### Concentração de Vendas (Heatmap)")
    st.write("Veja de forma fácil onde vendemos mais: cruzamento de Categorias por Região. Cores mais fortes = mais vendas!")
    if not df_filtrado.empty:
        # Tabela dinâmica
        pivot = df_filtrado.pivot_table(index='Categoria', columns='Regiao', values='Vendas', aggfunc='sum')
        fig_heatmap = px.imshow(pivot, text_auto='.2f', aspect="auto", color_continuous_scale='YlOrRd', labels={'color':'Vendas'})
        st.plotly_chart(fig_heatmap, use_container_width=True)
    else:
        st.warning("Nenhum dado encontrado nesse período.")


with aba7:
    st.write("### Distribuição do Volume de Vendas (Histograma)")
    st.write("Entenda em quais faixas de valor as suas vendas mais acontecem.")
    if not df_filtrado.empty:
        fig_hist = px.histogram(df_filtrado, x='Vendas', nbins=15, color='Regiao', text_auto=True)
        fig_hist.update_layout(bargap=0.1)
        st.plotly_chart(fig_hist, use_container_width=True)
    else:
        st.warning("Nenhum dado encontrado nesse período.")

with aba8:
    st.write("### Barras Empilhadas 100% (Market Share)")
    st.write("Acompanhe o domínio de cada Categoria no faturamento ao longo do tempo.")
    if not df_filtrado.empty:
        # Copia localmente e extrai mes-ano
        df_tmp = df_filtrado.copy()
        df_tmp['Mes_Ano'] = df_tmp['Data'].dt.strftime('%Y-%m')
        df_empilhado = df_tmp.groupby(['Mes_Ano', 'Categoria'], as_index=False)['Vendas'].sum()
        
        # Para barras 100%, é legal usar barmode ou apenas stack (padrão)
        fig_stacked = px.bar(df_empilhado, x='Mes_Ano', y='Vendas', color='Categoria', text_auto='.0f')
        fig_stacked.update_xaxes(type='category')
        st.plotly_chart(fig_stacked, use_container_width=True)
    else:
        st.warning("Nenhum dado encontrado nesse período.")
