import pandas as pd
import numpy as np
import pickle

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
        n.parent = self        

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

    def populate_with_taxonomy(self, df):
        d = df[df["parent_tax_id"] == self.taxid]
        print(self.taxid)
        for i in d.index:
            if i == 1:
                continue
            _t = Node(self, [], i, d.ix[i]["tax_name"])
            self.add_child(_t)
            _t.populate_with_taxonomy(df)

if __name__=="__main__":
    df = pd.read_csv("taxdmp/tax_parent_name_2.csv", index_col="tax_id")
    Root = Node(None, [], 1, "root")
    Root.populate_with_taxonomy(df)
    f = open("taxdmp/taxonomy_tree", "w")
    pickle.dump(Root, f)
    
