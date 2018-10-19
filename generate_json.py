import imp
import sys

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import taxon_tree
import json
import os

import time

# Samples folder path
# p="/Users/karthik/hpc_downloads/2018.10.17/centrifuge_report/"
# Control path
# ctrl_path = "/Users/karthik/hpc_downloads/2018.10.17/centrifuge_report/W1015.centrifuge.report"

p = sys.argv[1]
ctrl_path = sys.argv[2]

# p = "/Users/karthik/hpc_downloads/2018.10.17/centrifuge_report/"
# ctrl_path = "/Users/karthik/hpc_downloads/2018.10.17/W1015.centrifuge.report"

json_path = "./dashboard/app/json_output/"+time.strftime("%Y.%m.%d.%s")+".json"

dirs = sorted(os.listdir(p))

names = []
tool_output = []
for f in dirs:
    if f[-7:] == ".report":
        print(f)
        tool_output.append(pd.read_csv(p+f))
        names.append(f[:-7])

# centrifuge_output = pd.read_table("~/hpc_downloads/2018.08.06/centrifuge_report.tsv")
# centrifuge_output2 = pd.read_table("~/hpc_downloads/2018.08.06/centrifuge_report_2.tsv")

# Control dataframe
ctrl_output = pd.read_csv(ctrl_path)

# Annotations
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

print("Populating Taxonomy.. ")
imp.reload(taxon_tree)
root = taxon_tree.Node(1, None, "Root", "no rank")
for i in tool_output:
    root.populate_taxonomy(i, nodes_df, names_df)

print("Populating Annotations.. ")
root.populate_annotations(annotations)

# Dump computed object as pickle
root.dump_object()

print("Populating read counts..")

# Batch samples
for _, i in enumerate(tool_output):
    root.populate_with_reads(i, names[_])

# Ctrl reads
root.populate_ctr_reads(ctrl_output)

# Compute reads at every taxon level
root.populate_reads_at_taxon()

root.populate_percentage(root.get_total_reads())
root.populate_ctrl_percentage(root.get_total_ctrl_reads())

print("Computing significance values..")
root.compute_pvalues(root)

d = root.to_dict()
_str = json.dumps(d)
with open(json_path, "w") as f:
    f.write(_str)
    print("Finished writing file to "+json_path)

f.close()

def get_type(n):
    print(n["tax_id"], n["taxon_name"])
    for i in n.keys():
        if type(n[i]) == np.int64:
            print(i)
    for i in n["children"]:
        get_type(i)
