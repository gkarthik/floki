#ifndef TAXON_STATS_H
#define TAXON_STATS_H

#include<iostream>
#include<vector>

class taxon_stats {
private:
  std::vector<uint32_t> read_counts;
  std::vector<uint32_t> taxon_read_counts;
  std::vector<float> read_percentage;
  uint32_t ctrl_read_counts;
  uint32_t ctrl_taxon_read_counts;
  float ctrl_percentage;
  std::vector<float> kmer_coverage;
  std::vector<float> kmer_depth;
  float ctrl_kmer_coverage;
  float ctrl_kmer_depth;
  
  std::vector<float> estimated_read_coverage;
  std::vector<float> estimated_read_depth;
  std::vector<std::string> file_names;
  std::string ctrl_file_name;
  std::vector<double> pvalues;
  std::vector<double> odds_ratio;

public:
  taxon_stats();
  ~taxon_stats();

  int add_new_sample(std::string name);
  int populate_sample_reads(int indice, uint32_t r);
  int populate_ctrl_reads(uint32_t r);
  int populate_sample_percentage(int indice, uint32_t total_reads);
  int populate_ctrl_percentage(uint32_t total_ctrl_reads);
  int compare_to_ctrl(int indice, uint32_t total_taxon_read_counts, uint32_t total_ctrl_read_counts);

  uint32_t get_read_counts(int indice);
  uint32_t get_taxon_read_counts(int indice);
  uint32_t get_ctrl_read_counts();
  uint32_t get_ctrl_taxon_read_counts();
  float get_ctrl_percentage();
  float get_kmer_coverage(int indice);
  float get_kmer_depth(int indice);
  float get_ctrl_kmer_coverage();
  float get_ctrl_kmer_depth();
  
  void set_taxon_read_counts(int indice, uint32_t r);
  void set_ctrl_read_counts(uint32_t r);
  void set_ctrl_taxon_read_counts(uint32_t r);
  void set_ctrl_file_name(std::string n);
  void set_kmer_coverage(int indice, float k);
  void set_kmer_depth(int indice, float k);
  void set_ctrl_kmer_coverage(float k);
  void set_ctrl_kmer_depth(float k);  

  uint32_t sum_taxon_read_counts_across_samples();

  int get_last_indice();
  std::string to_json();
};

#endif
