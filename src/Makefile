CC = g++
CFLAGS = -g

all: compute_scores create_index estimate_complexity

INCLUDES = -I/home/gk/code/KMC-3.1.1 -I/home/gk/code/boost_1_70_0

compute_scores:
	$(CC) $(CFLAGS) --std=c++11 -o compute_scores compute_scores.cpp

create_index:
	$(CC) $(INCLUDES) $(CFLAGS) --std=c++11 -o create_index create_taxonomy_index.cpp taxon_stats.cpp annotations.cpp taxon.cpp

estimate_complexity:
	$(CC) $(INCLUDES) $(CFLAGS) --std=c++14 -o estimate_complexity estimate_complexity.cpp ../../KMC-3.1.1/kmc_api/*.cpp

clean:
	$(RM) compute_scores create_index estimate_complexity
