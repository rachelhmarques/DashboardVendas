import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import os

import requests

st.set_page_config(page_title="Dashboard de Vendas", layout="wide", page_icon="📈")

# --- BARRA LATERAL (FILTROS) ---
st.sidebar.image("https://cdn-icons-png.flaticon.com/512/3003/3003309.png", width=80)
st.sidebar.title("🔍 Filtros de Análise")
st.sidebar.markdown("Use as opções abaixo para interagir com os gráficos.")

# Carregamos as senhas do arquivo .env (que não vai para o GitHub)
from dotenv import load_dotenv
load_dotenv()

URL_API = os.getenv('URL_API') or os.getenv('APPS_SCRIPT_URL')
TOKEN = os.getenv('API_TOKEN') or os.getenv('APPS_SCRIPT_TOKEN')
try:
    if not URL_API: URL_API = st.secrets.get('URL_API') or st.secrets.get('APPS_SCRIPT_URL')
    if not TOKEN: TOKEN = st.secrets.get('API_TOKEN') or st.secrets.get('APPS_SCRIPT_TOKEN')
except:
    pass

@st.cache_data(ttl=60) # Faz cache de 1 minuto para não bombardear o Google
def carregar_dados_da_api():
    try:
        response = requests.get(f"{URL_API}?api=true&token={TOKEN}")
        if response.status_code == 200:
            dados = response.json()
            if isinstance(dados, dict) and "erro" in dados:
                st.error(f"Erro da API: {dados['erro']}")
                return pd.DataFrame()
            return pd.DataFrame(dados)
    except Exception as e:
        st.error(f"Falha de conexão: {e}")
    return pd.DataFrame()

# Carregando o banco de dados direto do Google Sheets via nossa API!
df = carregar_dados_da_api()

if df.empty:
    st.error('O Banco de Dados est vazio ou inacessvel.')
    st.stop()

if not df.empty:
    # A base de dados do Apps Script pode vir com strings misturadas. Garantimos que é datetime
    df['Data'] = pd.to_datetime(df['Data'], errors='coerce')
    # Opcional: Converter colunas de valor para float se vierem como string com aspas simples (como fiz no gerador)
    for col in ['Custo', 'Vendas', 'Lucro']:
        if col in df.columns:
            # Limpa aspas e vírgulas, depois força a ser número. Valores bizarros viram NaN (Em branco)
            serie_limpa = df[col].astype(str).str.replace("'", "").str.replace(",", ".")
            df[col] = pd.to_numeric(serie_limpa, errors='coerce')

# --- TELA PRINCIPAL ---
st.title("📈 Dashboard Completo de Vendas")

st.subheader("📋 Banco de Dados Conectado")
st.write("Estes dados estão vindo em tempo real da nuvem (Google Sheets).")

# Apenas exibir
st.dataframe(df, use_container_width=True, height=200)

st.divider()

# --- FILTRANDO OS DADOS ---
# Usar a variável df original em vez da df_editado
df_editado = df.copy()

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

# Filtro de Categoria na barra lateral
categorias_disponiveis = df_editado['Categoria'].unique().tolist()
filtro_categoria = st.sidebar.multiselect(
    "Selecione as Categorias",
    options=categorias_disponiveis,
    default=categorias_disponiveis
)

# Cortar o dataframe com base nas datas, regiões e categorias selecionadas
if len(filtro_data) == 2:
    data_inicio, data_fim = filtro_data
    df_filtrado = df_editado[(df_editado['Data'].dt.date >= data_inicio) & 
                             (df_editado['Data'].dt.date <= data_fim) &
                             (df_editado['Regiao'].isin(filtro_regiao)) &
                             (df_editado['Categoria'].isin(filtro_categoria))]
else:
    df_filtrado = df_editado[(df_editado['Regiao'].isin(filtro_regiao)) & 
                             (df_editado['Categoria'].isin(filtro_categoria))]


# --- GRÁFICOS ---
st.subheader(f"📊 Painel de Gráficos ({len(df_filtrado)} registros encontrados)")

if not df_filtrado.empty:
    # Função simples para formatar no padrão brasileiro (1.000,00)
    def formata_br(valor):
        return f"{valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        
    col_kpi1, col_kpi2, col_kpi3 = st.columns(3)
    col_kpi1.metric("Vendas Totais", f"R$ {formata_br(df_filtrado['Vendas'].sum())}")
    col_kpi2.metric("Lucro Total", f"R$ {formata_br(df_filtrado['Lucro'].sum())}")
    col_kpi3.metric("Ticket Médio (Venda)", f"R$ {formata_br(df_filtrado['Vendas'].mean())}")
