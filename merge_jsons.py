import json
import csv
import os

def Print(node):
        for key, value in node.items():
            if key != 'children':
                print(key)
                print(value)
        if len(node['children']) > 0: 
            for s in node['children']:
                Print(s) 

def Work(base, node, name, num):
        base['file']=[]
        base['file'].append(name)
        for key, value in node.items():
            if key != 'children':
                base[key]=[]
                base[key].append(value)
        if len(node['children']) > 0:
            counter = 0
            base['children']=[]
            for s in node['children']:
                base['children'].append(counter)
                base['children'][counter]={}
                Work(base['children'][counter], s, name, num)
                counter +=1
        else:
            base['children']=[]
 
def Add(base, node, name2):
        base['file'].append(name2)
        for key, value in node.items():
            if key != 'children':
                base[key].append(value)
        if len(node['children']) > 0:
            counter = 0
            for s in node['children']:
                Add(base['children'][counter], s, name2)
                counter +=1 


def ExtractTaxids(base, list1):
    if base['reads'][0]>0:
        list1.append(base['taxid'][0])
    for s in base['children']:
        ExtractTaxids(s, list1)

def addlabel(base):
    base['pathogenic']=False
    base['disease']=False
    for s in base['children']:
        addlabel(s)
        
def highlightPathogen(base, list1):
    for key in list1:
        for kee in key:
            if (str(base['taxid'][0])==kee[10:]):
                base['pathogenic']=True
                base['disease']=list1[0][str(kee)]['DOID_label']
    for s in base['children']:
        highlightPathogen(s, list1)
        
        
count=0
data={}
taxlist=[]
directory = 'C:/Users/garyk/Documents/python_code/pathogen-dashboard/jsons/'
outdir = 'C:/Users/garyk/Documents/python_code/pathogen-dashboard/'
# with open('C:/Users/garyk/Documents/python_code/pathogen-dashboard/database/metagenomic_data_db_info.json') as patho:
#     pathogenlist = json.loads(patho)
pathogenlist = []
with open('C:/Users/garyk/Documents/python_code/pathogen-dashboard/database2/metagenomic_data_db_info.json') as f:
    for line in f:
        pathogenlist.append(json.loads(line))

for filename in os.listdir(directory):
    with open(directory+filename) as json_data:
        d=json.load(json_data)
        name=(count+1)
        if (count==0):
            Work(data, d, name, count)
        else:
            Add(data, d, name)
        count=count+1

ExtractTaxids(data, taxlist)
addlabel(data)
highlightPathogen(data, pathogenlist)

with open(outdir + 'taxlist.csv', 'wb') as csvfile:
    writer = csv.writer(csvfile, delimiter=' ',
                            quotechar='|', quoting=csv.QUOTE_MINIMAL)
    writer.writerow(taxlist) 


with open(outdir + 'dashboard/app/json_output/' + 'data.json', 'w') as outfile:
      json.dump(data, outfile)