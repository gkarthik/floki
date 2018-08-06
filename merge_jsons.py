import json
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
count=0
data={}
directory = 'C:/Users/garyk/Documents/python_code/pathogen-dashboard/jsons/'
outdir = 'C:/Users/garyk/Documents/python_code/pathogen-dashboard/'

for filename in os.listdir(directory):
    with open(directory+filename) as json_data:
        d=json.load(json_data)
        name=str(filename)
        if (count==0):
            Work(data, d, name, count)
        else:
            Add(data, d, name)
        count=count+1
        
with open(outdir + 'dashboard/app/json_output/' + 'data.json', 'w') as outfile:
      json.dump(data, outfile)       