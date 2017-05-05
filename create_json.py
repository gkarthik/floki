import pandas as pd
import numpy as np
import pickle
import statsmodels.stats.multitest as smm
import simplejson as json
from scipy.stats import fisher_exact

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
        self.superkingdom_percentage = np.NaN
        self.ctrl_superkingdom_percentage = np.NaN
        self.uncorrected_pvalue = np.NaN
        self.pass_fdr_test = None
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
            "rank": self.rank,
            "uncorrected_pvalue": self.uncorrected_pvalue,
            "pass_fdr_test": bool(self.pass_fdr_test)
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
            "rank": self.rank,
            "uncorrected_pvalue": self.uncorrected_pvalue,
            "pass_fdr_test": bool(self.pass_fdr_test)
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

    def generate_pvalues(self, sample_total, CtrlRoot, ctrl_sum, pval):
        r = self.get_read_count()
        oddsratio, pvalue = fisher_exact([[r, sample_total],[CtrlRoot.search_children(self.taxid).get_read_count() , ctrl_sum]])
        self.uncorrected_pvalue = pvalue
        pval.loc[self.taxid] = pvalue
        for i in self.children:
            i.generate_pvalues(sample_total, CtrlRoot, ctrl_sum, pval)

    def write_corrected_pvalues(self, pval):
        self.pvalue = pval.ix[self.taxid]["corrected_pval"]
        self.pass_fdr_test = pval.ix[self.taxid]["pass_fdr_test"]
        for i in self.children:
            i.write_corrected_pvalues(pval)
        
    # def generate_superkingdom_percentages(self, ctrl):
    #     if self.rank != "superkingdom" and self.name!="root":
    #         p = self.parent
    #         while(p.rank != "superkingdom"):
    #             p = p.parent
    #         self.superkingdom_percentage = self.reads/p.reads
    #         self.ctrl_superkingdom_percentage = ctrl.ix[self.taxid]/ctrl.ix[p.taxid]

def run_fdr_test(p):
    t = smm.multipletests(p["pval"], alpha = 0.05, method="fdr_bh")
    print(len(p["pval"]), len(t[1]))
    print(p["pval"])
    print(t[1])
    p["corrected_pval"] = t[1]
    p["pass_fdr_test"] = t[0]
    return p

if __name__=="__main__":
    df = pd.read_csv("taxdmp/tax_parent_name_2.csv", index_col="tax_id")    
    src = "/Users/karthik/hpc_downloads/2017.04.30/matrices/"
    reads_df = pd.read_csv(src+"analysis_matrix.csv", index_col="Unnamed: 0")
    pvalue_df = pd.read_csv(src+"pvalue_matrix.csv", index_col="Unnamed: 0")
    pvalue_df = pvalue_df.transpose()
    pvalue_df.index = pvalue_df.index.astype(int)
    reads_df = reads_df.fillna(0)
    pvalue_df = pvalue_df.fillna(0)

    incompatible = list(set(reads_df.index) - set(df.index))
    changes_in_taxonomy = {10633: 1891767, 1345697:1921421, 1380774: 93220, 1439853: 28450, 552466: None, 710686: 212767}
    # reads_df = reads_df.drop(552466)
    # pvalue_df = pvalue_df.drop(552466)
    for i in incompatible:
        if changes_in_taxonomy[i] != None:
            reads_df.ix[changes_in_taxonomy[i]] = reads_df.ix[i]
            pvalue_df.ix[changes_in_taxonomy[i]] = pvalue_df.ix[i]
        reads_df = reads_df.drop(i)
        pvalue_df = pvalue_df.drop(i)
            
    ctrl = "GN3-C1-RN-A1-L1_S4_L001_R1_001.trim.dedup.kraken.full.output"
    ctrl_df = reads_df[ctrl]
    pvalue_df[ctrl] = [np.NaN] * len(pvalue_df.index)
    CtrlRoot = Node(None, [], 1, "root", df.ix[1]["rank"].strip())
    CtrlRoot.populate_with_taxonomy(df, reads_df[ctrl], pvalue_df[ctrl], ctrl_df)
    p = pd.DataFrame(index = reads_df.index, columns = ["pval"])
    CtrlRoot.generate_pvalues(reads_df[ctrl].sum(), CtrlRoot, CtrlRoot.get_read_count(), p)
    p = run_fdr_test(p)
    CtrlRoot.write_corrected_pvalues(p)

    complete_json = {};        
    for s in reads_df.columns:
        if "PN" not in s:
            continue
        print(s)
        Root = Node(None, [], 1, "root", df.ix[1]["rank"].strip())
        Root.populate_with_taxonomy(df, reads_df[s], pvalue_df[s], ctrl_df)
        p = pd.DataFrame(index = reads_df.index, columns = ["pval"])
        Root.generate_pvalues(reads_df[s].sum(), CtrlRoot, CtrlRoot.get_read_count(), p)
        p = run_fdr_test(p)
        Root.write_corrected_pvalues(p)
        # Root.generate_superkingdom_percentages(ctrl_df)
        complete_json["json_output/"+s.replace("kraken.full.output", "json")] = Root.get_dict()
        a = json.dumps(Root.get_dict(),ignore_nan=True)
        f = open("json_output/"+s.replace("kraken.full.output", "json"), "w")
        f.write(a)

    a = json.dumps(complete_json,ignore_nan=True)
    f = open("json_output/complete_json.json", "w")
    f.write(a)

    
    # Blast to analysis matrix
    
