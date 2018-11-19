#!/bin/bash

# fieldno=3
# output_file=/home/gk/code/floki/tmp/MG-0015.kraken.output
# report=/home/gk/code/floki/tmp/MG-0015.kraken.report
# fastq_file_1=/home/gk/code/floki/tmp/MG-0015_R1.fastq
# fastq_file_2=/home/gk/code/floki/tmp/MG-0015_R1.fastq
# tmp_prefix=/home/gk/code/tmp/MG-0015_R1
# kmc_tmp=/home/gk/tmp

fieldno=3
output_file=$1
report=$2
fastq_file_1=$3
fastq_file_2=$4
file_prefix=$5
tmp_prefix=/home/gk/tmp/$5
kmc_tmp=/home/gk/tmp

mkdir -p $tmp_prefix

echo "Output: "$output_file
echo "Fastq R1: "$fastq_file_1
echo "Fastq R2: "$fastq_file_2
echo "File Prefix: " $file_prefix
echo "Tmp: "$tmp_prefix
echo "KMC tmp: "$kmc_tmp

touch $tmp_prefix.complexity.report

cut -d ',' -f 2 $report | awk -v s=$file_prefix -v f=$fieldno -v o=$output_file -v fq=$fastq_file_1 -v t=$tmp_prefix '{print $1"    "f"    "o"    "fq"    "t"    "s}' | xargs -P 16 -n 6 bash -c 'grep -F -A 3 -f <(awk -v fieldno=$1 -v taxid=$0 '\''{if($fieldno == taxid){print $2}}'\'' $2 | sed "s/$5//g") $3 | grep -v '\''^\-\-$'\'' > $4.$0.fastq'

cut -d ',' -f 2 $report | awk -v s=$file_prefix -v f=$fieldno -v o=$output_file -v fq=$fastq_file_2 -v t=$tmp_prefix '{print $1"    "f"    "o"    "fq"    "t"    "s}' | xargs -P 16 -n 6 bash -c 'grep -F -A 3 -f <(awk -v fieldno=$1 -v taxid=$0 '\''{if($fieldno == taxid){print $2}}'\'' $2 | sed "s/$5//g") $3 | grep -v '\''^\-\-$'\'' >> $4.$0.fastq && mkdir -p $4.$0_kmc_tmp/ && kmc -fq -cs1000 -k35 -t16 -ci0 $4.$0.fastq $4.$0 $4.$0_kmc_tmp'

cut -d ',' -f 2 $report | awk -v s=$file_prefix -v f=$fieldno -v o=$output_file -v fq=$fastq_file_1 -v t=$tmp_prefix '{print $1"    "f"    "o"    "fq"    "t"    "s}' | xargs -P 16 -n 6 bash -c 'echo $0,$(/home/gk/code/floki/src/estimate_complexity $4.$0) >> $4.complexity.report'
