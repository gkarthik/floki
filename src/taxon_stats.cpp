#include <vector>
#include <iostream>
#include "taxon_stats.h"
#include <sstream>
#include <numeric>
#include <boost/math/distributions/hypergeometric.hpp>

taxon_stats::taxon_stats(){

}

taxon_stats::~taxon_stats(){

}

int taxon_stats::add_new_sample(std::string name){
  file_names.push_back(name);
  read_counts.push_back(0);
  taxon_read_counts.push_back(0);
  read_percentage.push_back(0);
  kmer_coverage.push_back(0);
  kmer_depth.push_back(0);
  estimated_read_coverage.push_back(0);
  estimated_read_depth.push_back(0);
  pvalues.push_back(0);
  odds_ratio.push_back(0);
  return 0;
}

int taxon_stats::populate_sample_reads(int indice, uint32_t r){
  read_counts.at(indice) = r;
  return 0;
}

int taxon_stats::populate_ctrl_reads(uint32_t r){
  ctrl_read_counts = r;
  return 0;
}

int taxon_stats::populate_sample_percentage(int indice, uint32_t total_reads){
  if(taxon_read_counts.at(indice) == 0)
    return 1;
  read_percentage.at(indice) = (float) taxon_read_counts.at(indice)/(float)total_reads;
  return 0;
}

int taxon_stats::populate_ctrl_percentage(uint32_t total_ctrl_reads){
  if(ctrl_taxon_read_counts == 0)
    return 1;
  ctrl_percentage = (float)ctrl_taxon_read_counts/(float)total_ctrl_reads;
  return 0;
}


uint32_t taxon_stats::get_read_counts(int indice){
  return read_counts.at(indice);
}

uint32_t taxon_stats::get_taxon_read_counts(int indice){
  return taxon_read_counts.at(indice);
}

void taxon_stats::set_taxon_read_counts(int indice, uint32_t r){
  taxon_read_counts.at(indice) = r;
}

void taxon_stats::set_ctrl_taxon_read_counts(uint32_t r){
  ctrl_taxon_read_counts = r;
}

void taxon_stats::set_ctrl_file_name(std::string n){
  ctrl_file_name = n;
}

uint32_t taxon_stats::get_ctrl_read_counts(){
  return ctrl_read_counts;
}

uint32_t taxon_stats::get_ctrl_taxon_read_counts(){
  return ctrl_taxon_read_counts;
}

int taxon_stats::get_last_indice(){
  return file_names.size() - 1;
}

float taxon_stats::get_ctrl_percentage(){
  return ctrl_percentage;
}

uint32_t taxon_stats::sum_taxon_read_counts_across_samples(){
  return std::accumulate(taxon_read_counts.begin(), taxon_read_counts.end(), 0);
}

std::vector<double> fisher_test_greater(unsigned a, unsigned b, unsigned c, unsigned d) {
  uint32_t N = a + b + c + d;
  uint32_t r = a + c;
  uint32_t n = a + b;
  uint32_t max_k = n;
  uint32_t min_k = a;
  boost::math::hypergeometric_distribution<> hgd(r, n, N);
  double tmp_p = 0.0, p;
  for(int k = min_k;k < max_k+1;k++) {
    p = pdf(hgd, k);
    tmp_p += p;
  }
  double odds_ratio;
  // odds_ratio = std::numeric_limits<double>::infinity();
  if(b==0 || c == 0)
    odds_ratio = -1;		// -1 if Infinity
  else
    odds_ratio = (double)(a*d)/(double)(b*c);
  std::vector<double> res = {tmp_p, odds_ratio};
  return res;
}

/*
  Fisher exact test
          | Sample | Ctrl
  Species |
  Total   |
*/

int taxon_stats::compare_to_ctrl(int indice, uint32_t total_taxon_read_counts, uint32_t total_ctrl_read_counts){
  std::vector<double> res = fisher_test_greater(taxon_read_counts.at(indice), ctrl_taxon_read_counts, total_taxon_read_counts, total_ctrl_read_counts);
  pvalues.at(indice) = res.at(0);
  odds_ratio.at(indice) = res.at(1);
  return 0;
}

template<typename T>
std::string generate_json_for_vector(std::vector<T> v, bool is_str){
  std::stringstream j;
  j << "[";
  for(typename std::vector<T>::iterator it = v.begin(); it != v.end(); ++it){
    if(is_str)
      j << "\"" << *it << "\"";
    else{
      j << *it;
    }
    if(it != v.end()-1)
      j << ",";
  }
  j << "]";
  return j.str();
}

std::string taxon_stats::to_json(){
  std::stringstream json;
  json << "\"ctrl_reads\":" << get_ctrl_read_counts() << ",";
  json << "\"ctrl_taxon_reads\":" << get_ctrl_taxon_read_counts() << ",";
  json << "\"ctrl_percentage\":" << get_ctrl_percentage() << ",";
  json << "\"reads\":" << generate_json_for_vector(read_counts, false) << ",";
  json << "\"taxon_reads\":" << generate_json_for_vector(taxon_read_counts, false) << ",";
  json << "\"percentage\":" << generate_json_for_vector(read_percentage, false) << ",";
  json << "\"pvalue\":" << generate_json_for_vector(pvalues, false) << ",";
  json << "\"oddsratio\":" << generate_json_for_vector(odds_ratio, false) << ",";
  json << "\"file\":" << generate_json_for_vector(file_names, true);
  return json.str();
}
