#ifndef ANNOTATION_H
#define ANNOTATION_H

#include <vector>
#include <map>

class annotation{
private:
  std::map<std::string, std::string> diseases; // disease_id : disease label
  std::map<std::string, std::vector<std::string>> symptom_id; // disease id: symptom_id
  std::map<std::string, std::string> symptom_label; // symptom id: symptom label
  bool pathogenic;

public:
  annotation();
  ~annotation();

  int add_disease(std::string uid, std::string label);
  int add_symptom(std::string disease_uid, std::string symptom_uid, std::string label);

  bool get_pathogenic();

  std::string to_json();
};


#endif
