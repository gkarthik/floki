#!/bin/bash

awk '{gsub("\t+\\|\t|\t+\\|","\t",$0); print;}' taxdump/names.dmp | grep "scientific name" | cut -f 1,2 > scientific_names.tsv
awk '{gsub("\t+\\|\t|\t+\\|","\t",$0); print;}' taxdump/nodes.dmp | sed 's/|/\t/g' | cut -f 1,2,3 > nodes.tsv
