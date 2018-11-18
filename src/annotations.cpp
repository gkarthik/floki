#include <iostream>
#include <sstream>
#include <vector>
#include <map>
#include <string>
#include "annotations.h"

annotation::annotation(): pathogenic(false) {}

annotation::~annotation(){
  
}

int annotation::add_disease(std::string uid, std::string label){
  if(uid.empty() || label.empty()){
    std::cout << "Disease label or id is empty: " << uid << " " << label << std::endl;
    return -1;
  }
  if(!pathogenic)
    pathogenic = true;
  diseases[uid] = label;
  return 0;
}

int annotation::add_symptom(std::string disease_uid, std::string symptom_uid, std::string label){
  if(disease_uid.empty() || symptom_uid.empty() || label.empty()){
    std::cout << "Disease id or symptom id or symptom label is empty: " << disease_uid << " " << symptom_uid << " " << label << std::endl;
    return -1;
  }
  symptom_id[disease_uid].push_back(symptom_uid);
  symptom_label[symptom_uid] = label;
  return 0;
}

bool annotation::get_pathogenic(){
  return pathogenic;
}

std::string annotation::to_json(){
  std::stringstream json;
  json << "\"diseases\":[";
  for(std::map<std::string, std::string>::iterator iter = diseases.begin(); iter != diseases.end(); ++iter){
    json << "{\"id\":\"" << iter->first << "\",\"label\":\"" << iter->second << "\",";
    json << "\"symptoms\": [";
    for(std::vector<std::string>::iterator symp_iter = symptom_id[iter->first].begin(); symp_iter != symptom_id[iter->first].end(); ++symp_iter){
      json << "{";
      json << "\"id\":\"" << (*symp_iter) << "\",";
      json << "\"label\":\"" << symptom_label[*symp_iter] << "\"";
      json << "}";
      if(symp_iter != symptom_id[iter->first].end()-1)
	json << ",";
    } 
    json << "]";
    json << "}";
    if(iter!=(--diseases.end()))
      json << ",";
  }
  json << "]";
  return json.str();
}
