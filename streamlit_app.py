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

        # 数値変数の選択
        selected_cols = st.multiselect('可視化する数値変数を選択してください:', numerical_cols, default=numerical_cols)

        if selected_cols:
            # 選択した変数の四分位数を表示
            quartiles_df = df[selected_cols].quantile([0, 0.25, 0.5, 0.75, 1]).transpose()
            quartiles_df.columns = ['Min', '25%', '50%', '75%', 'Max']
            st.write(quartiles_df)

            # 箱ひげ図の出力（横並び）
            st.subheader('選択した変数の箱ひげ図（比較：横並び）')
            melted_df = df[selected_cols].melt(var_name='Variable', value_name='Value')
            fig_horizontal = px.box(melted_df, x='Variable', y='Value', title='選択した数値変数の箱ひげ図（横並び）')
            st.plotly_chart(fig_horizontal)

            # ■【横型の箱ひげ図】を縦に並べる（各変数ごとに横向きの箱ひげ図を1枚の図に縦積み）
            st.subheader('選択した変数の箱ひげ図（縦並び）')
            # 「横型」になるように、x軸に値を割り当て、
            # facet_rowで各変数ごとに1行ずつ表示しています。
            fig_vertical = px.box(melted_df, x='Value', facet_row='Variable', orientation='h', 
                                  title='選択した数値変数の箱ひげ図（縦並び）')
            st.plotly_chart(fig_vertical)

            # ■各変数の箱ひげ図を個別に表示
            st.subheader('各変数の箱ひげ図')
            for col in selected_cols:
                fig = px.box(df, y=col, title=f'【{col}】 の箱ひげ図')
                st.plotly_chart(fig)
        else:
            st.write("少なくとも一つの変数を選択してください。")
    else:
        st.write("数値変数が見つかりませんでした。")
