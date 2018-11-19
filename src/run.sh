#!/bin/bash

control=/Users/karthik/hpc_downloads/2018.11.18/W1022.kraken.report
reports=$(find /Users/karthik/hpc_downloads/2018.11.18/kraken_report -name "*.report" | tr '\n' ' ')
# echo $control $reports
./create_index ../scripts/nodes.tsv ../scripts/scientific_names.tsv ../scripts/merged_disease_pathogen_symptom_annotations.csv $control $reports
