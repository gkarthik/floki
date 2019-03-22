#ifndef TAXON_STATS_H
#define TAXON_STATS_H

#include<iostream>
#include<vector>
#include<string>

class taxon_stats {
private:
  std::vector<uint32_t> read_counts;
  std::vector<uint32_t> taxon_read_counts;
  std::vector<float> read_percentage;
  std::vector<float> kmer_coverage;
  std::vector<float> kmer_depth;
  std::vector<float> average_forward_read_length;
  std::vector<float> average_reverse_read_length;
  std::vector<std::string> forward_score_distribution;
  std::vector<std::string> reverse_score_distribution;

  uint32_t ctrl_read_counts;
  uint32_t ctrl_taxon_read_counts;
  float ctrl_percentage;
  float ctrl_kmer_coverage;
  float ctrl_kmer_depth;
  float ctrl_average_forward_read_length;
  float ctrl_average_reverse_read_length;
  std::string ctrl_forward_score_distribution;
  std::string ctrl_reverse_score_distribution;
  
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

  uint32_t get_ctrl_read_counts();
  uint32_t get_ctrl_taxon_read_counts();
  float get_ctrl_percentage();
  float get_ctrl_kmer_coverage();
  float get_ctrl_kmer_depth();
  float get_ctrl_average_forward_read_length();
  float get_ctrl_average_reverse_read_length();
  std::string get_ctrl_forward_score_distribution();
  std::string get_ctrl_reverse_score_distribution();

  uint32_t get_read_counts(int indice);
  uint32_t get_taxon_read_counts(int indice);
  float get_kmer_coverage(int indice);
  float get_kmer_depth(int indice);
  std::vector<float> get_average_forward_read_length();
  std::vector<float> get_average_reverse_read_length();
  std::vector<std::string> get_forward_score_distribution();
  std::vector<std::string> get_reverse_score_distribution();

  void set_ctrl_kmer_coverage(float k);
  void set_ctrl_kmer_depth(float k);
  void set_ctrl_read_counts(uint32_t r);
  void set_ctrl_taxon_read_counts(uint32_t r);
  void set_ctrl_file_name(std::string n);
  void set_ctrl_average_forward_read_length(float k);
  void set_ctrl_average_reverse_read_length(float k);
  void set_ctrl_forward_score_distribution(std::string k);
  void set_ctrl_reverse_score_distribution(std::string k);
  
  void set_taxon_read_counts(int indice, uint32_t r);
  void set_kmer_coverage(int indice, float k);
  void set_kmer_depth(int indice, float k);
  void set_average_forward_read_length(int indice, float k);
  void set_average_reverse_read_length(int indice, float k);
  void set_forward_score_distribution(int indice, std::string k);
  void set_reverse_score_distribution(int indice, std::string k);

  uint32_t sum_taxon_read_counts_across_samples();

  int get_last_indice();
  std::string to_json();
};

#endif
