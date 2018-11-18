#include <iostream>
#include <sstream>

#include "taxon.h"
#include "taxon_stats.h"

taxon::taxon(): stats(NULL), parent(NULL), id(0) {};
taxon::taxon(uint32_t i): id(i), stats(NULL), parent(NULL) {};
taxon::taxon(uint32_t i, uint32_t p): stats(NULL), parent(NULL), parent_id(p), id(i) {};
taxon::taxon(uint32_t i, taxon* p): stats(NULL), parent(p), id(i) {};
taxon::taxon(std::string n, std::string r, uint32_t i): stats(NULL), parent(NULL), name(n), rank(r), id(i) {};
taxon::taxon(std::string n, std::string r, uint32_t i, taxon* p): stats(NULL), parent(p), name(n), rank(r), id(i) {
  parent->children.push_back(this);
};

taxon::~taxon(){
  delete stats;
  parent = NULL;
  for(std::vector<taxon*>::iterator it = children.begin(); it != children.end();){
    delete (*it);
    it = children.erase(it);
  }
  children.clear();
}

std::string taxon::get_name(){
  return name;
}

std::string taxon::get_rank(){
  return rank;
}

uint32_t taxon::get_id(){
  return id;
}

taxon* taxon::get_parent(){
  return parent;
}

uint32_t taxon::get_parent_id(){
  return parent_id;
}

taxon_stats* taxon::get_stats(){
  return stats;
}

std::vector<taxon *> taxon::get_children(){
  return children;
}

int taxon::set_name(std::string n){
  if(!n.empty())
    name = n;
  else
    return 1;
  return 0;
}

int taxon::set_rank(std::string r){
  if(!r.empty())
    rank = r;
  else
    return 1;
  return 0;
}

int taxon::set_id(uint32_t i){
  id = i;
  return 0;
}

int taxon::set_parent(taxon *p){
  parent= p;
  return 0;
}

int taxon::set_parent_id(uint32_t p){
  parent_id = p;
  return 0;
}

void taxon::print(){
  std::cout << "Name: " << name << std::endl;
  std::cout << "Rank: " << rank << std::endl;
  std::cout << "ID: " << id << std::endl;
  std::cout << "Name: " << name << std::endl;
  if (parent!=NULL)
    std::cout << "Parent:" << parent->name << std::endl;
  std::cout << "Parent ID: " << parent_id << std::endl;
}

void taxon::print_immediate_children(){
  for(std::vector<taxon*>::iterator it = children.begin(); it != children.end(); ++it) {
    (*it)->print();
  }
}

int taxon::get_total_number_of_children(){
  int count = children.size();
  for(std::vector<taxon*>::iterator it = children.begin(); it != children.end(); ++it) {
    count += (*it)->get_total_number_of_children();
  }
  return count;
}

taxon* taxon::add_unclassified_reads_node(){
  taxon* c = new taxon("Unclassified reads", "superkingdom", 0, this);
  return c;
}

int taxon::add_child(uint32_t i){
  taxon* c = new taxon(i, this);
  c->parent = this;
  children.push_back(c);
  return 0;
}

int taxon::add_parent(taxon* p){
  if(p->get_id()==id)
    return -1;
  this->parent = p;
  p->children.push_back(this);
  set_depth();
  return 0;
}

taxon* taxon::find_taxid(uint32_t i){
  if(id == i)
    return this;
  taxon* res = NULL;
  for(std::vector<taxon*>::iterator it = children.begin(); it != children.end(); ++it) {
    res = (*it)->find_taxid(i);
    if(res!=NULL)
      break;
  }
  return res;
}

int taxon::compute_taxon_read_counts(int indice, taxon* root){
  uint32_t r = stats->get_read_counts(indice);
  for(std::vector<taxon*>::iterator it = children.begin(); it != children.end(); ++it) {
    (*it)->compute_taxon_read_counts(indice, root);
    r += (*it)->get_stats()->get_taxon_read_counts(indice);
  }
  stats->set_taxon_read_counts(indice, r);
  return 0;
}

