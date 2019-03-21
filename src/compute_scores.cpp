#include<iostream>
#include<fstream>
#include<sstream>
#include<map>

const int BINS = 10;

class taxon_summary{
private:
  uint32_t* forward_score_distribution;
  uint32_t* reverse_score_distribution;
  uint32_t sequence_count;
  uint32_t tax_id;
  float average_forward_read_length;
  float average_reverse_read_length;
public:
  taxon_summary(uint32_t id){
    forward_score_distribution = new uint32_t[BINS];
    for (int i = 0; i < BINS; ++i) {
      forward_score_distribution[i] = 0;
    }
    reverse_score_distribution = new uint32_t[BINS];
    for (int i = 0; i < BINS; ++i) {
      reverse_score_distribution[i] = 0;
    }
    tax_id = id;		// Must set before computing scores etc.
    sequence_count = 0;
    average_forward_read_length = 0;
    average_reverse_read_length = 0;
  }

  ~taxon_summary(){
    delete forward_score_distribution;
    delete reverse_score_distribution;
  }

  void increase_sequence_count(){
    sequence_count++;
  }

  void set_average_forward_read_length(int len){
    average_forward_read_length = ((average_forward_read_length*(sequence_count - 1)) + len)/sequence_count;
  }

  void set_average_reverse_read_length(int len){
    average_reverse_read_length = ((average_reverse_read_length*(sequence_count - 1)) + len)/sequence_count;
  }

  void set_tax_id(uint32_t id){
    tax_id = id;
  }

  uint32_t get_tax_id(){
    return tax_id;
  }
  
  int add_to_forward_score_distribution(double score){
    int indice = (int) (score/0.1);
    if(indice == 10)		// For 1 add to last bin
      indice -= 1;
    forward_score_distribution[indice] +=1;
    return 0;
  }

  int add_to_reverse_score_distribution(double score){
    int indice = score/0.1;
    if(indice == 10)		// For 1 add to last bin
      indice -= 1;
    reverse_score_distribution[indice] +=1;
    return 0;
  }

  void to_tsv(){
    std::cout << tax_id << "\t" << sequence_count << "\t" << average_forward_read_length << "\t" << average_reverse_read_length << "\t";
    int i;
    for (i = 0; i < BINS; ++i) {
      std::cout << forward_score_distribution[i];
      if (i != BINS-1)
	std::cout << ",";
    }
    std::cout << "\t";
    for (i = 0; i < BINS; ++i) {
      std::cout << reverse_score_distribution[i];
      if (i != BINS-1)
	std::cout << ",";
    }
    std::cout << std::endl;
  }

};

int compute_score(std::string taxa_str, taxon_summary* ts){
  if(taxa_str.empty())
    return -1;
  std::istringstream iss(taxa_str);
  std::string split, tmp;
  std::stringstream tokenStream(taxa_str);
  uint16_t total_forward = 0, matches_forward = 0, total_reverse = 0, matches_reverse = 0, n;
  uint32_t tax_id = 0;
  std::size_t pos;
  bool forward = true;
  double s;
  while (std::getline(tokenStream, split, ' ')){
    pos = split.find(":");
    tmp = split.substr(0, pos);
    if (tmp.compare("|") == 0) {
      forward = false;
      continue;
    }
    tax_id = std::stoi(tmp);
    n = std::stoi(split.substr(pos+1));
    if(forward){
      if(tax_id == ts->get_tax_id())
	matches_forward+=n;
      total_forward+=n;
    } else {
      if(tax_id == ts->get_tax_id())
	matches_reverse+=n;
      total_reverse+=n;
    }
  }
  if(total_forward!=0){
    s = matches_forward/(double)total_forward;
    ts->add_to_forward_score_distribution(s);
  }
  if(total_reverse != 0){
    s = matches_reverse/(double)total_reverse;
    ts->add_to_reverse_score_distribution(s);
  }
  return 0;
}

int main(int argc, char *argv[])
{
  if (argc<1) {
    std::cout << "Please supply path to output file" << std::endl;
    return -1;
  }
  std::string file_path = argv[1];
  std::ifstream output_file(file_path);
  std::string line, field;
  std::stringstream buffer(field);
  std::map<uint32_t, taxon_summary*> taxon_score;
  taxon_summary* ts;
  uint8_t ctr = 0;
  uint32_t id;
  std::size_t pos;
  while(!output_file.eof()){
    getline(output_file, line);
    buffer.str(line);
    // U	DMG-0002M01244:219:000000000-C4PYY:1:1103:17705:21926	0	79|89	0:45 |:| 0:55
    ctr = 0;
    while (getline(buffer, field, '\t')){
      switch (ctr) {
      case 2: {
	id = (uint32_t) std::stoi(field);
	ts = new taxon_summary(id);
	if (taxon_score.find(id) == taxon_score.end()) {
	  taxon_score.insert(std::pair<uint32_t, taxon_summary*>(id, ts));
	}
	break;
      }
      case 3: {			// Read lengths
	taxon_score[id]->increase_sequence_count();
	pos = field.find("|");
	taxon_score[id]->set_average_forward_read_length(std::stoi(field.substr(0, pos)));
	taxon_score[id]->set_average_reverse_read_length(std::stoi(field.substr(pos+1)));
	break;
      }
      case 4: {
	compute_score(field, taxon_score[id]);
	break;
      }
      default:
	break;
      }
      ctr++;
    }
    buffer.clear();
  }
  std::map<uint32_t, taxon_summary*>::iterator it;
  for (it = taxon_score.begin(); it != taxon_score.end(); ++it) {
    it->second->to_tsv();
  }

  return 0;
}
