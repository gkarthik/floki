import pandas as pd
import numpy as np
import pickle

class Node:
    
    def __init__(self, p, c, taxid, name, r = 0, pr = 0, cr = 0, cpr = 0, pvalue = np.NaN):
        self.parent = p
        self.children = c
        self.taxid = taxid
        self.reads = r
        self.pvalue = pvalue
        self.name = name
        self.ctrl_reads = cr
        self.ctrl_percentage = cpr
        self.percentage = pr
        if p is not None:
            p.add_child(self)
        
    def add_child(self, n):
        self.children.append(n)
        n.parent = self        

    def change_parent(self, p):
        self.parent = p

    def get_dict(self):
        return {
            "children": self.get_children_dict(),
            "taxid": self.taxid,
            "pvalue": self.pvalue,
            "reads": self.get_read_count(),
            "percentage": self.get_percentage(),
            "name": self.name,
            "ctrl_reads": self.get_ctrl_reads(),
            "ctrl_percentage": self.get_ctrl_percentage()
        }

    def get_percentage(self):
        r = self.percentage
        for i in self.children:
            r += i.get_percentage()
        return r

    def get_ctrl_percentage(self):
        r = self.ctrl_percentage
        for i in self.children:
            r += i.get_ctrl_percentage()
        return r

    def get_ctrl_read_count(self):
        r = self.ctrl_reads
        for i in self.children:
            r += i.get_ctrl_read_count()
        return r

    def get_read_count(self):
        r = self.reads
        for i in self.children:
            r += i.get_read_count()
        return r

    def get_children_dict(self):
        d = []
        for i in self.children:
            if i.get_read_count() > 0:
                d.append(i.get_dict())
        return d
        
    def search_children(self, id):
        if self.taxid == id:
            return self
        else:
            for i in self.children:
                return i.search_children(id)
        return None

    def populate_with_taxonomy(self, df, reads_df, pvalue_df, ctrl_df):
        for i in reads_df.index:
            _i = i
            n = self.search_children(_i)
            ancestory = []
            while n == None:
                ancestory.append(_i)
                _i = df.ix[i]["parent_tax_id"]
                n = self.search_children(_i)
            for i in ancestory:
                _t = None
                if i in reads_df.index:
                    _t = Node(n, [], i, df.ix[i]["tax_name"], reads_df.ix[i], reads_df.ix[i]/reads_df.sum(), ctrl_df.ix[i], ctrl_df.ix[i]/ctrl_df.sum(), pvalue = pvalue_df.ix[i])
                else:
                    _t = Node(n, [], i, df.ix[i]["tax_name"])
                n.add_child(_t)
                n = _t


if __name__=="__main__":
    df = pd.read_csv("taxdmp/tax_parent_name_2.csv", index_col="tax_id")
    src = "/Users/karthik/hpc_downloads/2017.01.30/"
    reads_df = pd.read_csv(src+"matrices/analysis_matrix.csv", index_col="Unnamed: 0")
    reads_df = reads_df.drop(['Undetermined_S0_L001_R1_001.trim.dedup.kraken.full.output',
                  'ZikaCap-NoZika_S5_L001_R1_001.trim.dedup.kraken.full.output',
                  'ZikaCap-highHuRNA_S6_L001_R1_001.trim.dedup.kraken.full.output',
                  'ZikaCap1-5GE_S1_L001_R1_001.trim.dedup.kraken.full.output',
                  'ZikaCap24GE_S3_L001_R1_001.trim.dedup.kraken.full.output',
                  'ZikaCap48GE_S4_L001_R1_001.trim.dedup.kraken.full.output',
                  'ZikaCap6GE_S2_L001_R1_001.trim.dedup.kraken.full.output'], axis = 1)
    pvalue_df = pd.read_csv(src+"matrices/analysis_matrix.csv", index_col="Unnamed: 0")
    pvalue_df = pvalue_df.drop(['Undetermined_S0_L001_R1_001.trim.dedup.kraken.full.output',
                  'ZikaCap-NoZika_S5_L001_R1_001.trim.dedup.kraken.full.output',
                  'ZikaCap-highHuRNA_S6_L001_R1_001.trim.dedup.kraken.full.output',
                  'ZikaCap1-5GE_S1_L001_R1_001.trim.dedup.kraken.full.output',
                  'ZikaCap24GE_S3_L001_R1_001.trim.dedup.kraken.full.output',
                  'ZikaCap48GE_S4_L001_R1_001.trim.dedup.kraken.full.output',
                  'ZikaCap6GE_S2_L001_R1_001.trim.dedup.kraken.full.output'], axis = 1)
    ctrl = "GN3-C1-RN-A1-L1_S4_L001_R1_001.trim.dedup.kraken.full.output"
    ctrl_df = reads_df[ctrl]

    s = "PN2-C1-NS-A4-L1_S2_L001_R1_001.trim.dedup.kraken.full.output"
    Root = Node(None, [], 1, "root")
    Root.populate_with_taxonomy(df, reads_df[s], pvalue_df[s], ctrl_df)
    
