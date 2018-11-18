#include <iostream>
#include <fstream>
#include <map>
#include <sstream>
#include "taxon.h"
#include <ctime>
#include <libgen.h>

int generate_taxonomy_tree(std::map<uint32_t, taxon*> taxons, taxon* root, std::string report_file_path, bool ctrl){
  clock_t start_time = clock();
  std::ifstream report_file;
  std::string name =basename((char *)report_file_path.c_str());
  int sample_indice = -1;
  if(ctrl){
    root->init_ctrl_sample(name);
  } else {
    root->init_new_sample(name);
    sample_indice = root->get_stats()->get_last_indice();
  }
  std::string line, cell;
  int i = 0, ctr= 0;
  uint32_t taxid, reads;
  report_file.open(report_file_path);
  while(std::getline(report_file, line)){
    std::stringstream line_stream(line);
    i = 0;
    while(std::getline(line_stream,cell, ',')){
      switch (i) {
      case 0: {
	if(cell.compare("num_reads") == 0)
	  break;
	reads = (uint32_t) std::stoi(cell);
	break;
      }
      case 1: {
	if(cell.compare("tax_id") == 0)
	  break;
	taxid = (uint32_t) std::stoi(cell);
	if(taxons[taxid] == NULL){
	  std::cout << "Tax Id " << taxid << " is not in the taxonomy. Please check if this was merged into another id. " << reads << " reads were excluded." << std::endl;
	  continue;
	}
	if(ctrl)
	  taxons[taxid]->get_stats()->populate_ctrl_reads(reads);
	else
	  taxons[taxid]->get_stats()->populate_sample_reads(sample_indice, reads);
	break;
      }
      default:
	break;
      }
      i++;
    }
    ctr++;
    line_stream.clear();
    if (ctr%100000 == 0) {
      std::cout << ctr << "\n";
    }
  }
  if(ctrl){
    root->compute_ctrl_taxon_read_counts(root);
    root->compute_ctrl_percentage(root);
  } else {
    root->compute_taxon_read_counts(sample_indice, root);
    root->compute_read_percentage(sample_indice, root);
  }
  std::cout << "Processing" << report_file_path  << " took " << double( clock() - start_time ) / (double)CLOCKS_PER_SEC<< " seconds." << std::endl;
  return 0;
}

int main(int argc, char *argv[]){
  std::string cell, line;
  std::ifstream nodes_file;
  nodes_file.open(argv[1]);	// Processed by script get first 3 columns of nodes.dmp
  int i = 0, ctr = 0;
  std::map<uint32_t, taxon*> taxons;
  taxon *t;
  while(std::getline(nodes_file, line)){
    std::stringstream line_stream(line);
    i = 0;
    while(std::getline(line_stream,cell, '\t')){
      switch (i) {
      case 0: {
	t = new taxon((uint32_t) std::stoi(cell));
	taxons[std::stoul(cell)] = t;
	break;
      }
      case 1: {
	t->set_parent_id((uint32_t) std::stoi(cell));
	break;
      }
      case 2: {
	t->set_rank(cell);
	break;
      }
      default:
	break;
      }
      i++;
    }
    ctr++;
    line_stream.clear();
    if (ctr%100000 == 0) {
      std::cout << ctr << "\n";
    }
  }
  taxons[1]->set_depth();	// Root st depth = 1
  taxons[0] = taxons[1]->add_unclassified_reads_node();
  for (std::map<uint32_t, taxon*>::iterator it=std::next(taxons.begin()); it!=taxons.end(); ++it){
    t = it->second;
    t->add_parent(taxons[t->get_parent_id()]);
  }
  nodes_file.close();
  nodes_file.open(argv[2]);	// scientific_names.tsv file
  ctr = 0;
  std::cout << "Populating Names" << std::endl;
  while(std::getline(nodes_file, line)){
    std::stringstream line_stream(line);
    i = 0;
    while(std::getline(line_stream,cell, '\t')){
      switch (i) {
      case 0: {
	t = taxons[(uint32_t) std::stoi(cell)];
	break;
      }
      case 1: {
	t->set_name(cell);
	break;
      }
      default:
	break;
      }
      i++;
    }
    ctr++;
    line_stream.clear();
    if (ctr%100000 == 0) {
      std::cout << ctr << "\n";
    }
  }
  std::cout << taxons[1]->get_total_number_of_children() << std::endl;
  taxon* root = taxons[1];
  t = NULL;
  generate_taxonomy_tree(taxons, root, argv[3], true); // First in control. Followed by other reports
  std::cout << root->get_stats()->get_ctrl_taxon_read_counts() << std::endl;
  for (i = 4; i < argc; ++i) {
    std::cout << argv[i] << std::endl;
    generate_taxonomy_tree(taxons, root, argv[i], false);
  }
  std::cout << "Pruning empty branches..." << std::endl;
  root->prune_empty_branches();
  std::cout << "Number of nodes after pruning: " << root->get_total_number_of_children() << std::endl;
  std::cout << "Generating statistics..." << std::endl;
  clock_t start_time = clock();
  for (i = 0; i < root->get_stats()->get_last_indice()+1; ++i) {
    root->generate_statistics(i, root);
  }
  std::cout << "Generating statistics took " << " took " << double( clock() - start_time ) / (double)CLOCKS_PER_SEC<< " seconds." << std::endl;
  std::ofstream json_file;
  json_file.open("test.json");
  json_file << root->to_json();
  delete root;
  std::cout << "Generated JSON!" << std::endl;
  return 0;
}
