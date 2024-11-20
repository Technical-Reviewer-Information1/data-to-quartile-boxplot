import streamlit as st
import pandas as pd
import plotly.express as px

st.set_page_config(page_title="四分位数と箱ひげ図", layout="wide")

st.title("四分位数と箱ひげ図")
st.caption("Created by Dit-Lab.(Daiki Ito)")
st.write("ExcelまたはCSVファイルをアップロードしてください。数値変数の四分位数を表示し、箱ひげ図を描画します。")
st.write("")

# ファイルアップローダー
uploaded_file = st.file_uploader('ファイルをアップロードしてください (Excel or CSV)', type=['xlsx', 'csv'])

# デモデータを使うかどうかのチェックボックス
use_demo_data = st.checkbox('デモデータを使用')

if use_demo_data:
    # デモデータを読み込む
    df = pd.read_excel('quartile.xlsx')
    st.write("デモデータの先頭5行を表示します:")
    st.write(df.head())
elif uploaded_file is not None:
    if uploaded_file.type == 'text/csv':
        df = pd.read_csv(uploaded_file)
        st.write("データの先頭5行を表示します:")
        st.write(df.head())
    else:
        df = pd.read_excel(uploaded_file)
        st.write("データの先頭5行を表示します:")
        st.write(df.head())
else:
    df = None

if df is not None:
    # 数値変数の抽出
    numerical_cols = df.select_dtypes(include=['number']).columns.tolist()

    if numerical_cols:
        st.subheader('数値変数の四分位数')
        quartiles_df = df[numerical_cols].quantile([0, 0.25, 0.5, 0.75, 1]).transpose()
        quartiles_df.columns = ['Min', '25%', '50%', '75%', 'Max']
        st.write(quartiles_df)

        st.subheader('箱ひげ図')
        for col in numerical_cols:
            fig = px.box(df, y=col, title=f'【{col}】 の箱ひげ図')
            st.plotly_chart(fig)
    else:
        st.write("数値変数が見つかりませんでした。")
else:
    pass