int taxon::compute_read_percentage(int indice, taxon *root){
  stats->populate_sample_percentage(indice, root->get_stats()->get_taxon_read_counts(indice));
  for(std::vector<taxon*>::iterator it = children.begin(); it != children.end(); ++it) {
    (*it)->compute_read_percentage(indice, root);
  }
  return 0;
}

int taxon::compute_ctrl_percentage(taxon *root){
  stats->populate_ctrl_percentage(root->get_stats()->get_ctrl_taxon_read_counts());
  for(std::vector<taxon*>::iterator it = children.begin(); it != children.end(); ++it) {
    (*it)->compute_ctrl_percentage(root);
  }
  return 0;
}

int taxon::compute_ctrl_taxon_read_counts(taxon* root){
  uint32_t r = stats->get_ctrl_read_counts();
  for(std::vector<taxon*>::iterator it = children.begin(); it != children.end(); ++it) {
    (*it)->compute_ctrl_taxon_read_counts(root);
    r += (*it)->get_stats()->get_ctrl_taxon_read_counts();
  }
  stats->set_ctrl_taxon_read_counts(r);
  return 0;
}

int taxon::init_ctrl_sample(std::string name){
  if(stats==NULL)
    stats = new taxon_stats();
  stats->set_ctrl_file_name(name);
  for(std::vector<taxon*>::iterator it = children.begin(); it != children.end(); ++it){
    (*it)->init_ctrl_sample(name);
  }
  return 0;
}

int taxon::init_new_sample(std::string name){
  if(stats==NULL)
    stats = new taxon_stats();
  stats->add_new_sample(name);
  for(std::vector<taxon*>::iterator it = children.begin(); it != children.end(); ++it){
    (*it)->init_new_sample(name);
  }
  return 0;
}

taxon* taxon::get_index_of_taxid(uint32_t taxid){
  for(std::vector<taxon*>::iterator it = children.begin(); it != children.end(); ++it){
    if((*it)->get_id() == taxid)
      return (*it);
  }
  return NULL;
}

bool taxon::prune_empty_branches(){
  if(stats->sum_taxon_read_counts_across_samples() == 0){
    delete this;
    return true;
  }
  int success = 0;
  for(std::vector<taxon*>::iterator it = children.begin(); it != children.end();){
    success = (*it)->prune_empty_branches();
    if(success)
      it = children.erase(it);
    else
      ++it;
  }
  return false;
}

uint32_t taxon::get_depth(){
  return depth;
}

int taxon::generate_statistics(int indice, taxon* root){
  if(id == 0)		// Don't generate statistics for unclassified node.
    return 0;
  stats->compare_to_ctrl(indice, root->get_stats()->get_taxon_read_counts(indice), root->get_stats()->get_ctrl_taxon_read_counts());
  for(std::vector<taxon*>::iterator it = children.begin(); it != children.end();++it){
    (*it)->generate_statistics(indice, root);
  }
  return 0;
}

int taxon::set_depth(){
  if(id==1)
    depth = 0;
  else {
    depth = parent->get_depth() + 1;
  }
  return 0;
}

std::string taxon::to_json(){
  std::stringstream json;
  json << "{";
  json << "\"tax_id\":" << id  << ",";
  json << "\"taxon_name\":\"" << name  << "\",";
  json << "\"parent\":\"" << parent_id  << "\",";
  json << "\"depth\":" << depth << ",";
  json << "\"rank\":\"" << rank << "\",";
  json << get_stats()->to_json();
  for(std::vector<taxon*>::iterator it = children.begin(); it != children.end();++it){
    if(it == children.begin())
      json << ",\"children\":[";
    json << (*it)->to_json();
    if(it == children.end()-1)
      json << "]";
    else
      json << ",";
  }
  json << "}";
  return json.str();
}
