import pandas as pd
import numpy as np
import pickle
import simplejson as json

class Node:

    reads = 0
    ctrl_reads = 0
    percentage = 0
    ctrl_percentage = 0
    
    def __init__(self, p, c, taxid, name, rank, r = 0, pr = 0, cr = 0, cpr = 0, pvalue = np.NaN):
        self.parent = p
        self.children = c
        self.taxid = int(taxid)
        self.reads = r
        self.pvalue = pvalue
        self.name = name
        self.ctrl_reads = cr
        self.ctrl_percentage = cpr
        self.percentage = pr
        self.rank = rank
        if p is not None:
            p.add_child(self)
        
    def add_child(self, n):
        self.children.append(n)
        n.parent = self        

    def change_parent(self, p):
        self.parent = p

    def get_dict(self):
        d = []
        for i in self.children:
            d.append(i.get_dict())
        return {
            "children": d,
            "taxid": self.taxid,
            "pvalue": self.pvalue,
            "reads": self.get_read_count(),
            "percentage": self.get_percentage(),
            "name": self.name,
            "ctrl_reads": self.get_ctrl_read_count(),
            "ctrl_percentage": self.get_ctrl_percentage(),
            "rank": self.rank
        }

    def to_string(self):
        d = []
        for i in self.children:
            d.append(i.name)
        return {
            "children": d,
            "taxid": self.taxid,
            "pvalue": self.pvalue,
            "reads": self.get_read_count(),
            "percentage": self.get_percentage(),
            "name": self.name,
            "ctrl_reads": self.get_ctrl_read_count(),
            "ctrl_percentage": self.get_ctrl_percentage(),
            "rank": self.rank
        }
    
    def get_mini_dict(self):
        d = []
        for i in self.children:
            d.append(i.get_mini_dict())
        return {
            "children": d,
            "taxid": self.taxid,
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
        
    def search_children(self, id):
        n = None
        if self.taxid == id:
            n = self
        else:
            i = 0
            while n == None and i < len(self.children):
                n = self.children[i].search_children(id)
                i += 1
        return n

    def populate_with_taxonomy(self, df, reads_df, pvalue_df, ctrl_df):
        for j in reads_df.index:
            _i = j
            n = self.search_children(_i)
            ancestory = []
            # This will only be root
            if n != None:
                n.reads = reads_df.ix[j]
                n.percentage = reads_df.ix[j]/reads_df.sum()
                n.ctrl_reads = ctrl_df.ix[j]
                n.ctrl_percentage = ctrl_df.ix[j]/ctrl_df.sum()
                continue
            while n == None:
                ancestory.append(_i)
                _i = df.ix[_i]["parent_tax_id"]
                n = self.search_children(_i)
            ancestory.reverse()
            for i in ancestory:
                _t = None
                tax_name = df.ix[i]["tax_name"]
                rank = df.ix[i]["rank"].strip()
                if i in reads_df.index:
                    _t = Node(n, [], i, tax_name, rank, reads_df.ix[i], reads_df.ix[i]/reads_df.sum(), ctrl_df.ix[i], ctrl_df.ix[i]/ctrl_df.sum(), pvalue_df.ix[i])
                else:
                    _t = Node(n, [], i, tax_name, rank)
                n = _t

if __name__=="__main__":
    df = pd.read_csv("taxdmp/tax_parent_name_2.csv", index_col="tax_id")    
    src = "/Users/karthik/hpc_downloads/2017.02.12/"
    reads_df = pd.read_csv(src+"matriced_trimmed/analysis_matrix.csv", index_col="Unnamed: 0")
    pvalue_df = pd.read_csv(src+"matriced_trimmed/pvalue_matrix.csv", index_col="Unnamed: 0")
    pvalue_df = pvalue_df.transpose()
    pvalue_df.index = pvalue_df.index.astype(int)
    reads_df = reads_df.fillna(0)
    pvalue_df = pvalue_df.fillna(0)

    incompatible = list(set(reads_df.index) - set(df.index))
    incompatible = [1345697, 1380774, 710686]
    # incompatible = [1345697, 51290, 1380774, 710686]
    # changes_in_taxonomy = {10633: 1891767, 1345697:1921421, 1380774: 93220, 1439853: 28450, 552466: None, 710686: 212767}
    reads_df = reads_df.drop(552466)
    pvalue_df = pvalue_df.drop(552466)
    changes_in_taxonomy = {1345697: 1921421, 51290: 1783257, 1380774 : 93220, 710686: 212767}
    for i in incompatible:
        if changes_in_taxonomy[i] != None:
            reads_df.ix[changes_in_taxonomy[i]] = reads_df.ix[i]
            pvalue_df.ix[changes_in_taxonomy[i]] = pvalue_df.ix[i]
        reads_df = reads_df.drop(i)
        pvalue_df = pvalue_df.drop(i)
            
    ctrl = "GN4_C1_RN_A1_L_S5_L001_R1_001.trim.dedup.kraken.full.output"
    ctrl_df = reads_df[ctrl]

    for s in reads_df.columns:
        if "PS5" not in s:
            continue
        print(s)
        Root = Node(None, [], 1, "root", df.ix[1]["rank"].strip())
        Root.populate_with_taxonomy(df, reads_df[s], pvalue_df[s], ctrl_df)
        a = json.dumps(Root.get_dict(),ignore_nan=True)
        f = open("json_output/"+s.replace("kraken.full.output", "json"), "w")
        f.write(a)

    s = "PN1-C1-NS-A2-L1_S1_L001_R1_001.trim.dedup.kraken.full.output"
    Root = Node(None, [], 1, "root", df.ix[1]["rank"].strip())
    Root.populate_with_taxonomy(df, reads_df[s], pvalue_df[s], ctrl_df)
