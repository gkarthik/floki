### Floki
[Under active development]

Floki is a tool(under active development) that can be used to visualize and interpret metagenomic data using the hierarchical taxonomy structure. It can be used to identify and filter out contaminants. It can also be used to visualize batch effects by grouping multiple samples together. Annotations from other sources at every taxon level can be combined with sequencing results to narrow down the search space for taxons of interest.

### Running Floki

Use scripts/create_reports.sh and scripts/generate_json.py to create a json object that can be visualized using the web interface.

To run the web interface, clone the git repository and then execute the following comands,

```
cd pathogen-dashboard/dashboard/
npm install
bower install
grunt serve
```

Use the link https://localhost:9000/ to view the interface.
