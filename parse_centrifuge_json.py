import imp

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import taxon_tree
import json

centrifuge_output = pd.read_table("~/hpc_downloads/2018.08.06/centrifuge_report.tsv")
centrifuge_output2 = pd.read_table("~/hpc_downloads/2018.08.06/centrifuge_report_2.tsv")
annotations = pd.read_csv("./merged_disease_pathogen_symptom_annotations.csv")
annotations = annotations.fillna("")

nodes_cols = ["tax_id", "parent_tax_id", "rank", "embl_code", "div_id", "inherited_div_flag", "genetic_code_id", "inherited_gc_flag", "mito_genetic_code_id", "inherited_mito_flag", "genbank_flag_id", "hidden_subtree_flag", "comments", "none"]
names_cols = ["tax_id", "name_txt", "unique_name", "name_class", "none"]

names_src="taxdmp/names.dmp"
nodes_src="taxdmp/nodes.dmp"
names_df = pd.read_table(names_src, sep="|", names = names_cols)
nodes_df = pd.read_table(nodes_src, sep="|", names = nodes_cols)

names_df = names_df.apply(lambda x: x.str.strip() if x.dtype == np.object else x)
names_df = names_df[names_df["name_class"] == "scientific name"]

nodes_df = nodes_df.apply(lambda x: x.str.strip() if x.dtype == np.object else x)

nodes_df = nodes_df.set_index("tax_id")
names_df = names_df.set_index("tax_id")

imp.reload(taxon_tree)
root = taxon_tree.Node(1, None, "Root", "no rank")
root.populate_taxonomy(centrifuge_output, nodes_df, names_df, root)
root.populate_annotations(annotations)

# Dump computed object as pickle
root.dump_object()

# Batch samples
root.populate_with_reads(centrifuge_output)
root.populate_with_reads(centrifuge_output2)

# Ctrl reads
root.populate_ctr_reads(centrifuge_output2)

# Compute reads at every taxon level
root.populate_reads_at_taxon()

root.compute_pvalues()
d = root.to_dict()
_str = json.dumps(d)
with open("./dashboard/app/json_output/centrifuge_2018.08.06.json", "w") as f:
    f.write(_str)

f.close()

def get_type(n):
    print(n["tax_id"], n["taxon_name"])
    for i in n.keys():
        if type(n[i]) == np.int64:
            print(i)
    for i in n["children"]:
        get_type(i)
