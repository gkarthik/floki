#include <iostream>
#include <kmc_file.h>

int main(int argc, char *argv[]){
  CKMCFile kmer_database;
  uint32 _kmer_length, _mode,_counter_size, _lut_prefix_length, _signature_len, _min_count;
  uint64 _total_kmers, _max_count;
  std::string kmer;

  kmer_database.OpenForListing ("../tmp/MG-0015_R1.9606");

  kmer_database.Info(_kmer_length, _mode, _counter_size, _lut_prefix_length, _signature_len, _min_count, _max_count, _total_kmers);
  CKmerAPI kmer_object ( _kmer_length );
  std::cout << _kmer_length << " " << _total_kmers << std::endl;

  uint32 counters[255] = {0}, counter;		// max count set at 255
  uint64 kmer_coverage;
  uint64 num_kmers;
  std::cout << "Min count: " << _min_count << std::endl;
  std::cout << "Max count: " << _max_count << std::endl;
  while (kmer_database.ReadNextKmer(kmer_object, counter)) {
    counters[counter] += 1;
  }

  int64 sum = 0;
  float kmer_coverage_depth = 0;
  for (int i = 0; i < 255; ++i) {
    sum += counters[i];
    kmer_coverage_depth += i * counters[i];
  }

  kmer_coverage_depth = kmer_coverage_depth/sum;
  std::cout << "Total kmers: " << sum << " " << _total_kmers << std::endl;
  std::cout << "Kmer coverage: " << kmer_coverage_depth << std::endl;

  return 0;
}
// g++ -std=c++14 -I /home/gk/code/floki/KMC-3.1.0/kmc_api -o estimate_complexity estimate_complexity.cpp ../KMC-3.1.0/kmc_api/*.cpp
