#!/bin/bash

# Example usage for Kraken
# ./create_reports.sh /Users/karthik/hpc_downloads/2018.10.11/kraken_output/ 3 /Users/karthik/hpc_downloads/2018.10.11/kraken_report
# Example usage for Centrifuge
# ./create_reports.sh /Users/karthik/hpc_downloads/2018.10.11/centrifuge_output/ 3 /Users/karthik/hpc_downloads/2018.10.11/centrifuge_report


tool_out_dir=$1
tax_id_col=$2
report_dir=$3

mkdir -p $report_dir/

find $tool_out_dir -name "*.output" -exec echo {} $tax_id_col $report_dir \; | xargs -P 8 -n 3 bash -c '\
    n=$(basename $0);
    n=${n/.output/.report};
    cut -f $1 $0 | sort | uniq -c | sed -e "s/^ *//;s/ /\,/" > $2/$n;
    echo -e "num_reads,tax_id\n$(cat $2/$n)" > $2/$n;
'

