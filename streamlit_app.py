import streamlit as st
import pandas as pd
import plotly.express as px

st.set_page_config(page_title="四分位数と箱ひげ図", layout="wide")

st.title("四分位数と箱ひげ図")
st.caption("Created by Dit-Lab.(Daiki Ito)")
st.write("ExcelまたはCSVファイルをアップロードしてください。数値変数の四分位数を表示し、箱ひげ図を描画します。")
st.write("")

# デモデータを使うかどうかのチェックボックス
use_demo_data = st.checkbox('デモデータを使用')

# ファイルアップローダー
uploaded_file = st.file_uploader('ファイルをアップロードしてください (Excel or CSV)', type=['xlsx', 'csv'])

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
    st.write("ファイルをアップロードするか、デモデータを使用してください。")

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

# ご意見・ご要望など
st.write('ご意見・ご要望は→', 'https://forms.gle/G5sMYm7dNpz2FQtU9', 'まで')

# Copyright
st.subheader('© 2022-2024 Dit-Lab.(Daiki Ito). All Rights Reserved.')
st.write("easyStat: Open Source for Ubiquitous Statistics")
st.write("Democratizing data, everywhere.")
st.write("")
st.subheader("In collaboration with our esteemed contributors:")
st.write("・Toshiyuki")
st.write("With heartfelt appreciation for their dedication and support.")
