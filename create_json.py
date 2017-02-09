import pandas as pd
import numpy as np
import simplejson as json

class Node:
    
    def __init__(self, p, c, taxid, name, r = 0, pvalue = np.NaN):
        self.parent = p
        self.children = c
        self.taxid = taxid
        self.reads = r
        self.pvalue = pvalue
        self.name = name
        if p is not None:
            p.add_child(self)
        
    def add_child(self, n):
        self.children.append(n)

    def change_parent(self, p):
        self.parent = p

    def get_dict(self):
        return {
            "children": self.get_children_dict(),
            "taxid": self.taxid,
            "pvalue": self.pvalue,
            "reads": self.get_read_count(),
            "name": self.name
        }

    def get_read_count(self):
        r = self.reads
        for i in self.children:
            r += i.get_read_count()
        return r

    def get_children_dict(self):
        d = []
        for i in self.children:
            d.append(i.get_dict())
        return d
        
    def search_children(self, id):
        if self.taxid == id:
            return self
        else:
            for i in self.children:
                return i.search_children(id)
        return None

if __name__=="__main__":
    src = "/Users/karthik/hpc_downloads/2017.01.30/"
    df = pd.read_csv("taxdmp/tax_parent_name_2.csv", index_col="tax_id")
    reads_df = pd.read_csv(src+"matrices/analysis_matrix.csv", index_col="Unnamed: 0")
    pvalue_matrix = pd.read_csv(src+"matrices/pvalue_matrix.csv", index_col="Unnamed: 0")
    reads_df = reads_df.drop(['ZikaCap-NoZika_S5_L001_R1_001.trim.dedup.kraken.full.output',
                              'ZikaCap-highHuRNA_S6_L001_R1_001.trim.dedup.kraken.full.output',
                              'ZikaCap1-5GE_S1_L001_R1_001.trim.dedup.kraken.full.output',
                              'ZikaCap24GE_S3_L001_R1_001.trim.dedup.kraken.full.output',
                              'ZikaCap48GE_S4_L001_R1_001.trim.dedup.kraken.full.output',
                              'ZikaCap6GE_S2_L001_R1_001.trim.dedup.kraken.full.output'], axis = 1)
    pvalue_matrix = pvalue_matrix.drop(['ZikaCap-NoZika_S5_L001_R1_001.trim.dedup.kraken.full.output',
                                        'ZikaCap-highHuRNA_S6_L001_R1_001.trim.dedup.kraken.full.output',
                                        'ZikaCap1-5GE_S1_L001_R1_001.trim.dedup.kraken.full.output',
                                        'ZikaCap24GE_S3_L001_R1_001.trim.dedup.kraken.full.output',
                                        'ZikaCap48GE_S4_L001_R1_001.trim.dedup.kraken.full.output',
                                        'ZikaCap6GE_S2_L001_R1_001.trim.dedup.kraken.full.output'])
    ctrl = "GN3-C1-RN-A1-L1_S4_L001_R1_001.trim.dedup.kraken.full.output"
    Root = Node(None, [], 1, "Root")
    a = Node(Root, [], 2, "Bacteria", 10, 1)
    b = Node(Root, [], 3, "Viruses", 5, 0.01)
    c = Node(a, [], 4, "Salmonella", 20, 0.5)
    
