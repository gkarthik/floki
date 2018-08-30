import pickle as pickle
import numpy as np
import scipy.stats as stats

class Node:

    def __init__(self, id, p, n, r):
        # Taxnomy Annotations
        self.tax_id = id
        self.taxon_name = n
        if p!= None:
            self.parent = p
            self.depth = self.parent.depth + 1
            p.children.append(self)
        else:
            self.parent = None
            self.depth = 0
        self.rank =r
        self.children = []

        # Ctrl metrics
        self.ctrl_reads = 0
        self.ctrl_percentage = 0

        # Sample metrics
        self.reads = []
        self.taxon_reads = []
        self.percentage = []
        self.unique_reads = []
        self.file = []
        self.pvalue = []
        self.oddsratio = []
        self.uncorrected_pvalue = []

        # Ontology Annotations
        self.disease = []
        self.disease_label = []
        self.pathogenic = False
        self.symptom = []
        self.symptom_label = []

        # Other Annotations
        self.genome_size = 0

    def set_parent(self, p):
        self.parent = p
        self.depth = self.parent.depth + 1
        p.children.append(self)

    def add_child(self, n):
        self.children.append(n)

    def print_tree(self):
        if(any([i > 0 for i in self.reads if i != None])):
            print(" "*self.depth + self.taxon_name + " " + ",".join([str(i) for i in self.reads])  + " " + ",".join([str(round(i*100, 2)) +"%" for i in self.percentage]))
        for i in self.children:
            i.print_tree()

    def get_node(self, id):
        if self.tax_id == id:      # Check if id matches current node
            return self
        for i in self.children:    # Check if id matches any of the children
            _ = i.get_node(id)
            if _ != None:
                return _
        return None

    def populate_taxonomy(self, reads_df, nodes_df, names_df, root):
        for _i, i in enumerate(reads_df["taxID"].tolist()): # get tax IDS from centrifuge output
            if _i % 100000 == 0:
                print(_i)
            n = root.get_node(i)
            tax_id = i
            while(n == None):
                if tax_id not in nodes_df.index.values:
                    print(str(tax_id)+" not in NCBI taxonomy. Please check to see if the tax id was merged into another and replace the old id")
                    break
                n = Node(tax_id, None, names_df.ix[tax_id]["name_txt"], nodes_df.ix[tax_id]["rank"])
                p = root.get_node(nodes_df.ix[tax_id]["parent_tax_id"])
                if p != None:
                    n.set_parent(p)
                tax_id = nodes_df.ix[tax_id]["parent_tax_id"]
                n = p

    def get_total_children(self):
        ctr = 1
        for i in self.children:
            ctr += i.get_total_children()
        return ctr

    def get_children_with_reads(self):
        ctr = 0
        if(any([i > 0 for i in self.reads if i != None])):
            ctr += 1
        for i in self.children:
            ctr += i.get_children_with_reads()
        return ctr

    def dump_object(self):
        with open('taxobject.pkl', 'wb') as output:
            pickle.dump(self, output, pickle.HIGHEST_PROTOCOL)
        output.close()

    def read_object(self):
        _ = None
        with open('taxobject.pkl', 'rb') as input:
            _ = pickle.load(input)
        input.close()
        return _

    def init_new_sample(self, name):
        if name == None:
            name = "Sample " + str(len(self.file) + 1)
        self.reads.append(0)
        self.percentage.append(0)
        self.unique_reads.append(0)
        self.file.append(name)
        self.pvalue.append(0)
        self.uncorrected_pvalue.append(0)
        for i in self.children:
            i.init_new_sample(name)

    def get_total_reads(self):
        _ = [0] * len(self.reads)
        for i in range(len(self.reads)):
            _[i] += self.reads[i]
        for i in self.children:
            for _k, k in enumerate(i.get_total_reads()):
                _[_k] += k
        return _

    def populate_percentage(self, total_count):
        for _i, i in enumerate(self.reads):
            if i != None:
                self.percentage[_i] = i/total_count[_i]
        for i in self.children:
            i.populate_percentage(total_count)

    def populate_with_reads(self, df, name = None):
        self.init_new_sample(name)
        for i in df.index.values:
            _ = df.ix[i]
            n = self.get_node(_["taxID"])
            if n == None:
                continue
            n.reads[-1] += _["numReads"]
            n.unique_reads[-1] += _["numUniqueReads"]
        if self.tax_id == 1:
            self.populate_percentage(self.get_total_reads())

    def print_read_metrics(self):
        for i in range(len(self.reads)):
            print("File: " + self.file[i])
            print("Reads: " + str(self.reads[i]))
            print("Percentage: " + str(self.percentage[i]))
            print("Unique reads: " + str(self.unique_reads[i]))
            print("Pvalue:" + str(self.pvalue[i]))
            print("Uncorrected pvalue: "+ str(self.uncorrected_pvalue[i]))

    def print_annotations(self):
        if self.pathogenic:
            print(" "*self.depth + self.taxon_name)
            print(" "*self.depth + "Diseases: " + ",".join(self.disease_label))
            print(" "*self.depth + "Symptoms: " ",".join(self.symptom_label))
        for i in self.children:
            i.print_annotations()

    def populate_ctr_reads(self, df):
        for i in df.index.values:
            _ = df.ix[i]
            n = self.get_node(_["taxID"])
            if n == None:
                continue
            n.ctrl_reads += _["numReads"]
        if self.tax_id == 1:
            total = self.get_total_ctrl_reads()
            self.populate_ctrl_percentage(total)

    def populate_ctrl_percentage(self, total):
        self.ctrl_percentage = self.ctrl_reads/total
        for i in self.children:
            i.populate_ctrl_percentage(total)

    def get_total_ctrl_reads(self):
        ctr = self.ctrl_reads
        for i in self.children:
            ctr += i.get_total_ctrl_reads()
        return ctr

    def populate_reads_at_taxon(self):
        self.taxon_reads = self.get_total_reads()
        for i in self.children:
            i.populate_reads_at_taxon()

    def populate_annotations(self, df):
        _ = df[df["tax_id"] == self.tax_id]
        if _.shape[0] > 0:
            self.pathogenic = True
        for i in _.index.values:
            self.disease.append(_.ix[i]["disease"])
            _disease_label = _.ix[i]["disease_label_doid"]
            if _disease_label == "":
                _disease_label = _.ix[i]["disease_label_mondo"]
            self.disease_label.append(_disease_label)
            self.symptom.append(_.ix[i]["symptom"])
            self.symptom_label.append(_.ix[i]["symptom_label"])
        for i in self.children:
            i.populate_annotations(df)

    # Fisher's eaxt
    #         | Sample | Ctrl
    # Species |
    # Total   |
    def compute_pvalues(self):
        pval = [1] * len(self.taxon_reads)
        oddsratio = [1] * len(self.taxon_reads)
        _t = self.get_total_reads()
        for _i, i in enumerate(self.taxon_reads):
            _ = stats.fisher_exact([[i, self.ctrl_reads], [_t[_i], self.get_total_ctrl_reads()]])
            oddsratio[_i] = _[0]
            pval[_i] = _[1]
        self.pvalue = pval
        self.oddsratio = oddsratio
        for i in self.children:
            i.compute_pvalues()

    def to_dict(self):
        d = {
            # Taxonomy
            "tax_id": np.asscalar(np.int64(self.tax_id)),
            "taxon_name": self.taxon_name,
            "parent": np.asscalar(np.int64(self.parent.tax_id)) if self.parent != None else None,
            "depth": self.depth,
            "rank": self.rank,
            # Ctrl
            "ctrl_reads": np.asscalar(np.int64(self.ctrl_reads)),
            "ctrl_percentage": np.asscalar(np.int64(self.ctrl_percentage)),
            # Sample
            "reads": [np.asscalar(np.int64(i)) for i in self.reads],
            "taxon_reads": [np.asscalar(np.int64(i)) for i in self.taxon_reads],
            "percentage": [np.asscalar(np.int64(i)) for i in self.percentage],
            "unique_reads": [np.asscalar(np.int64(i)) for i in self.unique_reads],
            "file": self.file,
            "pvalue": [np.asscalar(np.int64(i)) for i in self.pvalue],
            "oddsratio": [np.asscalar(np.int64(i)) if not np.isnan(i) and i != np.float('Inf') else -1 for i in self.oddsratio],
            "uncorrected_pvalue": [np.asscalar(np.int64(i)) for i in self.pvalue], # For now no multiple hypothesis testing. To add.
            # Ontology Annotation
            "disease": self.disease,
            "disease_label": self.disease_label,
            "pathogenic": self.pathogenic,
            "symptom": self.symptom,
            "symptom_label": self.symptom_label,
            "genomoe_size": np.asscalar(np.int64(self.genome_size)),
            "children": [i.to_dict() for i in self.children]
        }
        return d
