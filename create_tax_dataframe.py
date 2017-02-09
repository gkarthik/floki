import pandas as pd

nodes_cols = ["tax_id", "parent_tax_id", "rank", "embl_code", "div_id", "inherited_div_flag", "genetic_code_id", "inherited_gc_flag", "mito_genetic_code_id", "inherited_mito_flag", "genbank_flag_id", "hidden_subtree_flag", "comments", "none"]
names_cols = ["tax_id", "name_txt", "unique_name", "name_class", "none"]

if __name__=="__main__":
    names_src="taxdmp/names.dmp"
    nodes_src="taxdmp/nodes.dmp"
    names_df = pd.read_table(names_src, sep="|", names = names_cols)
    nodes_df = pd.read_table(nodes_src, sep="|", names = nodes_cols)
    uniq = names_df[names_df["name_class"]=="\tscientific name\t"]
    tax_parent = pd.DataFrame()
    tax_name = []
    parent_tax_name = []
    for _i in nodes_df.index:
        i = nodes_df["tax_id"][_i]
        j = nodes_df["parent_tax_id"][_i]
        if i == 1:
            tax_name.append("root")
        else:
            tax_name.append(uniq[uniq["tax_id"]==i]["name_txt"].iloc[0].strip())
        if j == 1:
            parent_tax_name.append("root")
        else:
            parent_tax_name.append(uniq[uniq["tax_id"]==i]["name_txt"].iloc[0].strip())            
    nodes_df["tax_name"] = tax_name
    nodes_df["parent_tax_name"] = parent_tax_name    
