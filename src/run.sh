#!/bin/bash

control=~/hpc_downloads/2018.10.11/W0006.kraken.report
reports=$(find ~/hpc_downloads/2018.10.11/kraken_report -name "*.report" | tr '\n' ' ')
# echo $control $reports
./create_index ../scripts/nodes.tsv ../scripts/scientific_names.tsv ../scripts/merged_disease_pathogen_symptom_annotations.csv $control $reports
