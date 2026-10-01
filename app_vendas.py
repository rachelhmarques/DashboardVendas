import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import os

st.set_page_config(page_title="Dashboard de Vendas Avançado", layout="wide", page_icon="📈")

st.title("📈 Dashboard Analítico Avançado")
st.markdown("Bem-vindo ao próximo nível do seu aplicativo! Agora com mais dados, diferentes categorias, custos, lucros e gráficos incríveis.")

ARQUIVO_CSV = 'vendas_avancado.csv'

# Se o arquivo não existir, vamos criar um com muitos dados legais (100 registros)
if not os.path.exists(ARQUIVO_CSV):
    np.random.seed(42)
    datas = pd.date_range(start='2023-01-01', periods=100)
    categorias = np.random.choice(['Eletrônicos', 'Móveis', 'Roupas', 'Alimentos'], size=100)
    regioes = np.random.choice(['Norte', 'Sul', 'Leste', 'Oeste'], size=100)
    
    # Criando valores financeiros
    custo = np.random.uniform(50, 500, size=100)
    vendas = custo * np.random.uniform(1.2, 2.5, size=100) # Vendas sempre maiores que o custo
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

# Organizando a tabela no topo
st.subheader("📋 Banco de Dados (Editável)")
st.write("Aqui temos um histórico de 100 vendas. Tente alterar algum número de 'Vendas' ou 'Custo' de alguma categoria e veja os gráficos abaixo mudando de forma mágica!")

df_editado = st.data_editor(df, num_rows="dynamic", use_container_width=True, height=250)

if st.button("💾 Salvar Alterações"):
    df_editado.to_csv(ARQUIVO_CSV, index=False)
    st.success("Dados salvos com sucesso!")

st.divider()
st.subheader("🕵️‍♀️ Análises Exploratórias")

# Criando ABAS para os gráficos ficarem organizados
aba1, aba2, aba3, aba4 = st.tabs(["🍕 Pizza", "🌌 Dispersão", "📦 Boxplot", "🔥 Mapa de Calor"])

with aba1:
    st.write("### Participação de Vendas por Categoria")
    st.write("Um **gráfico de pizza (ou rosca)** é perfeito para ver o tamanho da fatia de cada categoria no total das vendas.")
    fig_pie = px.pie(df_editado, values='Vendas', names='Categoria', hole=0.3, color_discrete_sequence=px.colors.qualitative.Pastel)
    st.plotly_chart(fig_pie, use_container_width=True)

with aba2:
    st.write("### Relação entre Custo e Vendas")
    st.write("O **gráfico de dispersão** mostra se as vendas acompanham os custos. O tamanho da bolinha é o Lucro gerado!")
    fig_scatter = px.scatter(df_editado, x='Custo', y='Vendas', color='Categoria', size='Lucro', hover_data=['Regiao'])
    st.plotly_chart(fig_scatter, use_container_width=True)

with aba3:
    st.write("### Distribuição do Lucro por Região")
    st.write("O **Boxplot** ajuda a ver a concentração dos lucros, onde estão os maiores ganhos e se tem pontos fora da curva (outliers).")
    fig_box = px.box(df_editado, x='Regiao', y='Lucro', color='Categoria')
    st.plotly_chart(fig_box, use_container_width=True)

with aba4:
    st.write("### Correlação entre as Variáveis Financeiras")
    st.write("O **Mapa de Calor (Heatmap)** mostra a força da ligação matemática entre as colunas. 1 significa ligação total!")
    colunas_numericas = df_editado.select_dtypes(include=[np.number]).columns
    matriz_correlacao = df_editado[colunas_numericas].corr()
    
    fig_heatmap = px.imshow(matriz_correlacao, text_auto=True, aspect="auto", color_continuous_scale='RdBu_r')
    st.plotly_chart(fig_heatmap, use_container_width=True)
