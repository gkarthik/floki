#include "kmc_api/kmc_file.h"
#include <iostream>

int main(int argc, char *argv[]){
  CKMCFile kmer_database;
  uint32 _kmer_length, _mode,_counter_size, _lut_prefix_length, _signature_len, _min_count;
  uint64 _total_kmers, _max_count;
  std::string kmer;
  std::string path_to_kmer_db = argv[1];
  kmer_database.OpenForListing (path_to_kmer_db);

  kmer_database.Info(_kmer_length, _mode, _counter_size, _lut_prefix_length, _signature_len, _min_count, _max_count, _total_kmers);
  CKmerAPI kmer_object ( _kmer_length );
  // std::cout << _kmer_length << " " << _total_kmers << std::endl;

  uint32 counters[1000] = {0}, counter;		// max count set at 1000
  uint64 kmer_coverage;
  uint64 num_kmers;
  while (kmer_database.ReadNextKmer(kmer_object, counter)) {
    counters[counter] += 1;
  }

  int64 sum = 0;
  float kmer_coverage_depth = 0;
  for (int i = 0; i < 1000; ++i) {
    sum += counters[i];
    kmer_coverage_depth += i * counters[i];
  }

  kmer_coverage_depth = kmer_coverage_depth/(float) sum;
  std::cout << _total_kmers << "\t" << kmer_coverage_depth;

  return 0;
}
// g++ -std=c++14 -I /home/gk/code/floki/KMC-3.1.0/kmc_api -o estimate_complexity estimate_complexity.cpp ../KMC-3.1.0/kmc_api/*.cpp
