import plotly
import math
from plotly import tools
import plotly.offline as py
import plotly.graph_objs as go
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

def render_species_plot(df, fig):
    nrow = 1
    ncol = 1
    for i in df.columns.tolist():
        if "GN" in i:
            continue
        print(nrow, ncol)
        trace = go.Scatter(
  	    x= "s "+df.index,
            y= df[i],
            text= df.index.astype(str), 
            name= i
        )
        fig.append_trace(trace, nrow, ncol)
        trace = go.Scatter(
  	    x= "s "+df.index,
            y= df["GN3-C1-RN-A1-L1_S4_L001_R1_001.trim.dedup.kraken.full.output"],
            text= df.index.astype(str), 
            name= "GN3-C1-RN-A1-L1_S4_L001_R1_001.trim.dedup.kraken.full.output"
        )  
        fig.append_trace(trace, nrow, ncol)
        ncol = (1 if ncol == 2 else 2)
        nrow = (nrow+1 if ncol == 1 else nrow)
    py.plot(fig, filename='species_plots.html')

if __name__=="main":
    src = "/Users/karthik/hpc_downloads/2017.01.30/"
    df = pd.read_csv(src+"matrices/analysis_matrix.csv", index_col="Unnamed: 0")
    df = df.drop(['Undetermined_S0_L001_R1_001.trim.dedup.kraken.full.output',
                  'ZikaCap-NoZika_S5_L001_R1_001.trim.dedup.kraken.full.output',
                  'ZikaCap-highHuRNA_S6_L001_R1_001.trim.dedup.kraken.full.output',
                  'ZikaCap1-5GE_S1_L001_R1_001.trim.dedup.kraken.full.output',
                  'ZikaCap24GE_S3_L001_R1_001.trim.dedup.kraken.full.output',
                  'ZikaCap48GE_S4_L001_R1_001.trim.dedup.kraken.full.output',
                  'ZikaCap6GE_S2_L001_R1_001.trim.dedup.kraken.full.output'], axis = 1)
    df.index = df.index.astype(str)
    for i in df.columns:
        df[i] = (df[i]/df[i].sum()) * 100
    df = df.apply(np.log10)
    df = df.fillna(0)
    nrow = math.floor(len(df.columns)/2)
    fig = tools.make_subplots(rows=nrow, cols=2)
    render_species_plot(df, fig)
    