st.divider()

aba1, aba2, aba3, aba4, aba5, aba6, aba7, aba8, aba9 = st.tabs([
    "📊 Colunas", "📈 Linhas", "🍕 Pizza", "🌌 Dispersão", "📦 Boxplot", "🔥 Heatmap", "📏 Histograma", "📚 Empilhadas", "📅 Anual"
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
    st.write("### Evolução das Vendas no Período (Consolidado)")
    df_linhas = df_filtrado.groupby('Data', as_index=False)['Vendas'].sum()
    if not df_linhas.empty:
        fig_line = px.line(df_linhas, x='Data', y='Vendas', markers=True, line_shape="spline")
        fig_line.update_xaxes(tickformat="%d/%m/%Y")
        st.plotly_chart(fig_line, use_container_width=True)
        
        st.divider()
        
        st.write("### Evolução das Vendas por Região")
        df_linhas_regiao = df_filtrado.groupby(['Data', 'Regiao'], as_index=False)['Vendas'].sum()
        fig_line_regiao = px.line(df_linhas_regiao, x='Data', y='Vendas', color='Regiao', markers=True, line_shape="spline")
        fig_line_regiao.update_xaxes(tickformat="%d/%m/%Y")
        st.plotly_chart(fig_line_regiao, use_container_width=True)
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
        # Gráficos de bolha (size) quebram se receberem valores Vazios (NaN) ou negativos (anomalias).
        # Criamos um DataFrame limpo só para esse gráfico, usando o valor absoluto do Lucro para o tamanho da bolha
        df_plot = df_filtrado.dropna(subset=['Custo', 'Vendas', 'Lucro']).copy()
        df_plot['Tamanho_Bolha'] = df_plot['Lucro'].abs()
        
        # Só tenta plotar se sobrar algum dado após a limpeza
        if not df_plot.empty:
            fig_scatter = px.scatter(df_plot, x='Custo', y='Vendas', color='Categoria', size='Tamanho_Bolha', hover_data=['Regiao', 'Lucro'])
            st.plotly_chart(fig_scatter, use_container_width=True)
        else:
            st.warning("Sem dados numéricos válidos para montar a Dispersão neste período.")

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
        df_tmp['Mes_Ano'] = df_tmp['Data'].dt.strftime('%m/%Y')
        df_empilhado = df_tmp.groupby(['Mes_Ano', 'Categoria'], as_index=False)['Vendas'].sum()
        
        # Para barras 100%, é legal usar barmode ou apenas stack (padrão)
        fig_stacked = px.bar(df_empilhado, x='Mes_Ano', y='Vendas', color='Categoria', text_auto='.0f')
        fig_stacked.update_xaxes(type='category')
        st.plotly_chart(fig_stacked, use_container_width=True)
    else:
        st.warning("Nenhum dado encontrado nesse período.")

with aba9:
    st.write("### Vendas por Ano")
    st.write("Acompanhe a evolução do faturamento anual.")
    if not df_filtrado.empty:
        df_ano = df_filtrado.copy()
        # Dropa possíveis NaNs nas datas antes de pegar o ano para evitar erros
        df_ano = df_ano.dropna(subset=['Data'])
        df_ano['Ano'] = df_ano['Data'].dt.year.astype(int).astype(str)
        
        # Botão interativo para a Rachel
        empilhar = st.toggle("Detalhamento por Categoria (Barras Empilhadas)")
        
        if empilhar:
            df_agrupado_ano = df_ano.groupby(['Ano', 'Categoria'], as_index=False)['Vendas'].sum()
            # text_auto='.2s' formata os milhares com "k" (ex: 150k) para não encavalar o texto!
            fig_ano = px.bar(df_agrupado_ano, x='Ano', y='Vendas', color='Categoria', text_auto='.2s', color_discrete_sequence=px.colors.qualitative.Pastel)
        else:
            df_agrupado_ano = df_ano.groupby('Ano', as_index=False)['Vendas'].sum()
            fig_ano = px.bar(df_agrupado_ano, x='Ano', y='Vendas', text_auto='.2s', color='Ano', color_discrete_sequence=px.colors.sequential.Viridis)
            fig_ano.update_layout(showlegend=False)
            
        fig_ano.update_xaxes(type='category') # Força o eixo a tratar anos como "Nomes" e não como números quebrados
        st.plotly_chart(fig_ano, use_container_width=True)
    else:
        st.warning("Nenhum dado encontrado nesse período.")
