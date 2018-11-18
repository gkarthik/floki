#ifndef TAXON_H
#define TAXON_H

#include <string>
#include <vector>
#include <map>

#include "taxon_stats.h"
#include "annotations.h"

class taxon {
private:
  std::string name;
  std::string rank;
  uint32_t id;
  taxon *parent;
  std::vector<taxon *> children;
  uint32_t parent_id;
  taxon_stats* stats;
  annotation* annot;
  uint32_t depth;

public:
  taxon();
  taxon(uint32_t i);
  taxon(uint32_t i, uint32_t p);
  taxon(uint32_t i, taxon* p);
  taxon(std::string n, std::string r, uint32_t i);
  taxon(std::string n, std::string r, uint32_t i, taxon* p);

  ~taxon();

  int set_name(std::string n);
  int set_rank(std::string r);
  int set_id(uint32_t i);
  int set_parent(taxon *p);
  int set_parent_id(uint32_t p);
  int set_depth();

  std::string get_name();
  std::string get_rank();
  uint32_t get_id();
  taxon* get_parent();
  uint32_t get_parent_id();
  taxon_stats* get_stats();
  uint32_t get_depth();
  annotation* get_annotations();

  int add_child(uint32_t i);
  int add_parent(taxon* p);
  taxon* add_unclassified_reads_node();
  taxon * find_taxid(uint32_t i);
  void print();
  void print_immediate_children();
  int add_parent_pointers(std::map<uint32_t, taxon*> tax_parent);
  int get_total_number_of_children();
  std::vector<taxon *> get_children();
  int compute_taxon_read_counts(int indice, taxon* root);
  int compute_ctrl_taxon_read_counts(taxon* root);
  int compute_read_percentage(int indice, taxon* root);
  int compute_ctrl_percentage(taxon* root);
  taxon* get_index_of_taxid(uint32_t taxid);
  int init_new_sample(std::string name);
  int init_ctrl_sample(std::string name);
  bool prune_empty_branches();
  int generate_statistics(int indice, taxon* root);

  int add_annotation(std::string disease_uid, std::string disease_label, std::string symptom_uid, std::string symptom_label);
  
  std::string to_json();
};

#endif
