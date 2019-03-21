#include <iostream>
#include <fstream>
#include <map>
#include <sstream>
#include "taxon.h"

void print_all_children(taxon *node, std::string rank){
  if(node->get_rank() == rank){
    std::cout << node->get_id() << "\t" << node->get_name() << std::endl;
  }
  std::vector<taxon*> children = node->get_children();
  for(std::vector<taxon*>::iterator it = children.begin(); it != children.end(); ++it) {
    // std::cout << (*it)->get_name() << std::endl;
    print_all_children(*it, rank);
  }
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
  // taxons[1]->print();
  taxons[1]->set_depth();	// Root set depth = 1
  for (std::map<uint32_t, taxon*>::iterator it=std::next(taxons.begin()); it!=taxons.end(); ++it){
    t = it->second;
    t->add_parent(taxons[t->get_parent_id()]);
  }
  nodes_file.close();
  nodes_file.open(argv[2]);	// scientific_names.tsv file
  ctr = 0;
  std::cout << "Populating Names" << std::endl;
  // Add node names
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
  std::cout << taxons[9126]->get_total_number_of_children() << std::endl;
  // std::cout << (taxons[9126]->get_children() == taxons[9126]->get_children()) << std::endl;
  print_all_children(taxons[std::stoul(argv[3])], argv[4]);
  return 0;
}
